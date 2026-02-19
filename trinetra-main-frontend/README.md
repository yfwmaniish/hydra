# Trinetra Sentinel Frontend

This is the main frontend repository for the Trinetra Sentinel dashboard.

## Setup

1.  **Install Dependencies**:
    ```bash
    npm install
    ```

2.  **Environment Variables**:
    Copy `.env.example` to `.env` and configure your backend URLs.
    ```bash
    cp .env.example .env
    ```
    
    Update `.env` with your actual backend endpoints:
    ```
    VITE_API_URL=http://your-backend-api.com
    VITE_WS_URL=ws://your-backend-api.com/ws
    ```

3.  **Run Development Server**:
    ```bash
    npm run dev
    ```

## Backend Integration

The frontend uses `src/services/threatService.ts` to abstract data fetching.
Currently, it uses mock data. To connect to a real backend:

1.  Ensure your backend exposes endpoints matching the types in `src/data/mockData.ts`.
2.  Update `threatService.ts` to use `fetch` calls to `import.meta.env.VITE_API_URL`.

## Project Structure

-   `src/components`: UI components
-   `src/pages`: Main view pages
-   `src/services`: API services
-   `src/context`: React Context (Theme, Auth)
