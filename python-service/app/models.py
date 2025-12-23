from enum import Enum
from typing import List, Optional, Dict, Any
from datetime import datetime
from pydantic import BaseModel


class AlgorithmType(str, Enum):
    SM2 = "SM2"
    SM3 = "SM3"
    SM4 = "SM4"


class LanguageType(str, Enum):
    PYTHON = "PYTHON"
    JAVA = "JAVA"
    JAVASCRIPT = "JAVASCRIPT"
    GO = "GO"
    C = "C"
    CPP = "CPP"


class SeverityLevel(str, Enum):
    INFO = "INFO"
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"


class SimulationRequest(BaseModel):
    algorithm: AlgorithmType
    params: Optional[Dict[str, Any]] = None


class SimulationStep(BaseModel):
    stepKey: str
    title: str
    description: str
    visualData: Optional[Dict[str, Any]] = None


class SimulationResult(BaseModel):
    sessionId: str
    steps: List[SimulationStep]


class CodeAuditRequest(BaseModel):
    sourceFiles: Optional[List[str]] = None
    sourceCode: Optional[str] = None
    language: LanguageType
    algorithm: AlgorithmType
    enableLLM: Optional[bool] = False


class VulnerabilityFinding(BaseModel):
    id: str
    title: str
    description: str
    severity: SeverityLevel
    algorithm: Optional[AlgorithmType] = None
    filePath: Optional[str] = None
    lineStart: Optional[int] = None
    lineEnd: Optional[int] = None
    ruleId: Optional[str] = None


class CodeAuditReport(BaseModel):
    reportId: str
    algorithm: Optional[AlgorithmType] = None
    totalFindings: int
    high: int
    medium: int
    low: int
    findings: List[VulnerabilityFinding]
    llmSummary: Optional[str] = None


class AuditLogRecord(BaseModel):
    """返回给前端查看历史用的审计日志记录模型"""

    id: int
    username: Optional[str] = None
    algorithm: str
    language: str
    totalFindings: int
    high: int
    medium: int
    low: int
    createdAt: datetime


class AuditStatsPerAlgorithm(BaseModel):
    """按算法聚合的审计统计"""

    algorithm: str
    taskCount: int
    totalFindings: int
    high: int
    medium: int
    low: int


class AuditStatsSummary(BaseModel):
    """审计总体统计信息"""

    totalTasks: int
    totalFindings: int
    high: int
    medium: int
    low: int
    perAlgorithm: List[AuditStatsPerAlgorithm]


class FixSuggestionRequest(BaseModel):
    findingId: str
    language: Optional[str] = None
    sourceCode: Optional[str] = None
    enableLLM: Optional[bool] = False


class FixSuggestion(BaseModel):
    findingId: str
    reason: str
    suggestion: str
    codeSnippet: Optional[str] = None
    location: Optional[str] = None

