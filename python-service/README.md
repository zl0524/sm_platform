# Python Service (FastAPI)

运行：

```bash
pip install -r requirements.txt
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

接口：
- POST /teach/simulate
- POST /audit/run
- POST /fix/suggest

大模型（DeepSeek）配置：

Windows PowerShell 示例：

```powershell
$env:LLM_API_KEY="你的DeepSeek_API_Key" 
# 可选：自定义接口与模型名（默认 https://api.deepseek.com 与 deepseek-chat）
$env:LLM_BASE_URL="https://api.deepseek.com"
$env:LLM_MODEL="deepseek-chat"
```

## 国密算法支持

本服务使用 `gmssl` 库提供真正的国密算法实现：

- **SM2**: 椭圆曲线公钥密码算法
- **SM3**: 密码杂凑算法（256位输出）
- **SM4**: 分组密码算法（128位分组）

### 验证示例

```python
from gmssl import sm3
result = sm3.sm3_hash([ord(c) for c in 'Hello SM3!'])
# 结果: d2ed97bcbd29e328e82df62c2fc586c69391dd13a09ce0af1019a06bc08115dc
```

教学模块现在使用真实的算法计算结果，确保演示的准确性。


