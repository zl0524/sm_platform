# MySQL 64位安装步骤

## 系统确认
✅ 你的系统是 **64位**（AMD64）
✅ 应该安装 **64位MySQL**

## 下载链接

### 官方MySQL Installer（推荐）

**下载地址**：https://dev.mysql.com/downloads/installer/

**选择版本**：
- **mysql-installer-community-8.x.x.x.msi**（推荐，最新稳定版）
- 或者 **mysql-installer-community-5.7.x.x.msi**（如果需要5.7版本）

**注意**：
- 选择 **Windows (x86, 64-bit), MSI Installer**
- 文件大小约400-500MB
- 这是完整的安装包，包含MySQL服务器和工具

### 或者使用XAMPP（更简单）

**下载地址**：https://www.apachefriends.org/

**选择版本**：
- **XAMPP for Windows**（会自动检测64位版本）
- 包含MySQL、Apache、PHP等

## 安装步骤（MySQL Installer）

### 1. 运行安装程序
- 双击下载的 `.msi` 文件
- 如果提示"用户账户控制"，点击"是"

### 2. 选择安装类型
- 选择 **"Developer Default"**（开发默认，包含所有工具）
- 或选择 **"Server only"**（仅服务器，更轻量）

### 3. 安装依赖
- 点击 **"Execute"** 安装所需组件
- 等待所有组件安装完成（可能需要几分钟）

### 4. 配置MySQL服务器
- **Config Type**: 选择 **"Development Computer"**（开发计算机）
- **Port**: 保持默认 **3306**（与你的.env文件一致）
- **Windows Service**: 确保勾选 **"Start the MySQL Server at System Startup"**（开机自动启动）

### 5. 设置root密码 ⚠️ 重要
- **Authentication Method**: 选择 **"Use Strong Password Encryption"**（推荐）
- **MySQL Root Password**: 输入 **`123`**（与你的.env文件中的DB_PASSWORD一致）
- **确认密码**: 再次输入 **`123`**

### 6. 完成安装
- 点击 **"Execute"** 完成配置
- 点击 **"Finish"** 完成安装

## 安装步骤（XAMPP）

### 1. 运行安装程序
- 双击下载的安装包
- 选择安装路径（默认即可）

### 2. 启动MySQL
- 打开 **XAMPP Control Panel**
- 找到 **MySQL**，点击 **"Start"** 按钮
- 如果希望开机自动启动，可以勾选 **"Svc"**（Service）

### 3. 设置密码（可选但推荐）
- 打开命令行，进入XAMPP的MySQL目录：
  ```powershell
  cd C:\xampp\mysql\bin
  mysql -u root
  ```
- 在MySQL命令行中执行：
  ```sql
  ALTER USER 'root'@'localhost' IDENTIFIED BY '123';
  FLUSH PRIVILEGES;
  exit;
  ```
- 然后修改 `.env` 文件中的密码为 `123`

## 验证安装

### 方法1：检查服务
```powershell
Get-Service | Where-Object {$_.DisplayName -like "*mysql*"}
```
应该看到MySQL服务，状态为"Running"

### 方法2：测试端口
```powershell
Test-NetConnection -ComputerName localhost -Port 3306
```
应该显示 `TcpTestSucceeded : True`

### 方法3：初始化数据库
```powershell
cd python-service
python -m app.init_db
```
如果看到成功消息，说明一切正常！

## 常见问题

### Q: 安装时提示需要Visual C++ Redistributable？
**A**: 下载并安装 Microsoft Visual C++ Redistributable：
- https://aka.ms/vs/17/release/vc_redist.x64.exe

### Q: 安装后服务启动失败？
**A**: 
1. 检查端口3306是否被占用
2. 查看MySQL错误日志（通常在 `C:\ProgramData\MySQL\MySQL Server X.X\Data\`）
3. 尝试以管理员身份运行安装程序

### Q: 忘记设置密码或密码不对？
**A**: 可以重置MySQL root密码，或重新安装（选择"Remove"后重新安装）

## 推荐配置总结

- ✅ **64位MySQL 8.0**（最新稳定版）
- ✅ **端口3306**（默认）
- ✅ **root密码：123**（与.env文件一致）
- ✅ **开机自动启动**（方便使用）

## 下一步

安装完成后，运行：
```powershell
python -m app.init_db
```

如果成功，你会看到：
```
✓ 数据库 sm_platform 创建成功
✓ 数据表创建成功
✓ 初始用户数据插入成功
```









