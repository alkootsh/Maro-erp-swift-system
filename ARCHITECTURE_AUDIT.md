# Architecture Audit - Swift ERP

- **Type**: Full-Stack Web Application.
- **Frontend**: React 19, Vite, Tailwind CSS.
- **Backend**: Express.js (runs on port 3000).
- **Communication**: REST API (`/api/*`) for server-side logic (Gemini), Client-SDK for Firebase Firestore/Auth.
- **Deployment**: Cloud Run (Containerized).
- **Quality**: Good modularization. The separation of `src/pages` for UI and `server.ts` for API backend is clean.
- **Concerns**: Heavy client-side aggregation in `Dashboard.tsx` can impact performance as the database grows.
