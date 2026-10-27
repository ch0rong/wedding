@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo 청첩장 미리보기 서버를 시작합니다. 이 창을 닫으면 종료됩니다.
start "" http://localhost:8000
python -m http.server 8000 || npx --yes serve -l 8000 .
pause
