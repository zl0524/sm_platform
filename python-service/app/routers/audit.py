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

router = APIRouter()


@router.post("/run", response_model=CodeAuditReport)
def run(
    req: CodeAuditRequest,
    db: Session = Depends(get_db),
):
    engine = (RuleEngine()
              .register(HardcodedKeyRule())
              .register(Sm4IvReuseRule())
              .register(Sm2KeyGenRandomnessRule())
              .register(Sm3PaddingRule())
              .register(Sm4ModeParamRule()))
    hits = engine.evaluate_all(req.algorithm, req.language, req.sourceCode or "")
    findings = []
    for rule, result in hits:
        findings.append(
            VulnerabilityFinding(
                id=str(uuid4()),
                title=rule.title(),
                description=result.detail or rule.description(),
                severity=rule.severity(),
                ruleId=rule.id(),
            )
        )
    high = sum(1 for f in findings if f.severity == SeverityLevel.HIGH)
    medium = sum(1 for f in findings if f.severity == SeverityLevel.MEDIUM)
    low = sum(1 for f in findings if f.severity == SeverityLevel.LOW)

    # 写入审计日志表，便于后续统计与历史查看（匿名用户也允许）
    try:
        log = AuditLog(
            username=None,
            algorithm=req.algorithm.value if hasattr(req.algorithm, "value") else str(
                req.algorithm or ""
            ),
            language=req.language.value if hasattr(req.language, "value") else str(
                req.language or ""
            ),
            total_findings=len(findings),
            high=high,
            medium=medium,
            low=low,
        )
        db.add(log)
        db.commit()
    except Exception:
        # 不因为日志写入失败影响主流程
        db.rollback()
    llm_summary = "示例：请遵循国密规范，避免硬编码与IV复用。"
    if req.enableLLM:
        client = LLMClient()
        prompt = (
            "你是国密算法安全审计专家，请基于如下规则发现项，用中文生成简明的风险摘要与建议：\n\n"
            f"Findings: {findings}"
        )
        out = client.chat(prompt, system="国密安全审计专家，简洁、准确，列出重点")
        if out:
            llm_summary = out
    return CodeAuditReport(
        reportId=str(uuid4()),
        algorithm=req.algorithm,
        totalFindings=len(findings),
        high=high,
        medium=medium,
        low=low,
        findings=findings,
        llmSummary=llm_summary,
    )


@router.get("/history", response_model=List[AuditLogRecord])
def history(
    skip: int = Query(0, ge=0, description="从第几条记录开始（分页偏移量）"),
    limit: int = Query(20, ge=1, le=100, description="返回多少条记录"),
    algorithm: Optional[AlgorithmType] = Query(None, description="按算法过滤，如 SM2/SM3/SM4"),
    language: Optional[LanguageType] = Query(None, description="按语言过滤，如 PYTHON/JAVA"),
    db: Session = Depends(get_db),
):
    """
    审计历史列表接口：从 audit_logs 表中按时间倒序查询记录。
    """
    query = db.query(AuditLog).order_by(AuditLog.created_at.desc())
    if algorithm is not None:
        query = query.filter(AuditLog.algorithm == algorithm.value)
    if language is not None:
        query = query.filter(AuditLog.language == language.value)

    logs = query.offset(skip).limit(limit).all()
    return [
        AuditLogRecord(
            id=log.id,
            username=log.username,
            algorithm=log.algorithm,
            language=log.language,
            totalFindings=log.total_findings,
            high=log.high,
            medium=log.medium,
            low=log.low,
            createdAt=log.created_at,
        )
        for log in logs
    ]


@router.get("/stats/summary", response_model=AuditStatsSummary)
def stats_summary(
    db: Session = Depends(get_db),
):
    """
    审计统计汇总接口：返回总审计次数、总发现数量，以及按算法的聚合统计。
    """
    logs: List[AuditLog] = db.query(AuditLog).all()

    total_tasks = len(logs)
    total_findings = sum(l.total_findings for l in logs)
    high = sum(l.high for l in logs)
    medium = sum(l.medium for l in logs)
    low = sum(l.low for l in logs)

    per_algorithm_map: Dict[str, AuditStatsPerAlgorithm] = {}
    for l in logs:
        alg = l.algorithm or "UNKNOWN"
        if alg not in per_algorithm_map:
            per_algorithm_map[alg] = AuditStatsPerAlgorithm(
                algorithm=alg,
                taskCount=0,
                totalFindings=0,
                high=0,
                medium=0,
                low=0,
            )
        item = per_algorithm_map[alg]
        item.taskCount += 1
        item.totalFindings += l.total_findings
        item.high += l.high
        item.medium += l.medium
        item.low += l.low

    return AuditStatsSummary(
        totalTasks=total_tasks,
        totalFindings=total_findings,
        high=high,
        medium=medium,
        low=low,
        perAlgorithm=list(per_algorithm_map.values()),
    )


