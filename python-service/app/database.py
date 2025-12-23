import os
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv

load_dotenv()

# 数据库配置
DB_HOST = os.getenv("DB_HOST", "localhost")
DB_PORT = os.getenv("DB_PORT", "3306")
DB_USER = os.getenv("DB_USER", "root")
DB_PASSWORD = os.getenv("DB_PASSWORD", "")
DB_NAME = os.getenv("DB_NAME", "sm_platform")

# 构建数据库URL
# 支持MySQL 5.7+ 和 MySQL 8.0+
DATABASE_URL = f"mysql+pymysql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}?charset=utf8mb4"

# 创建数据库引擎
engine = create_engine(
    DATABASE_URL,
    pool_pre_ping=True,  # 连接前检查连接是否有效
    pool_recycle=3600,   # 1小时后回收连接
    echo=False,          # 设置为True可以看到SQL日志
)

# 创建会话工厂
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# 创建基础模型类
Base = declarative_base()


# 依赖注入：获取数据库会话
def get_db():
    """获取数据库会话，用于依赖注入"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()








