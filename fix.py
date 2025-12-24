#zl feature
from fastapi import APIRouter
from ..models import FixSuggestionRequest, FixSuggestion
from ..llm_client import LLMClient
import re
from typing import List, Tuple, Optional

router = APIRouter()

def analyze_code_structure(source_code: str, language: str) -> List[Tuple[str, int, str]]:
    """
    分析代码结构，返回 (问题类型, 行号, 问题描述) 的列表
    """
    issues = []
    lines = source_code.split('\n')
    
    for i, line in enumerate(lines, 1):
        line_lower = line.lower().strip()
        
        # 检测硬编码密钥
        if re.search(r'key\s*=\s*["\'][^"\']+["\']', line, re.IGNORECASE):
            issues.append(("硬编码密钥", i, f"第{i}行: {line.strip()}"))
        
        # 检测硬编码IV
        if re.search(r'iv\s*=\s*["\'][^"\']+["\']', line, re.IGNORECASE):
            issues.append(("硬编码IV", i, f"第{i}行: {line.strip()}"))
        
        # 检测固定IV
        if re.search(r'iv\s*=\s*\[.*\]', line, re.IGNORECASE):
            issues.append(("固定IV", i, f"第{i}行: {line.strip()}"))
        
        # 检测不安全的随机数
        if language.upper() == "JAVA" and ("math.random" in line_lower or "new random()" in line_lower):
            issues.append(("不安全随机数", i, f"第{i}行: {line.strip()}"))
        elif language.upper() == "PYTHON" and "random.random" in line_lower:
            issues.append(("不安全随机数", i, f"第{i}行: {line.strip()}"))
        
        # 检测ECB模式
        if "ecb" in line_lower and ("mode" in line_lower or "evp_sm4_ecb" in line_lower):
            issues.append(("ECB模式", i, f"第{i}行: {line.strip()}"))
        
        # 检测缺少IV的CBC模式
        if "cbc" in line_lower and "iv" not in line_lower:
            issues.append(("CBC模式缺少IV", i, f"第{i}行: {line.strip()}"))

    return issues

def generate_smart_code_fix(language: str, issues: List[Tuple[str, int, str]], source_code: str) -> str:
    """
    基于检测到的问题智能生成修复代码
    """
    if not issues:
        return "# 未检测到具体问题，请检查代码"
    
    issue_types = [issue[0] for issue in issues]
    
    # 根据问题类型生成综合修复代码
    if language.upper() == "PYTHON":
        code_parts = []
        code_parts.append("# 修复代码 - 基于检测到的问题")
        code_parts.append("import os")
        code_parts.append("import secrets")
        code_parts.append("")
        
        if "硬编码密钥" in issue_types:
            code_parts.append("def get_sm4_key():")
            code_parts.append("    \"\"\"从环境变量获取SM4密钥\"\"\"")
            code_parts.append("    key = os.environ.get('SM4_KEY')")
            code_parts.append("    if not key:")
            code_parts.append("        raise ValueError('SM4_KEY 环境变量未设置')")
            code_parts.append("    if len(key) != 32:  # SM4密钥长度应为32字节")
            code_parts.append("        raise ValueError('SM4_KEY 长度必须为32字节')")
            code_parts.append("    return key.encode('utf-8')")
            code_parts.append("")
        
        if "硬编码IV" in issue_types or "固定IV" in issue_types:
            code_parts.append("def generate_secure_iv():")
            code_parts.append("    \"\"\"生成安全的随机IV\"\"\"")
            code_parts.append("    return secrets.token_bytes(16)  # SM4 IV长度为16字节")
            code_parts.append("")
        
        if "ECB模式" in issue_types:
            code_parts.append("def sm4_cbc_encrypt(data: bytes, key: bytes) -> tuple:")
            code_parts.append("    \"\"\"使用CBC模式进行SM4加密（推荐替代ECB）\"\"\"")
            code_parts.append("    iv = secrets.token_bytes(16)  # 生成随机IV")
            code_parts.append("    # 这里应该调用实际的SM4 CBC加密库")
            code_parts.append("    # 例如：from gmssl import sm4")
            code_parts.append("    # encrypted = sm4.cbc_encrypt(data, key, iv)")
            code_parts.append("    # return encrypted, iv")
            code_parts.append("    return b'encrypted_data', iv")
            code_parts.append("")
        else:
            code_parts.append("def sm4_encrypt(data: bytes, key: bytes, iv: bytes) -> bytes:")
            code_parts.append("    \"\"\"SM4加密函数\"\"\"")
            code_parts.append("    # 这里应该调用实际的SM4加密库")
            code_parts.append("    # 例如：from gmssl import sm4")
            code_parts.append("    # return sm4.encrypt(data, key, iv)")
            code_parts.append("    return b'encrypted_data'")
            code_parts.append("")
        
        # 添加使用示例
        code_parts.append("# 使用示例")
        if "硬编码密钥" in issue_types:
            code_parts.append("key = get_sm4_key()")
        else:
            code_parts.append("key = os.environ.get('SM4_KEY').encode('utf-8')")
        
        if "硬编码IV" in issue_types or "固定IV" in issue_types:
            code_parts.append("iv = generate_secure_iv()")
            code_parts.append("encrypted_data = sm4_encrypt(b'your_data', key, iv)")
        elif "ECB模式" in issue_types:
            code_parts.append("encrypted_data, iv = sm4_cbc_encrypt(b'your_data', key)")
        else:
            code_parts.append("iv = secrets.token_bytes(16)")
            code_parts.append("encrypted_data = sm4_encrypt(b'your_data', key, iv)")
        
        return "\n".join(code_parts)
    
    elif language.upper() == "JAVA":
        code_parts = []
        code_parts.append("// 修复代码 - 基于检测到的问题")
        code_parts.append("import java.security.SecureRandom;")
        code_parts.append("")
        code_parts.append("public class SM4Security {")
        code_parts.append("    private static final SecureRandom secureRandom = new SecureRandom();")
        code_parts.append("    private static final String SM4_KEY_ENV = \"SM4_KEY\";")
        code_parts.append("")
        
        if "硬编码密钥" in issue_types:
            code_parts.append("    public static byte[] getSM4Key() {")
            code_parts.append("        String keyStr = System.getenv(SM4_KEY_ENV);")
            code_parts.append("        if (keyStr == null || keyStr.isEmpty()) {")
            code_parts.append("            throw new IllegalArgumentException(\"SM4_KEY 环境变量未设置\");")
            code_parts.append("        }")
            code_parts.append("        if (keyStr.length() != 32) {")
            code_parts.append("            throw new IllegalArgumentException(\"SM4_KEY 长度必须为32字节\");")
            code_parts.append("        }")
            code_parts.append("        return keyStr.getBytes();")
            code_parts.append("    }")
            code_parts.append("")
        
        if "硬编码IV" in issue_types or "固定IV" in issue_types or "不安全随机数" in issue_types:
            code_parts.append("    public static byte[] generateSecureIV() {")
            code_parts.append("        byte[] iv = new byte[16];")
            code_parts.append("        secureRandom.nextBytes(iv);")
            code_parts.append("        return iv;")
            code_parts.append("    }")
            code_parts.append("")
        
        if "ECB模式" in issue_types:
            code_parts.append("    public static byte[] sm4CbcEncrypt(byte[] data, byte[] key) {")
            code_parts.append("        byte[] iv = generateSecureIV();")
            code_parts.append("        // 这里应该调用实际的SM4 CBC加密库")
            code_parts.append("        // 例如：使用BouncyCastle的SM4实现")
            code_parts.append("        return data; // 示例返回")
            code_parts.append("    }")
        else:
            code_parts.append("    public static byte[] sm4Encrypt(byte[] data, byte[] key, byte[] iv) {")
            code_parts.append("        // 这里应该调用实际的SM4加密库")
            code_parts.append("        return data; // 示例返回")
            code_parts.append("    }")
        
        code_parts.append("}")
        return "\n".join(code_parts)
    
    elif language.upper() == "C":
        code_parts = []
        code_parts.append("// 修复代码 - 基于检测到的问题")
        code_parts.append("#include <stdio.h>")
        code_parts.append("#include <stdlib.h>")
        code_parts.append("#include <string.h>")
        code_parts.append("#include <openssl/rand.h>")
        code_parts.append("")
        
        if "硬编码密钥" in issue_types:
            code_parts.append("int get_sm4_key_from_env(unsigned char *key, size_t key_len) {")
            code_parts.append("    char *key_str = getenv(\"SM4_KEY\");")
            code_parts.append("    if (!key_str) {")
            code_parts.append("        fprintf(stderr, \"SM4_KEY 环境变量未设置\\n\");")
            code_parts.append("        return -1;")
            code_parts.append("    }")
            code_parts.append("    if (strlen(key_str) != 32) {")
            code_parts.append("        fprintf(stderr, \"SM4_KEY 长度必须为32字节\\n\");")
            code_parts.append("        return -1;")
            code_parts.append("    }")
            code_parts.append("    memcpy(key, key_str, key_len);")
            code_parts.append("    return 0;")
            code_parts.append("}")
            code_parts.append("")
        
        if "硬编码IV" in issue_types or "固定IV" in issue_types:
            code_parts.append("int generate_secure_iv(unsigned char *iv, size_t iv_len) {")
            code_parts.append("    if (RAND_bytes(iv, iv_len) != 1) {")
            code_parts.append("        fprintf(stderr, \"生成随机IV失败\\n\");")
            code_parts.append("        return -1;")
            code_parts.append("    }")
            code_parts.append("    return 0;")
            code_parts.append("}")
            code_parts.append("")
        
        code_parts.append("// 使用示例")
        code_parts.append("int main() {")
        code_parts.append("    unsigned char key[32];")
        code_parts.append("    unsigned char iv[16];")
        code_parts.append("")
        
        if "硬编码密钥" in issue_types:
            code_parts.append("    if (get_sm4_key_from_env(key, sizeof(key)) != 0) {")
            code_parts.append("        return 1;")
            code_parts.append("    }")
            code_parts.append("")
        
        code_parts.append("    if (generate_secure_iv(iv, sizeof(iv)) != 0) {")
        code_parts.append("        return 1;")
        code_parts.append("    }")
        code_parts.append("")
        code_parts.append("    // 这里应该调用实际的SM4加密函数")
        code_parts.append("    // sm4_encrypt(data, key, iv);")
        code_parts.append("")
        code_parts.append("    return 0;")
        code_parts.append("}")
        
        return "\n".join(code_parts)
    
    # 默认返回通用修复建议
    return f"# 检测到问题: {', '.join(set(issue_types))}\n# 请根据具体问题类型选择合适的修复方案"

def generate_detailed_prompt(finding_id: str, language: str, source_code: str, issues: List[Tuple[str, int, str]]) -> str:
    """
    生成详细的LLM提示词
    """
    issues_text = "\n".join([f"- {issue[0]}: {issue[2]}" for issue in issues])
    
    # 生成智能修复代码作为参考
    smart_code = generate_smart_code_fix(language, issues, source_code)
    
    prompt = f"""你是国密算法安全修复专家。请基于以下信息生成详细的修复建议：

漏洞ID: {finding_id}
编程语言: {language}
源码:
```
{source_code}
```

检测到的问题:
{issues_text}

智能修复代码参考:
```
{smart_code}
```

请严格按照以下格式输出，不要添加任何其他内容：

漏洞定位: [具体描述漏洞在代码中的位置，包括文件名、函数名、行号等]
原因分析: [详细分析漏洞产生的原因，包括安全风险和技术原理]
修复建议: [提供具体的修复步骤和最佳实践建议]
修复后代码示例: [提供完整的修复后代码，确保语法正确且符合国密规范]

注意：
1. 修复后的代码必须语法正确
2. 必须使用安全的随机数生成器
3. 密钥必须从环境变量或安全存储中获取
4. IV必须每次加密都重新生成
5. 避免使用ECB模式，推荐CBC或CTR模式
6. 参考上面的智能修复代码，但要根据实际源码进行调整
"""
    return prompt

@router.post("/suggest", response_model=FixSuggestion)
def suggest(req: FixSuggestionRequest):
    """
    智能修复建议接口：返回漏洞定位、原因分析、修复代码。
    """
    language = getattr(req, 'language', 'PYTHON').upper()
    source_code = (req.sourceCode or "").strip()
    
    # 分析代码结构，找出具体问题位置
    issues = analyze_code_structure(source_code, language)
    
    # 默认值兜底
    reason = "疑似硬编码密钥/IV，不符合国密规范要求"
    suggestion = "漏洞定位：未知\n原因分析：疑似存在硬编码问题\n修复建议：应使用安全随机数与密钥管理系统。"
    code = "# 示例修复代码（Python）\nimport os\nkey = os.environ.get('SM_KEY')"
    location = "未知"
    
    # 如果有检测到具体问题，更新默认值
    if issues:
        issue_types = [issue[0] for issue in issues]
        issue_locations = [issue[2] for issue in issues]
        issue_lines = [issue[1] for issue in issues]
        
        # 生成详细的位置信息
        location_details = []
        for i, (issue_type, line_num, location_desc) in enumerate(issues):
            location_details.append(f"第{line_num}行: {issue_type} - {location_desc}")
        
        location = "\n".join(location_details)
        
        if "硬编码密钥" in issue_types:
            reason = "检测到硬编码密钥，存在严重安全风险"
            suggestion = (
                "漏洞定位：代码中存在硬编码的密钥\n"
                "原因分析：硬编码密钥容易被攻击者提取，威胁系统安全\n"
                "修复建议：\n"
                "1. 使用安全密钥管理系统\n"
                "2. 从环境变量读取密钥\n"
                "3. 定期轮换密钥"
            )
        elif "硬编码IV" in issue_types or "固定IV" in issue_types:
            reason = "检测到硬编码或固定IV，存在安全风险"
            suggestion = (
                "漏洞定位：代码中存在硬编码或固定IV\n"
                "原因分析：固定IV导致加密模式可预测，降低安全性\n"
                "修复建议：\n"
                "1. 使用安全随机数生成IV\n"
                "2. 每次加密使用不同IV"
            )
        elif "ECB模式" in issue_types:
            reason = "检测到ECB模式使用，存在明文结构泄露风险"
            suggestion = (
                "漏洞定位：使用了ECB加密模式\n"
                "原因分析：ECB模式会泄露明文结构信息\n"
                "修复建议：\n"
                "1. 使用CBC或CTR模式\n"
                "2. 确保每次加密使用不同的IV"
            )
        elif "CBC模式缺少IV" in issue_types:
            reason = "CBC模式缺少IV初始化"
            suggestion = (
                "漏洞定位：CBC模式未正确初始化IV\n"
                "原因分析：CBC模式必须使用随机IV\n"
                "修复建议：\n"
                "1. 使用安全随机数生成IV\n"
                "2. 确保IV长度正确（16字节）"
            )
        elif "不安全随机数" in issue_types:
            reason = "检测到不安全的随机数生成方法"
            suggestion = (
                "漏洞定位：使用了不安全的随机数生成器\n"
                "原因分析：不安全的随机数可能导致密钥可预测\n"
                "修复建议：\n"
                "1. 使用密码学安全的随机数生成器\n"
                "2. 避免使用Math.random()或random.random()\n"
                "3. 使用SecureRandom或secrets模块"
            )

    # 生成基础修复代码
    if issues:
        smart_code = generate_smart_code_fix(language, issues, source_code)
        if smart_code and smart_code != "# 未检测到具体问题，请检查代码":
            code = smart_code

    # 如果启用LLM，使用LLM增强修复建议
    if req.enableLLM:
        try:
            client = LLMClient()
            prompt = generate_detailed_prompt(req.findingId, language, source_code, issues)
            out = client.chat(prompt, system="你是国密算法安全修复专家，具有丰富的密码学和安全编程经验。请提供准确、详细、实用的修复建议。")
            
            print(f"[Fix] LLM 返回: {out[:200]}...")  # 调试信息
            
            # 解析LLM返回结果
            if out and not out.startswith("[LLM error]") and not out.startswith("[LLM disabled"):
                # 按行分割并解析
                lines = out.split('\n')
                vuln, cause, fix, code_part = "", "", "", ""
                
                current_section = None
                content_lines = []
                
                for line in lines:
                    line = line.strip()
                    if line.startswith("漏洞定位:"):
                        current_section = "location"
                        content_lines = [line.replace("漏洞定位:", "").strip()]
                    elif line.startswith("原因分析:"):
                        current_section = "reason"
                        content_lines = [line.replace("原因分析:", "").strip()]
                    elif line.startswith("修复建议:"):
                        current_section = "suggestion"
                        content_lines = [line.replace("修复建议:", "").strip()]
                    elif line.startswith("修复后代码示例:"):
                        current_section = "code"
                        content_lines = [line.replace("修复后代码示例:", "").strip()]
                    elif line and current_section:
                        content_lines.append(line)
                    elif not line and current_section:
                        # 空行，结束当前段落
                        if current_section == "location" and content_lines:
                            vuln = "\n".join(content_lines).strip()
                        elif current_section == "reason" and content_lines:
                            cause = "\n".join(content_lines).strip()
                        elif current_section == "suggestion" and content_lines:
                            fix = "\n".join(content_lines).strip()
                        elif current_section == "code" and content_lines:
                            code_part = "\n".join(content_lines).strip()
                        current_section = None
                        content_lines = []
                
                # 处理最后一个段落
                if current_section == "location" and content_lines:
                    vuln = "\n".join(content_lines).strip()
                elif current_section == "reason" and content_lines:
                    cause = "\n".join(content_lines).strip()
                elif current_section == "suggestion" and content_lines:
                    fix = "\n".join(content_lines).strip()
                elif current_section == "code" and content_lines:
                    code_part = "\n".join(content_lines).strip()
                
                # 更新结果
                if vuln:
                    location = vuln
                if cause:
                    reason = cause
                if fix:
                    suggestion = fix
                if code_part:
                    code = code_part
            else:
                print(f"[Fix] LLM 调用失败或未配置: {out}")

        except Exception as e:
            print(f"[Fix] LLM 调用失败: {e}")

    return FixSuggestion(
        findingId=req.findingId,
        reason=reason,
        suggestion=suggestion,
        codeSnippet=code,
        location=location
    )
