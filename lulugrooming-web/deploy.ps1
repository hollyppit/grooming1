# 🚀 Grooming1 자동 배포 스크립트
# 사용법: 이 파일을 우클릭 > "PowerShell로 실행"

$env:PATH = "C:\Program Files\Git\cmd;" + $env:PATH

Write-Host ""
Write-Host "======================================" -ForegroundColor Cyan
Write-Host "   그루밍 매칭 앱 - 자동 배포 시작   " -ForegroundColor Cyan
Write-Host "======================================" -ForegroundColor Cyan
Write-Host ""

# 커밋 메시지 입력
$message = Read-Host "커밋 메시지를 입력하세요 (엔터 = 'Update')"
if ([string]::IsNullOrWhiteSpace($message)) {
    $message = "Update"
}

# Git 명령 실행
git add -A

$status = git diff --cached --name-only
if ([string]::IsNullOrWhiteSpace($status)) {
    Write-Host ""
    Write-Host "변경된 파일이 없습니다." -ForegroundColor Yellow
} else {
    Write-Host ""
    Write-Host "변경 파일:" -ForegroundColor White
    Write-Host $status -ForegroundColor Gray
    Write-Host ""
    
    git commit -m $message
    git push origin main
    
    Write-Host ""
    Write-Host "======================================" -ForegroundColor Green
    Write-Host "  ✅ GitHub 푸시 완료!               " -ForegroundColor Green
    Write-Host "  🌐 Cloudflare 자동 배포 시작됨     " -ForegroundColor Green
    Write-Host "======================================" -ForegroundColor Green
}

Write-Host ""
Write-Host "아무 키나 누르면 종료됩니다..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
