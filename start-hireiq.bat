@echo off
start "Inflate Server" node "C:\Users\sahit\OneDrive\Desktop\Agentic Rag Project\inflate-server.js"
timeout /t 2
start "n8n" npx n8n start