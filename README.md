# Budget Tool

A local desktop budgeting application built with Python backend and Electron frontend. Runs entirely offline on your laptop with automatic update functionality.

## 🚀 Features

- **Runs Locally**: All data stays on your computer, works offline
- **Python Backend**: Flask server for data processing and API
- **Electron Frontend**: Modern desktop application with React UI
- **Auto-Updates**: Automatic update checks from GitHub with user control
- **Cross-Platform**: Windows, macOS, and Linux support
- **Version Control**: Full Git integration with GitHub
- **Multiple Run Modes**: Desktop app, browser, or standalone Python app

## 📋 Prerequisites

**Required:**
- **Python** (v3.8 or higher)
- **pip** (comes with Python)

**Optional:**
- **Node.js** (v16 or higher) - only if you want to use Electron wrapper

## 🛠️ Installation

**Install Python dependencies**:
```bash
pip install -r requirements.txt
```

That's it! No Node.js/npm required unless you want the Electron wrapper.

## 🎯 Running the App

### Option 1: Python Desktop App (Recommended)
```bash
python main.py
```
Opens in a native desktop window using pywebview.

### Option 2: Development Server (Browser)
```bash
python run_server.py
```
Then open `http://localhost:5000` in your browser.

### Option 3: Electron Wrapper (Optional)
If you have Node.js installed:
```bash
npm install
npm start
```

### Option 4: Just the Flask API
```bash
cd server
python app.py
```

## 📦 Building for Production

### Option 1: Python Executable (Recommended)
```bash
pip install pyinstaller
pyinstaller --onefile --windowed main.py
```
Creates a single `.exe` file in `dist/` folder.

### Option 2: Electron Package
```bash
npm install
npm run dist
```
Creates an installer with Electron wrapper.

## 🔄 Auto-Updates & Version Control

This app includes a complete auto-update system with GitHub integration.

### Quick Setup

1. **Connect to GitHub** - See detailed instructions in [SETUP_GITHUB.md](SETUP_GITHUB.md)
2. **Update `package.json`** - Add your GitHub username to the `build.publish` section
3. **Push to GitHub** - Initialize Git and push your code
4. **Create Releases** - Tag versions and GitHub Actions builds automatically

### How It Works

- **On Launch**: App automatically checks GitHub for new versions (requires internet)
- **User Choice**: Dialog asks user if they want to download the update
- **Download**: Update downloads in background with progress indicator
- **Install**: User decides when to restart and install
- **Offline**: Update checks fail silently if offline, app continues normally

See [SETUP_GITHUB.md](SETUP_GITHUB.md) for complete setup instructions.

## 📁 Project Structure

```
budget-tool/
├── main.py            # Python desktop app launcher (pywebview)
├── run_server.py      # Development server launcher
├── requirements.txt   # All Python dependencies
├── server/            # Python Flask backend
│   ├── app.py         # Flask API server
│   └── requirements.txt  # Server-specific deps
├── frontend/          # HTML/CSS/JS frontend
│   ├── index.html     # Main UI
│   ├── styles.css     # Styling
│   └── app.js         # Minimal JS for UI interactions
├── electron/          # Optional: Electron wrapper
│   ├── main.js
│   └── preload.js
└── package.json       # Optional: Electron dependencies
```

## 🔧 API Endpoints

- `GET /api/health` - Check server status
- `GET /api/budget` - Get budget data
- `POST /api/budget` - Update budget data
- `GET /api/transactions` - Get all transactions
- `POST /api/transactions` - Add a transaction
- `DELETE /api/transactions/<id>` - Delete a transaction
- `GET /api/categories` - Get all categories
- `POST /api/categories` - Add a category

## 🎨 Customization

- **Port Configuration**: Flask server runs on port 5000
- **App Icon**: Place your icon in `assets/` folder
- **App Name**: Update in `package.json` build section
- **Python Version**: Modify `electron/main.js` if using specific Python version

## 🐛 Troubleshooting

**App won't start**:
- Ensure Python is installed: `python --version`
- Install dependencies: `pip install -r requirements.txt`
- Check if port 5000 is available

**"Module not found" errors**:
- Activate virtual environment (if using one)
- Reinstall dependencies: `pip install -r requirements.txt`

**pywebview window issues**:
- Windows: May need to install `pythonnet`
- Linux: May need to install `PyGObject`
- Mac: Should work out of the box
- Alternative: Use `python run_server.py` and browser

**Port 5000 already in use**:
- Change port in `server/app.py` (line with `app.run`)
- Update URL in `main.py` and `frontend/app.js`

## 📝 Next Steps

- [ ] Add SQLite database for persistent storage
- [ ] Build transaction management UI (add/edit/delete)
- [ ] Create budget categories with limits
- [ ] Add data visualization with charts (Chart.js or similar)
- [ ] Implement CSV import/export
- [ ] Add user settings and preferences
- [ ] Create monthly/yearly budget reports
- [ ] Add recurring transactions feature

## 🐍 Why Python-First?

- **No JavaScript Dependencies**: Minimal npm/Node.js complexity
- **Single Language**: Python for backend, GUI, and logic
- **Powerful**: Great for data processing and calculations
- **Easy Distribution**: PyInstaller creates single executable
- **Rich Libraries**: Access to pandas, numpy, matplotlib, SQLite
- **Simpler Setup**: Just `pip install` and run
- **Better for Data**: Budget analysis, CSV import/export, reporting

## 🔄 Auto-Updates

Updates work **entirely in Python**:

1. **Check**: On startup, app checks GitHub Releases for new version
2. **Notify**: User sees update banner in the app
3. **Download**: Click "Download" - downloads .exe from GitHub
4. **Install**: Click "Install & Restart" - launches installer and closes app

**To publish updates:**
```bash
# 1. Update version in updater.py
# 2. Build executable
pyinstaller --onefile --windowed --name BudgetTool main.py

# 3. Create GitHub Release and upload BudgetTool.exe
# 4. Users get notified automatically!
```

See `docs/guides/UPDATE_GUIDE.md` for detailed instructions.

## 📚 Documentation

All documentation has been organized into the `/docs/` directory:

- **`/docs/features/`** - Feature implementation details and specifications
- **`/docs/guides/`** - User guides, tutorials, and quick references
- **`/docs/development/`** - Development workflows, deployment, and testing docs

**Quick Links:**
- 📊 [Budget Health Score Feature](docs/features/BUDGET_HEALTH_SCORE_FEATURE.md)
- 💾 [Data Storage Guide](docs/guides/DATA_STORAGE_GUIDE.md)
- 🔄 [Update Guide](docs/guides/UPDATE_GUIDE.md)
- 🚀 [Ultra Deploy Guide](docs/development/ULTRA-DEPLOY.md)
- 🗺️ [Product Roadmap](FINANCIAL_ASSISTANT_ROADMAP.md)
- 📝 [Changelog](CHANGELOG.md)

See [`docs/README.md`](docs/README.md) for complete documentation structure and guidelines.

## 🔧 JavaScript Usage

JavaScript is **only** used in `frontend/app.js` for:
- Fetching data from Flask API
- DOM manipulation
- UI interactions  
- Update notifications UI

No build tools, no npm packages, no bundlers - just vanilla JS!

## 📄 License

MIT
