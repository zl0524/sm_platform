from sqlalchemy import Column, Integer, String, DateTime
from sqlalchemy.sql import func

from .database import Base


class AuditLog(Base):
    """审计日志表：记录每次代码审计的结果概要，便于统计与追踪。"""

    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    username = Column(String(50), nullable=True, index=True, comment="执行审计的用户名（匿名则为空）")
    algorithm = Column(String(20), nullable=False, comment="审计使用的算法，如 SM2/SM3/SM4")
    language = Column(String(20), nullable=False, comment="被审计源码语言，如 PYTHON/JAVA")
    total_findings = Column(Integer, nullable=False, default=0, comment="发现问题总数")
    high = Column(Integer, nullable=False, default=0, comment="高危数量")
    medium = Column(Integer, nullable=False, default=0, comment="中危数量")
    low = Column(Integer, nullable=False, default=0, comment="低危数量")
    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
        comment="审计时间",
    )

    def __repr__(self) -> str:
        return (
            f"<AuditLog(username={self.username!r}, algorithm={self.algorithm!r}, "
            f"language={self.language!r}, total={self.total_findings})>"
        )


