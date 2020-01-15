rmdir /s /q dist\browser
rmdir /s /q dist\server
start "rebuild ng" npm run build:ng:dev
