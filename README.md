# Chinese Vocab - Liquid Glass Anki App

A Chinese Vocabulary Flashcard app built with an **Anki SM-2 SRS Algorithm** and a liquid iridescent glass design.

---

## 📁 Directory Structure

```
-ANKI/
├── main.py            # Desktop app entry point (PyWebView)
├── run_app.bat        # Windows 1-click launcher
├── run.pyw            # Silent Python desktop launcher
├── requirements.txt   # Python dependencies
└── web/               # Web application assets
    ├── index.html     # HTML structure
    ├── styles.css     # Liquid glass design system
    ├── app.js         # Main application controller
    ├── scheduler.js   # Anki SM-2 SRS Algorithm engine
    ├── ui.js          # UI rendering & stats components
    ├── storage.js     # LocalStorage persistence
    ├── utils.js       # Validation & helper utilities
    └── iridescence.js # WebGL fluid shader background
```

---

## 🚀 How to Run the App

### Option 1: 1-Click Launch (Windows)
Double-click **`run_app.bat`** or **`run.pyw`** in the project folder.

### Option 2: Command Line (Python)
1. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
2. Run the main script:
   ```bash
   python main.py
   ```

### Option 3: Web Browser
Open `web/index.html` directly in any web browser.
