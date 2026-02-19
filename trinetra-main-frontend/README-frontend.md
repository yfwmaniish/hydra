# Trinetra Sentinel - Frontend Documentation

## 🚀 Project Overview

**Trinetra Sentinel** is a next-generation cyber threat intelligence dashboard designed for military-grade situational awareness. It features a high-performance, immersive "Glassmorphism" UI with real-time data visualization capabilities.

---

## 🛠️ Technology Stack & Tools

### Core Frameworks
*   **React 18**: Component-based UI library.
*   **Vite**: Next-generation frontend tooling for ultra-fast builds.
*   **TypeScript**: Statically typed JavaScript for robust code reliability.

### Styling & Design System
*   **Tailwind CSS**: Utility-first CSS framework for rapid UI development.
*   **Framer Motion**: Production-ready animation library for complex UI interactions.
*   **Lucide React**: Beautiful, consistent, and lightweight icon set.
*   **Custom CSS Variables**: Used for dynamic theming (Dark/Light/Matrix modes) and "Skeuomorphic" depth effects.

### Visualization & Interactive Components
*   **D3.js / Custom SVG**: Used for the **Entity Relationship Graph** logic.
*   **Canvas API**: Used for the **3D Globe Visualization**.
*   **Framer Motion Layout**: Used for smooth state transitions in the **Investigation Board** and **Alert Queue**.

### State Management & Routing
*   **React Context API**: Manages global state for `ThemeContext` (Dark/Light/Matrix modes).
*   **React Router DOM**: Handles client-side navigation between Dashboard, Investigation, and Admin views.

---

## ⚡ Specifications

### Dashboard Modules
1.  **Threat Overview**: Real-time counters for Active Threats, Critical Incidents, and Monitored Sources.
2.  **Live Alert Queue**: An auto-updating feed of threat alerts with severity indicators (Critical, High, Medium, Low).
3.  **Global Threat Map**: Input-interactive 3D globe visualizing threat origins.
4.  **Sector Health**: Progress bars and status indicators for critical infrastructure (Power, Finance, Telecom).
5.  **Threat Timeline**: Area chart visualizing threat velocity over a 24-hour period.

### Investigation Board
*   **Interactive Graph**: Force-directed graph visualization for Threat Actors, IPs, Domains, and Targets.
*   **Filtering**: Dynamic filtering by Entity Type and Search Query.
*   **Drag-and-Drop**: Users can manually rearrange nodes for analysis.

### Admin Panel
*   **Source Management**: Configure data sources (Dark Web, Social Media, IDPS).
*   **System Configuration**: Toggle system-wide settings like "AI Auto-Analysis" and "Real-time Sync".

---

## 🔗 Backend Connections & Integration

The frontend is designed to be **backend-agnostic**, interacting with any API that matches the defined interfaces.

### 1. Environment Configuration
The application uses `.env` files for configuration.
*   Create a `.env` file in the root directory (copy from `.env.example`).
*   Define the API endpoints:

```env
# Base URL for REST API endpoints
VITE_API_URL=http://localhost:8000/api

# WebSocket URL for real-time updates
VITE_WS_URL=ws://localhost:8000/ws
```

### 2. Service Layer Abstraction
All data fetching is centralized in `src/services/threatService.ts`. This allows strictly typed data flow and easy mocking.

**Current Implementation (Mock):**
```typescript
getEntities: async (): Promise<Entity[]> => {
    await delay(600); // Simulates network latency
    return [...mockEntities];
}
```

**Production Implementation (Real API):**
To connect to your real backend, modify `threatService.ts` to use `fetch` or `axios`:

```typescript
getEntities: async (): Promise<Entity[]> => {
    const response = await fetch(`${import.meta.env.VITE_API_URL}/graph/entities`);
    return response.json();
}
```

### 3. Data Models
Ensure your backend returns JSON matching these TypeScript interfaces (found in `src/data/mockData.ts`):

*   **Threat**: `{ id, title, severity, source, timestamp, ... }`
*   **Entity**: `{ id, label, type ('actor'|'ip'|'domain'|'target'), status }`
*   **Link**: `{ source, target, value }`
*   **Sector**: `{ id, name, health, status }`

---

## 📦 Deployment

1.  **Build**: Run `npm run build` to generate the production-ready static files in `dist/`.
2.  **Preview**: Run `npm run preview` to test the build locally.
3.  **Deploy**: Upload the `dist/` folder to any static hosting service (Vercel, Netlify, AWS S3, Nginx).
