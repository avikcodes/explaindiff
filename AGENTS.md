# ExplainDiff - ML Model Comparison Dashboard

## Tech Stack
- Next.js 16 + TypeScript + Tailwind CSS + Recharts
- FastAPI backend (WebSocket at ws://localhost:8000/ws/compare)

## Getting Started

```bash
npm install
npm run dev       # Starts on http://localhost:3000
```

## Build

```bash
npm run build
npm start
```

## Project Structure

```
app/
  layout.tsx       - Root layout with Geist font
  page.tsx         - Main page (state management, WebSocket, component orchestration)
  globals.css      - Tailwind imports + custom scrollbar
components/
  FileUpload.tsx         - Drag/drop upload zones, model names, target column, compare button
  ProgressSection.tsx    - Animated progress bar with step indicator
  AgreementBanner.tsx    - Agreement rate card with dynamic color coding
  PredictionChart.tsx    - Recharts grouped bar chart for prediction distribution
  FeatureImportanceChart.tsx - Horizontal bar chart for top 10 features
  DisagreementTable.tsx  - Table showing top 10 disagreement samples
  AIReportCard.tsx       - AI explanation card with orange left border
  HistorySidebar.tsx     - Sidebar with last 10 comparison sessions
lib/
  types.ts         - TypeScript interfaces for all data structures
```

## WebSocket Flow

1. User selects 2 .pkl files + CSV, picks target column, clicks Compare
2. Files are converted to base64 on the client
3. WebSocket connects to ws://localhost:8000/ws/compare
4. Client sends JSON payload with base64 data, target column, model names
5. Server streams progress updates: { step, progress }
6. On completion (progress: 100), server sends { results }
7. Results are displayed in the dashboard and cached in localStorage

## CSV Parsing

- Uses native FileReader API (no external CSV libraries)
- Reads first line, splits by comma, trims whitespace/quotes
- Populates the target column dropdown automatically

## Charts

- Prediction Distribution: Recharts BarChart with grouped bars per class
- Feature Importance: Horizontal BarChart showing top 10 features sorted by max importance
- Charts use data directly from backend response (no placeholders)
