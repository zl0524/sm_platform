"""
数据库初始化脚本
用于创建表结构和插入初始数据
"""
import os
from sqlalchemy import create_engine, text
from passlib.context import CryptContext
from dotenv import load_dotenv

load_dotenv()

# 密码加密上下文
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# 数据库配置
DB_HOST = os.getenv("DB_HOST", "localhost")
DB_PORT = os.getenv("DB_PORT", "3306")
DB_USER = os.getenv("DB_USER", "root")
DB_PASSWORD = os.getenv("DB_PASSWORD", "")
DB_NAME = os.getenv("DB_NAME", "sm_platform")

# 构建数据库URL（不指定数据库名，用于创建数据库）
DATABASE_URL = f"mysql+pymysql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}"

def init_database():
    """初始化数据库"""
    print("正在初始化数据库...")
    
    # 创建数据库引擎（不指定数据库）
    engine = create_engine(DATABASE_URL, echo=False)
    
    try:
        with engine.connect() as conn:
            # 创建数据库（如果不存在）
            conn.execute(text(f"CREATE DATABASE IF NOT EXISTS `{DB_NAME}` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci"))
            conn.commit()
            print(f"✓ 数据库 {DB_NAME} 创建成功")
    except Exception as e:
        print(f"✗ 创建数据库失败: {e}")
        return
    
    # 切换到目标数据库
    DATABASE_URL_WITH_DB = f"mysql+pymysql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}?charset=utf8mb4"
    engine = create_engine(DATABASE_URL_WITH_DB, echo=False)
    
    # 导入模型并创建表
    from app.database import Base
    from app.db_models import User
    
    try:
        Base.metadata.create_all(bind=engine)
        print("✓ 数据表创建成功")
    except Exception as e:
        print(f"✗ 创建数据表失败: {e}")
        return
    
    # 插入初始用户数据
    try:
        with engine.connect() as conn:
            # 检查是否已有用户
            result = conn.execute(text("SELECT COUNT(*) as count FROM users"))
            count = result.fetchone()[0]
            
            if count == 0:
                # 生成密码哈希
                user_password_hash = pwd_context.hash("user123")
                admin_password_hash = pwd_context.hash("admin123")
                
                # 插入初始用户
                conn.execute(text("""
                    INSERT INTO users (username, password, role, is_active, failed_login_attempts, locked_until) 
                    VALUES 
                    ('user', :user_pwd, 'user', TRUE, 0, NULL),
                    ('admin', :admin_pwd, 'admin', TRUE, 0, NULL)
                """), {
                    "user_pwd": user_password_hash,
                    "admin_pwd": admin_password_hash
                })
                conn.commit()
                print("✓ 初始用户数据插入成功")
                print("  默认账号: user / user123")
                print("  默认账号: admin / admin123")
            else:
                print(f"✓ 数据库已有 {count} 个用户，跳过初始化")
    except Exception as e:
        print(f"✗ 插入初始数据失败: {e}")
        return
    
    print("数据库初始化完成！")


if __name__ == "__main__":
    init_database()







