# KEYMAN VERSION
from fastapi import APIRouter, Depends, Query
from uuid import uuid4
from typing import List, Dict, Optional
from ..models import (
    CodeAuditRequest,
    CodeAuditReport,
    VulnerabilityFinding,
    SeverityLevel,
    AuditLogRecord,
    AuditStatsSummary,
    AuditStatsPerAlgorithm,
    AlgorithmType,
    LanguageType,
)
from ..rules import (
    RuleEngine,
    HardcodedKeyRule,
    Sm4IvReuseRule,
    Sm2KeyGenRandomnessRule,
    Sm3PaddingRule,
    Sm4ModeParamRule,
)
from ..llm_client import LLMClient
from sqlalchemy.orm import Session
from ..database import get_db
from ..audit_log_models import AuditLog

# 创建API路由
router = APIRouter()


@router.post("/run", response_model=CodeAuditReport)
def run(
    req: CodeAuditRequest,  # 审计请求对象
    db: Session = Depends(get_db),  # 数据库会话依赖
):
    """
    运行代码审计接口
    对传入的源代码进行安全审计，检查国密算法相关的安全漏洞
    """
    # 初始化规则引擎并注册各种安全检查规则
    engine = (RuleEngine()
              .register(HardcodedKeyRule())  # 硬编码密钥检查规则
              .register(Sm4IvReuseRule())  # SM4算法IV复用检查规则
              .register(Sm2KeyGenRandomnessRule())  # SM2密钥生成随机性检查规则
              .register(Sm3PaddingRule())  # SM3填充检查规则
              .register(Sm4ModeParamRule()))  # SM4模式参数检查规则
    
    # 执行所有规则检查，获取违规结果
    hits = engine.evaluate_all(req.algorithm, req.language, req.sourceCode or "")
    
    # 收集所有安全发现项
    findings = []
    for rule, result in hits:
        findings.append(
            VulnerabilityFinding(
                id=str(uuid4()),  # 生成唯一ID
                title=rule.title(),  # 规则标题
                description=result.detail or rule.description(),  # 详细描述或规则描述
                severity=rule.severity(),  # 严重程度
                ruleId=rule.id(),  # 规则ID
            )
        )
    
    # 统计各严重程度的发现数量
    high = sum(1 for f in findings if f.severity == SeverityLevel.HIGH)  # 高危漏洞数量
    medium = sum(1 for f in findings if f.severity == SeverityLevel.MEDIUM)  # 中危漏洞数量
    low = sum(1 for f in findings if f.severity == SeverityLevel.LOW)  # 低危漏洞数量

    # 记录审计日志到数据库，便于后续统计与历史查看（匿名用户也允许）
    try:
        log = AuditLog(
            username=None,  # 匿名用户
            algorithm=req.algorithm.value if hasattr(req.algorithm, "value") else str(
                req.algorithm or ""
            ),  # 算法类型
            language=req.language.value if hasattr(req.language, "value") else str(
                req.language or ""
            ),  # 编程语言类型
            total_findings=len(findings),  # 总发现数量
            high=high,  # 高危数量
            medium=medium,  # 中危数量
            low=low,  # 低危数量
        )
        db.add(log)  # 添加到数据库
        db.commit()  # 提交事务
    except Exception:
        # 日志写入失败不影响主流程，回滚事务
        db.rollback()
    
    # 默认LLM摘要内容
    llm_summary = "示例：请遵循国密规范，避免硬编码与IV复用。"
    
    # 如果启用了LLM功能，调用大语言模型生成摘要
    if req.enableLLM:
        client = LLMClient()  # 创建LLM客户端
        # 构建提示词，包含发现的安全问题
        prompt = (
            "你是国密算法安全审计专家，请基于如下规则发现项，用中文生成简明的风险摘要与建议：\n\n"
            f"Findings: {findings}"
        )
        # 调用LLM生成安全建议
        out = client.chat(prompt, system="国密安全审计专家，简洁、准确，列出重点")
        if out:
            llm_summary = out  # 更新摘要内容
    
    # 返回审计报告
    return CodeAuditReport(
        reportId=str(uuid4()),  # 报告唯一ID
        algorithm=req.algorithm,  # 审计的算法类型
        totalFindings=len(findings),  # 总发现数量
        high=high,  # 高危漏洞数量
        medium=medium,  # 中危漏洞数量
        low=low,  # 低危漏洞数量
        findings=findings,  # 详细发现列表
        llmSummary=llm_summary,  # LLM生成的安全建议摘要
    )


@router.get("/history", response_model=List[AuditLogRecord])
def history(
    skip: int = Query(0, ge=0, description="从第几条记录开始（分页偏移量）"),  # 分页起始位置
    limit: int = Query(20, ge=1, le=100, description="返回多少条记录"),  # 分页大小
    algorithm: Optional[AlgorithmType] = Query(None, description="按算法过滤，如 SM2/SM3/SM4"),  # 算法类型过滤
    language: Optional[LanguageType] = Query(None, description="按语言过滤，如 PYTHON/JAVA"),  # 语言类型过滤
    db: Session = Depends(get_db),  # 数据库会话依赖
):
    """
    审计历史列表接口：从 audit_logs 表中按时间倒序查询记录。
    支持分页、按算法类型和编程语言类型过滤。
    """
    # 构建基础查询，按创建时间倒序排列
    query = db.query(AuditLog).order_by(AuditLog.created_at.desc())
    
    # 根据算法类型过滤
    if algorithm is not None:
        query = query.filter(AuditLog.algorithm == algorithm.value)
    
    # 根据编程语言类型过滤
    if language is not None:
        query = query.filter(AuditLog.language == language.value)

    # 执行查询并获取记录
    logs = query.offset(skip).limit(limit).all()
    
    # 将数据库记录转换为API响应格式
    return [
        AuditLogRecord(
            id=log.id,  # 日志记录ID
            username=log.username,  # 用户名
            algorithm=log.algorithm,  # 算法类型
            language=log.language,  # 编程语言类型
            totalFindings=log.total_findings,  # 总发现数量
            high=log.high,  # 高危数量
            medium=log.medium,  # 中危数量
            low=log.low,  # 低危数量
            createdAt=log.created_at,  # 创建时间
        )
        for log in logs
    ]


@router.get("/stats/summary", response_model=AuditStatsSummary)
def stats_summary(
    db: Session = Depends(get_db),  # 数据库会话依赖
):
    """
    审计统计汇总接口：返回总审计次数、总发现数量，以及按算法的聚合统计。
    提供全局审计活动的统计信息。
    """
    # 查询所有审计日志记录
    logs: List[AuditLog] = db.query(AuditLog).all()

    # 计算总体统计信息
    total_tasks = len(logs)  # 总审计任务数
    total_findings = sum(l.total_findings for l in logs)  # 总发现数量
    high = sum(l.high for l in logs)  # 总高危数量
    medium = sum(l.medium for l in logs)  # 总中危数量
    low = sum(l.low for l in logs)  # 总低危数量

    # 按算法类型统计各项数据
    per_algorithm_map: Dict[str, AuditStatsPerAlgorithm] = {}
    for l in logs:
        # 获取算法类型，空值设为"UNKNOWN"
        alg = l.algorithm or "UNKNOWN"
        
        # 如果该算法类型尚未在统计字典中，初始化统计对象
        if alg not in per_algorithm_map:
            per_algorithm_map[alg] = AuditStatsPerAlgorithm(
                algorithm=alg,  # 算法名称
                taskCount=0,  # 任务数量
                totalFindings=0,  # 发现总数
                high=0,  # 高危数量
                medium=0,  # 中危数量
                low=0,  # 低危数量
            )
        
        # 获取该算法的统计对象
        item = per_algorithm_map[alg]
        # 累加统计信息
        item.taskCount += 1  # 增加任务数
        item.totalFindings += l.total_findings  # 累加发现总数
        item.high += l.high  # 累加高危数量
        item.medium += l.medium  # 累加中危数量
        item.low += l.low  # 累加低危数量

    # 返回统计汇总结果
    return AuditStatsSummary(
        totalTasks=total_tasks,  # 总任务数
        totalFindings=total_findings,  # 总发现数量
        high=high,  # 总高危数量
        medium=medium,  # 总中危数量
        low=low,  # 总低危数量
        perAlgorithm=list(per_algorithm_map.values()),  # 按算法分类的统计列表
    )