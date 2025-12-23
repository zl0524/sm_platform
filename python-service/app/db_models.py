from sqlalchemy import Column, Integer, String, DateTime, Boolean
from sqlalchemy.sql import func
from .database import Base


class User(Base):
    """用户表模型"""
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    username = Column(String(50), unique=True, index=True, nullable=False, comment="用户名")
    password = Column(String(255), nullable=False, comment="密码哈希")
    role = Column(String(20), nullable=False, default="user", comment="用户角色: user/admin")
    is_active = Column(Boolean, default=True, nullable=False, comment="是否激活")
    failed_login_attempts = Column(Integer, default=0, nullable=False, comment="密码错误次数")
    locked_until = Column(DateTime(timezone=True), nullable=True, comment="账号锁定截止时间")
    created_at = Column(DateTime(timezone=True), server_default=func.now(), comment="创建时间")
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), comment="更新时间")

    def __repr__(self):
        return f"<User(username='{self.username}', role='{self.role}')>"







