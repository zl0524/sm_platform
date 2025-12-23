import os
from datetime import datetime, timedelta
from typing import Optional, Tuple, Dict, Any

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from pydantic import BaseModel
from sqlalchemy.orm import Session
from sqlalchemy.exc import OperationalError, SQLAlchemyError
from passlib.context import CryptContext
import traceback

from .database import get_db
from .db_models import User as UserModel


router = APIRouter()


# === 安全配置 ===
SECRET_KEY = os.getenv("AUTH_SECRET_KEY", "change-this-secret-key")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "120"))

# 登录安全配置
MAX_LOGIN_ATTEMPTS = 5  # 最大密码错误次数
LOCKOUT_DURATION_MINUTES = 10  # 账号锁定时长（分钟）

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")

# 密码加密上下文
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class User(BaseModel):
    username: str
    role: str


class UserInDB(User):
    password: str


class LoginRequest(BaseModel):
    username: str
    password: str


class LoginErrorResponse(BaseModel):
    error_code: str
    detail: str
    remaining_attempts: Optional[int] = None
    locked_until: Optional[datetime] = None


def get_user_by_username(db: Session, username: str) -> Optional[UserModel]:
    """从数据库获取用户"""
    try:
        return db.query(UserModel).filter(UserModel.username == username).first()
    except (OperationalError, SQLAlchemyError) as e:
        # 重新抛出异常，让上层处理
        raise


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """验证密码"""
    return pwd_context.verify(plain_password, hashed_password)


def get_user(db: Session, username: str) -> Optional[UserInDB]:
    """获取用户信息（用于兼容性）"""
    try:
        user = get_user_by_username(db, username)
        if not user or not user.is_active:
            return None
        return UserInDB(username=user.username, password=user.password, role=user.role)
    except (OperationalError, SQLAlchemyError):
        # 重新抛出异常，让上层处理
        raise


def check_account_locked(db: Session, user: UserModel) -> Tuple[bool, Optional[datetime]]:
    """检查账号是否被锁定"""
    if user.locked_until is None:
        return False, None
    
    # 检查锁定时间是否已过期
    if datetime.utcnow() >= user.locked_until:
        # 锁定已过期，重置锁定状态
        user.locked_until = None
        user.failed_login_attempts = 0
        db.commit()
        return False, None
    
    return True, user.locked_until


def reset_failed_attempts(db: Session, user: UserModel):
    """重置密码错误次数"""
    user.failed_login_attempts = 0
    user.locked_until = None
    db.commit()


def increment_failed_attempts(db: Session, user: UserModel):
    """增加密码错误次数，如果达到阈值则锁定账号"""
    user.failed_login_attempts += 1
    
    if user.failed_login_attempts >= MAX_LOGIN_ATTEMPTS:
        # 锁定账号
        user.locked_until = datetime.utcnow() + timedelta(minutes=LOCKOUT_DURATION_MINUTES)
    
    db.commit()


def authenticate_user(db: Session, username: str, password: str) -> Tuple[Optional[UserInDB], Optional[str], Optional[Dict[str, Any]]]:
    """
    验证用户身份
    返回: (用户对象, 错误代码, 错误详情字典)
    错误代码: None=成功, "ACCOUNT_NOT_FOUND"=账号不存在, "PASSWORD_ERROR"=密码错误, "ACCOUNT_LOCKED"=账号锁定
    """
    try:
        user = get_user_by_username(db, username)
        
        # 账号不存在
        if not user:
            return None, "ACCOUNT_NOT_FOUND", None
        
        # 检查账号是否激活
        if not user.is_active:
            return None, "ACCOUNT_DISABLED", {"detail": "账号已被禁用"}
        
        # 检查账号是否被锁定
        is_locked, locked_until = check_account_locked(db, user)
        if is_locked:
            # 计算剩余锁定时间（分钟）
            remaining_minutes = int((locked_until - datetime.utcnow()).total_seconds() / 60) + 1
            return None, "ACCOUNT_LOCKED", {
                "detail": f"账号已锁定，请{remaining_minutes}分钟后重试",
                "locked_until": locked_until.isoformat() if locked_until else None
            }
        
        # 验证密码
        if not verify_password(password, user.password):
            # 密码错误，增加错误次数
            increment_failed_attempts(db, user)
            
            # 重新获取用户以获取最新的错误次数
            db.refresh(user)
            remaining_attempts = MAX_LOGIN_ATTEMPTS - user.failed_login_attempts
            
            # 如果刚刚被锁定
            if user.locked_until:
                remaining_minutes = int((user.locked_until - datetime.utcnow()).total_seconds() / 60) + 1
                return None, "ACCOUNT_LOCKED", {
                    "detail": f"密码错误次数过多，账号已锁定，请{remaining_minutes}分钟后重试",
                    "locked_until": user.locked_until.isoformat() if user.locked_until else None
                }
            
            return None, "PASSWORD_ERROR", {
                "detail": f"密码错误，剩余{remaining_attempts}次机会",
                "remaining_attempts": remaining_attempts
            }
        
        # 密码正确，重置错误次数
        reset_failed_attempts(db, user)
        return UserInDB(username=user.username, password=user.password, role=user.role), None, None
        
    except (OperationalError, SQLAlchemyError):
        # 重新抛出异常，让上层处理
        raise


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


async def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="无法验证凭证",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        role: str = payload.get("role")
        if username is None or role is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception

    try:
        user_in_db = get_user(db, username)
        if user_in_db is None:
            raise credentials_exception
        return User(username=user_in_db.username, role=user_in_db.role)
    except OperationalError as e:
        # 数据库连接错误
        error_msg = str(e)
        if "Can't connect to MySQL server" in error_msg or "无法连接" in error_msg:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="数据库连接失败，请检查 MySQL 服务是否已启动",
            )
        else:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"数据库操作失败: {error_msg}",
            )
    except SQLAlchemyError as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"数据库错误: {str(e)}",
        )


async def get_current_admin(current_user: User = Depends(get_current_user)) -> User:
    if current_user.role != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="需要管理员权限")
    return current_user


@router.post("/auth/login", response_model=Token)
async def login(request: LoginRequest, db: Session = Depends(get_db)):
    """
    用户登录，返回访问令牌。

    示例账号：
    - 普通用户：user / user123
    - 管理员：admin / admin123
    
    错误响应：
    - ACCOUNT_NOT_FOUND: 账号不存在，请注册
    - PASSWORD_ERROR: 密码错误，剩余X次机会
    - ACCOUNT_LOCKED: 账号已锁定，请X分钟后重试
    """
    try:
        user, error_code, error_detail = authenticate_user(db, request.username, request.password)
        
        if error_code == "ACCOUNT_NOT_FOUND":
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="账号不存在，请注册",
            )
        elif error_code == "PASSWORD_ERROR":
            remaining = error_detail.get("remaining_attempts", 0) if error_detail else 0
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail=f"密码错误，剩余{remaining}次机会",
            )
        elif error_code == "ACCOUNT_LOCKED":
            detail_msg = error_detail.get("detail", "账号已锁定") if error_detail else "账号已锁定"
            raise HTTPException(
                status_code=status.HTTP_423_LOCKED,
                detail=detail_msg,
            )
        elif error_code == "ACCOUNT_DISABLED":
            detail_msg = error_detail.get("detail", "账号已被禁用") if error_detail else "账号已被禁用"
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=detail_msg,
            )
        
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="登录失败",
            )
        
        access_token = create_access_token({"sub": user.username, "role": user.role})
        return {"access_token": access_token, "token_type": "bearer"}
    except OperationalError as e:
        # 数据库连接错误
        error_msg = str(e)
        if "Can't connect to MySQL server" in error_msg or "无法连接" in error_msg:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="数据库连接失败，请检查 MySQL 服务是否已启动",
            )
        else:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"数据库操作失败: {error_msg}",
            )
    except SQLAlchemyError as e:
        # 其他数据库错误
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"数据库错误: {str(e)}",
        )
    except Exception as e:
        # 其他未预期的错误
        print(f"登录错误: {traceback.format_exc()}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"登录失败: {str(e)}",
        )


@router.get("/auth/me", response_model=User)
async def read_current_user(current_user: User = Depends(get_current_user)):
    """获取当前登录用户信息"""
    return current_user


@router.get("/auth/admin/ping")
async def admin_ping(current_admin: User = Depends(get_current_admin)):
    """
    管理员测试接口，用于前端验证管理员权限。
    """
    return {"message": "admin access granted", "username": current_admin.username}


