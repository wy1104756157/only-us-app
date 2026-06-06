@echo off
cd /d "%~dp0"
echo Starting phone preview server...
echo.
echo Open this URL on your phone:
echo http://192.168.150.191:4173
echo.
echo Keep this window open while testing.
echo.
D:\node.exe server.mjs
pause
