# Development Guide

Quick start for developing the Personal Finance Assistant.

## Quick Start

### Option 1: PowerShell Script (Easiest)

```powershell
# Start everything and open dashboard
.\dev.ps1 start

# Check status anytime
.\dev.ps1 status

# Stop all servers
.\dev.ps1 stop

# Restart everything
.\dev.ps1 restart
```

### Option 2: Simple Launcher

```powershell
# Double-click this file
.\launch_assistant.bat
```

Or for debug mode (see all logs):
```powershell
.\launch_assistant_debug.bat
```

---

## URLs While Developing

| Service | URL |
|---------|-----|
| **Dashboard** | http://localhost:5173 |
| **API Docs** | http://127.0.0.1:8000/docs |
| **Health Check** | http://127.0.0.1:8000/health |

---

## Hot Reloading

✅ **Frontend**: Auto-reloads on every file save (Vite)  
✅ **Backend**: Auto-reloads on Python file changes (uvicorn --reload)

Just save and refresh the browser (or it reloads automatically).

---

## Stopping Servers

```powershell
.\stop_assistant.bat
```

Or just close the terminal windows.

---

## Resetting Database

```powershell
.\reset_database.bat
```

⚠️ **WARNING**: This deletes all data!

---

Done! Happy coding! 🚀
