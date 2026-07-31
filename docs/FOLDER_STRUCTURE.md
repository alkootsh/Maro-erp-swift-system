# Folder Structure
## MARO Business Platform - Enterprise Project Layout

```
/ (Workspace Root)
├── .env.example                       # Documented environment variable keys
├── metadata.json                      # Application metadata & permissions
├── package.json                       # Core dependencies & scripts
├── server.ts                          # Express + Vite backend server entry
├── vite.config.ts                     # Vite build configuration
├── src/                               # Application Source Code
│   ├── main.tsx                       # Client React entry point
│   ├── App.tsx                        # Master layout & route provider
│   ├── index.css                      # Global Tailwind CSS imports
│   ├── components/                    # Reusable UI Components
│   │   ├── Layout.tsx                 # Main ERP shell (Sidebar, Header, Content)
│   │   ├── SyncEngineStatusBadge.tsx  # Offline sync status telemetry
│   │   └── products/                  # Sub-domain UI components
│   ├── cqrs/                          # CQRS Architecture Engine
│   │   ├── commands.ts                # Command Handlers (Mutations)
│   │   ├── queries.ts                 # Query Handlers (Reads & Aggregates)
│   │   └── unitOfWork.ts              # Unit of Work Transaction Coordinator
│   ├── db/                            # Relational Database Schema & DDL
│   │   └── schema.sql                 # PostgreSQL Master DDL
│   ├── lib/                           # Core Platform Libraries
│   │   └── maroSyncEngine.ts          # Offline-first sync manager
│   ├── pages/                         # Primary Page Views
│   │   ├── Dashboard.tsx
│   │   ├── Inventory.tsx
│   │   ├── POS.tsx
│   │   └── Warehouses.tsx
│   ├── repositories/                  # Domain Repositories
│   │   └── productRepository.ts
│   └── types/                         # TypeScript Interface Definitions
│       └── productMaster.ts
└── docs/                              # Enterprise Architecture Documentation
    ├── SPRINT_8_ARCHITECTURE.md
    └── UI_UX_DESIGN_SYSTEM.md
```
