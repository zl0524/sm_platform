# MySQL快速检查脚本
# 使用方法：在PowerShell中运行 .\快速检查MySQL.ps1

Write-Host "=== MySQL 连接检查 ===" -ForegroundColor Cyan
Write-Host ""

# 1. 检查MySQL服务
Write-Host "1. 检查MySQL服务状态..." -ForegroundColor Yellow
$mysqlServices = Get-Service | Where-Object {$_.DisplayName -like "*mysql*" -or $_.Name -like "*mysql*"}
if ($mysqlServices) {
    Write-Host "   找到MySQL服务：" -ForegroundColor Green
    $mysqlServices | ForEach-Object {
        $status = if ($_.Status -eq "Running") { "✓ 运行中" } else { "✗ 已停止" }
        Write-Host "   - $($_.DisplayName): $status" -ForegroundColor $(if ($_.Status -eq "Running") { "Green" } else { "Red" })
    }
} else {
    Write-Host "   ✗ 未找到MySQL服务（可能未安装）" -ForegroundColor Red
}
Write-Host ""

# 2. 检查端口3306
Write-Host "2. 检查端口3306..." -ForegroundColor Yellow
$portTest = Test-NetConnection -ComputerName localhost -Port 3306 -InformationLevel Quiet -WarningAction SilentlyContinue
if ($portTest) {
    Write-Host "   ✓ 端口3306可以连接" -ForegroundColor Green
} else {
    Write-Host "   ✗ 端口3306无法连接（MySQL可能未运行）" -ForegroundColor Red
}
Write-Host ""

# 3. 检查.env文件
Write-Host "3. 检查.env配置文件..." -ForegroundColor Yellow
if (Test-Path ".env") {
    Write-Host "   ✓ .env文件存在" -ForegroundColor Green
    $envContent = Get-Content ".env" | Where-Object {$_ -match "^DB_"}
    Write-Host "   配置内容：" -ForegroundColor Cyan
    $envContent | ForEach-Object {
        if ($_ -match "PASSWORD") {
            Write-Host "   - $_" -ForegroundColor Gray
        } else {
            Write-Host "   - $_" -ForegroundColor White
        }
    }
} else {
    Write-Host "   ✗ .env文件不存在" -ForegroundColor Red
    Write-Host "   请在python-service目录下创建.env文件" -ForegroundColor Yellow
}
Write-Host ""

# 4. 检查MySQL命令
Write-Host "4. 检查MySQL命令行工具..." -ForegroundColor Yellow
$mysqlPath = where.exe mysql 2>$null
if ($mysqlPath) {
    Write-Host "   ✓ MySQL命令行工具已安装" -ForegroundColor Green
    Write-Host "   路径: $mysqlPath" -ForegroundColor Gray
} else {
    Write-Host "   ⚠ MySQL命令行工具未在PATH中（不影响程序运行）" -ForegroundColor Yellow
}
Write-Host ""

# 总结
Write-Host "=== 检查结果 ===" -ForegroundColor Cyan
if ($mysqlServices -and ($mysqlServices | Where-Object {$_.Status -eq "Running"})) {
    if ($portTest) {
        Write-Host "✓ MySQL服务正在运行，可以尝试连接" -ForegroundColor Green
        Write-Host ""
        Write-Host "下一步：运行 python -m app.init_db 初始化数据库" -ForegroundColor Cyan
    } else {
        Write-Host "⚠ MySQL服务存在但端口无法连接，请检查防火墙" -ForegroundColor Yellow
    }
} else {
    Write-Host "✗ MySQL服务未运行或未安装" -ForegroundColor Red
    Write-Host ""
    Write-Host "解决方案：" -ForegroundColor Yellow
    Write-Host "1. 如果已安装：在服务管理器中启动MySQL服务" -ForegroundColor White
    Write-Host "2. 如果未安装：下载并安装MySQL" -ForegroundColor White
    Write-Host "   下载地址：https://dev.mysql.com/downloads/installer/" -ForegroundColor Cyan
}








