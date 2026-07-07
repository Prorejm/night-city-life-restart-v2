# 夜城重启 - GitHub Pages 部署脚本
# 使用方法：在 PowerShell 中运行 .\deploy.ps1
# 前提：已安装 gh CLI 并已登录 (gh auth login)

Write-Host "=== 夜城重启 - GitHub Pages 部署 ===" -ForegroundColor Cyan

# 检查 gh CLI
$ghCheck = Get-Command gh -ErrorAction SilentlyContinue
if (-not $ghCheck) {
    Write-Host "[错误] 未安装 gh CLI，请先安装：winget install GitHub.cli" -ForegroundColor Red
    exit 1
}

# 检查登录状态
$authStatus = gh auth status 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "[提示] 需要 GitHub 登录" -ForegroundColor Yellow
    gh auth login --web
    if ($LASTEXITCODE -ne 0) {
        Write-Host "[错误] 登录失败" -ForegroundColor Red
        exit 1
    }
}

# 创建远程仓库（如果不存在）
$repoCheck = gh repo view Prorejm/night-city-life-restart-v2 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "[步骤1/4] 创建 GitHub 仓库..." -ForegroundColor Green
    gh repo create night-city-life-restart-v2 --public --description "夜城重启 - 赛博朋克美国生存重开模拟器"
}

# 设置远程
Write-Host "[步骤2/4] 设置远程仓库..." -ForegroundColor Green
git remote remove origin 2>$null
git remote add origin https://github.com/Prorejm/night-city-life-restart-v2.git

# 推送代码
Write-Host "[步骤3/4] 推送到 GitHub..." -ForegroundColor Green
git push -u origin master

# 配置 GitHub Pages
Write-Host "[步骤4/4] 配置 GitHub Pages..." -ForegroundColor Green
gh api repos/Prorejm/night-city-life-restart-v2/pages -X POST `
    --field source.branch=master `
    --field source.path=/ 2>$null

Write-Host ""
Write-Host "=== 部署完成！ ===" -ForegroundColor Cyan
Write-Host "网站地址: https://Prorejm.github.io/night-city-life-restart-v2/" -ForegroundColor Yellow
Write-Host ""
Write-Host "注意：GitHub Actions 部署可能需要 2-3 分钟生效" -ForegroundColor White
Write-Host "部署状态: https://github.com/Prorejm/night-city-life-restart-v2/actions" -ForegroundColor White
