-- 国密算法教学审计修复平台数据库初始化脚本
-- 支持 MySQL 5.7+ 和 MySQL 8.0+

-- 创建数据库（如果不存在）
CREATE DATABASE IF NOT EXISTS `sm_platform` 
DEFAULT CHARACTER SET utf8mb4 
DEFAULT COLLATE utf8mb4_unicode_ci;

USE `sm_platform`;

-- 用户表
CREATE TABLE IF NOT EXISTS `users` (
    `id` INT AUTO_INCREMENT PRIMARY KEY COMMENT '用户ID',
    `username` VARCHAR(50) NOT NULL UNIQUE COMMENT '用户名',
    `password` VARCHAR(255) NOT NULL COMMENT '密码哈希',
    `role` VARCHAR(20) NOT NULL DEFAULT 'user' COMMENT '用户角色: user/admin',
    `is_active` BOOLEAN NOT NULL DEFAULT TRUE COMMENT '是否激活',
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    INDEX `idx_username` (`username`),
    INDEX `idx_role` (`role`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户表';

-- 插入初始用户数据（密码为明文，实际使用时应该使用哈希）
-- 注意：这里使用明文密码仅用于演示，实际部署时应该使用bcrypt等加密方式
-- 默认密码：
-- user: user123
-- admin: admin123
INSERT INTO `users` (`username`, `password`, `role`, `is_active`) VALUES
('user', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYqJqZ5Z5Xe', 'user', TRUE),
('admin', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYqJqZ5Z5Xe', 'admin', TRUE)
ON DUPLICATE KEY UPDATE `username`=`username`;

-- 注意：上面的密码哈希是示例，实际使用时需要运行Python脚本生成正确的bcrypt哈希
-- 可以使用以下Python代码生成：
-- from passlib.context import CryptContext
-- pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
-- print(pwd_context.hash("user123"))
-- print(pwd_context.hash("admin123"))









