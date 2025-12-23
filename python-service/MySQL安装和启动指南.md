# MySQL 安装和启动指南

## 问题诊断

你遇到的错误：
```
Can't connect to MySQL server on 'localhost' ([WinError 10061] 由于目标计算机积极拒绝，无法连接。)
```

这个错误表示：**MySQL服务没有运行或没有安装**

## 解决方案

### 方案一：检查MySQL是否已安装

#### 方法1：检查服务列表
1. 按 `Win + R`，输入 `services.msc`，回车
2. 在服务列表中查找：
   - `MySQL`
   - `MySQL80`
   - `MySQL57`
   - `MySQL Server`
3. 如果找到了，右键点击 → "启动"

#### 方法2：检查程序列表
1. 打开"控制面板" → "程序和功能"
2. 查找是否有 `MySQL Server` 或 `MySQL`

### 方案二：如果MySQL已安装但服务未启动

#### 启动MySQL服务（方法1：通过服务管理器）
1. 按 `Win + R`，输入 `services.msc`，回车
2. 找到MySQL服务（可能是 `MySQL80` 或 `MySQL`）
3. 右键点击 → "启动"
4. 如果希望开机自动启动，右键 → "属性" → 启动类型改为"自动"

#### 启动MySQL服务（方法2：通过PowerShell）
```powershell
# 查找MySQL服务名称
Get-Service | Where-Object {$_.DisplayName -like "*mysql*"}

# 启动服务（替换为实际的服务名称）
Start-Service MySQL80
# 或
Start-Service MySQL
```

### 方案三：如果MySQL未安装

#### 推荐安装方式：MySQL Installer（官方安装包）

1. **下载MySQL**
   - 访问：https://dev.mysql.com/downloads/installer/
   - 选择 "MySQL Installer for Windows"
   - 下载 "mysql-installer-community"（推荐，免费）

2. **安装步骤**
   - 运行安装程序
   - 选择 "Developer Default"（开发默认）或 "Server only"（仅服务器）
   - 点击 "Execute" 安装所需组件
   - 配置类型选择 "Development Computer"
   - **重要**：设置root用户密码（记住这个密码！）
   - 完成安装

3. **验证安装**
   - 打开"服务"管理器，应该能看到MySQL服务
   - 服务应该自动启动

#### 替代方案：使用XAMPP（包含MySQL）

1. **下载XAMPP**
   - 访问：https://www.apachefriends.org/
   - 下载Windows版本

2. **安装和启动**
   - 安装XAMPP
   - 打开XAMPP Control Panel
   - 点击MySQL旁边的 "Start" 按钮

3. **配置**
   - XAMPP的MySQL默认密码为空
   - 需要修改 `.env` 文件：
     ```env
     DB_PASSWORD=
     ```
   - 或者设置密码（推荐）

#### 替代方案：使用Docker（适合有Docker经验的用户）

```powershell
# 拉取MySQL镜像
docker pull mysql:8.0

# 运行MySQL容器
docker run --name mysql-sm-platform -e MYSQL_ROOT_PASSWORD=123 -p 3306:3306 -d mysql:8.0
```

### 方案四：修改配置使用远程MySQL（如果已有MySQL服务器）

如果你有远程MySQL服务器，可以修改 `.env` 文件：

```env
DB_HOST=远程服务器IP地址
DB_PORT=3306
DB_USER=root
DB_PASSWORD=远程服务器密码
DB_NAME=sm_platform
```

## 验证MySQL是否正常工作

### 方法1：使用命令行测试
```powershell
# 如果MySQL在PATH中
mysql -u root -p
# 输入密码，如果成功连接说明MySQL正常
```

### 方法2：使用PowerShell测试端口
```powershell
Test-NetConnection -ComputerName localhost -Port 3306
```
如果显示 `TcpTestSucceeded : True`，说明MySQL正在运行。

### 方法3：重新运行初始化脚本
```powershell
python -m app.init_db
```
如果看到成功消息，说明连接正常。

## 常见问题

### Q1: 找不到MySQL服务怎么办？
**A**: 可能MySQL没有安装，或者安装时没有配置为Windows服务。需要重新安装MySQL。

### Q2: 服务启动失败怎么办？
**A**: 
1. 检查MySQL日志文件（通常在 `C:\ProgramData\MySQL\MySQL Server X.X\Data\`）
2. 检查端口3306是否被占用：
   ```powershell
   netstat -ano | findstr :3306
   ```
3. 尝试修改MySQL配置文件中的端口

### Q3: 忘记root密码怎么办？
**A**: 需要重置MySQL密码，可以搜索"MySQL重置root密码 Windows"教程。

### Q4: 使用XAMPP的MySQL，密码是什么？
**A**: XAMPP的MySQL默认root密码为空，`.env` 文件中设置：
```env
DB_PASSWORD=
```

## 快速检查清单

- [ ] MySQL服务是否在运行？（services.msc中查看）
- [ ] 端口3306是否开放？（Test-NetConnection测试）
- [ ] `.env` 文件中的密码是否正确？
- [ ] 防火墙是否阻止了连接？

## 下一步

1. **确认MySQL已安装并运行**
2. **确认密码正确**（修改 `.env` 文件中的 `DB_PASSWORD`）
3. **重新运行初始化脚本**：
   ```powershell
   python -m app.init_db
   ```








