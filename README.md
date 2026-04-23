# SmartTracker - Workout Tracker PWA

A high-performance, offline-first workout tracker with an intelligent progression engine. Built with React, TypeScript, and Dexie.js.

## Features
- **Offline-First**: All data is stored locally in your browser using IndexedDB. Works without an internet connection.
- **Intelligent Progression**: Suggests weights and reps based on your history, soreness levels, and performance trends.
- **PWA Ready**: Installable on mobile and desktop for a native-like experience.
- **Progress Tracking**: Visualize your volume growth with interactive charts.
- **Data Portability**: Export and import your data as JSON.

---

## How to Install on Windows (Development)

To run this project locally on your Windows machine:

1. **Install Node.js**: Download and install the latest LTS version from [nodejs.org](https://nodejs.org/).
2. **Clone/Download the project**: Extract the source code to a folder of your choice.
3. **Open Terminal**: Press `Win + R`, type `cmd` or `powershell`, and navigate to the project folder:
   ```bash
   cd path/to/workout-tracker
   ```
4. **Install Dependencies**:
   ```bash
   npm install
   ```
5. **Run the App**:
   ```bash
   npm run dev
   ```
6. **Open in Browser**: The terminal will show a URL (usually `http://localhost:5173`). Open it in Chrome or Edge.

---

## Development Commands

- `npm run dev` starts the local Vite dev server.
- `npm run build` runs TypeScript checks and creates a production build in `dist`.
- `npm test -- --run` runs the Vitest suite once.

---

## Architecture Overview

The app is organized around a few clear layers:

- `src/components`
  Route-level screens and UI composition. Components should focus on rendering, navigation, and small local UI state.
- `src/features`
  Feature-specific hooks and presentational building blocks. This is where screen data loading, view-model shaping, and feature-scoped UI pieces live.
- `src/repositories`
  Data-access helpers around IndexedDB/Dexie. Feature hooks and services should prefer repositories over raw `db.*` calls.
- `src/progression`
  Training logic, progression rules, weekly volume logic, and settings-related domain behavior.
- `src/utils`
  Shared pure helpers for formatting, analysis math, validation, and session-derived selectors.
- `src/db`
  Dexie schema, table definitions, and model types. This layer should stay close to persistence setup rather than app orchestration.
- `tests`
  Vitest coverage for progression logic, analysis logic, shared session utilities, and repositories.

### Current Convention

When adding or changing behavior:

1. Put persistence reads/writes in a repository when possible.
2. Keep business/domain logic in `features`, `progression`, or `utils` depending on scope.
3. Keep route components thin and presentation-focused.
4. Add or update tests for shared logic when extracting new helpers or repositories.

### Example Flow

For a screen like `Dashboard` or `Analysis`:

1. The route component renders UI.
2. A feature hook loads and shapes data into a view model.
3. The hook calls repositories/services for data access.
4. Shared utility functions handle pure derivation work.

---

## How to Upload to Netlify

Deploy your own version of the tracker to the web for free:

1. **Build the Project**:
   Run the following command in your terminal:
   ```bash
   npm run build
   ```
   This creates a `dist` folder.
2. **Create a Netlify Account**: Go to [netlify.com](https://www.netlify.com/) and sign up.
3. **Deploy via Drag-and-Drop**:
   - Log in to your Netlify dashboard.
   - Go to the **Sites** tab.
   - Drag and drop the **`dist`** folder into the deployment area at the bottom of the page.
4. **Configure for PWA**: Netlify handles HTTPS automatically, which is required for PWAs to work. Your site will be live at a `.netlify.app` URL.

*Alternatively, connect your GitHub repository to Netlify for automatic deployments whenever you push code.*

---

## How to Use on iPhone as a PWA

For the best experience, install the app on your home screen:

1. **Open Safari**: Navigate to your deployed site URL (e.g., `https://your-app.netlify.app`).
2. **Tap Share**: Tap the **Share** button (the square with an upward arrow) at the bottom of the Safari screen.
3. **Add to Home Screen**: Scroll down the share menu and tap **Add to Home Screen**.
4. **Confirm**: Give it a name (e.g., "SmartTracker") and tap **Add**.
5. **Launch**: Find the icon on your home screen. It will now open in full-screen mode, without Safari's browser bars, and will keep working even when you are offline in the gym.

---

## Tech Stack
- **Framework**: React 19
- **Database**: Dexie.js (IndexedDB)
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **Charts**: Chart.js
- **Build Tool**: Vite
- **PWA**: @vitejs/plugin-pwa
