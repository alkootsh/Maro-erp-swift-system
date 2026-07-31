# UI/UX Design System Specification
## MARO Business Platform - Unified Enterprise UI/UX Standard

### 1. Overview & Aesthetic Philosophy
The MARO Business Platform employs a **High-Contrast, Sophisticated Light Aesthetic** designed for intensive enterprise operations, high-speed retail checkout, and long-session financial management. It prioritizes clarity, data density, rhythmic spacing, and low eye strain.

---

### 2. Color System

#### 2.1 Light Theme Palette (Primary Enterprise Canvas)
- **Background**: `#F8FAFC` (Slate 50 - Ultra-clean soft neutral).
- **Surface Cards & Modals**: `#FFFFFF` (Pure White).
- **Primary Text**: `#0F172A` (Slate 900 - Deep charcoal, high contrast).
- **Secondary Text**: `#475569` (Slate 600 - Muted slate for metadata).
- **Borders & Dividers**: `#E2E8F0` (Slate 200 - 1px clean hairlines).
- **Primary Brand Accent**: `#2563EB` (Royal Blue 600 - Action buttons, primary focus states).
- **Success / Online**: `#16A34A` (Emerald 600 - Completed status, connected state).
- **Warning / Syncing**: `#D97706` (Amber 600 - Low stock, offline queue pending).
- **Danger / Error**: `#DC2626` (Red 600 - Out of stock, delete actions, system errors).

#### 2.2 Dark Mode Palette (Specialized Atmosphere / Night Shift)
- **Background**: `#0F172A` (Slate 900).
- **Surface Cards**: `#1E293B` (Slate 800).
- **Primary Text**: `#F8FAFC` (Slate 50).
- **Borders**: `#334155` (Slate 700).

---

### 3. Typography System
- **Primary Body Font**: `Plus Jakarta Sans`, system-ui, sans-serif (Crisp legibility for tables & numbers).
- **Display Headings**: `Playfair Display` or `Plus Jakarta Sans` bold.
- **Monospace (SKUs, Amounts, Barcodes)**: `JetBrains Mono`, monospace.
- **Minimum Body Size**: 14px (UI dense tables) / 16px (Standard content).
- **Line Heights**: 1.5 for body text, 1.25 for titles.

---

### 4. Component Design Patterns

#### 4.1 Buttons
- **Primary**: Background `#2563EB`, text `#FFFFFF`, rounded `rounded-lg` (8px), padding `px-4 py-2` (2:1 horizontal ratio), font `font-medium`.
- **Secondary**: Background `#F1F5F9`, border `#CBD5E1`, text `#0F172A`.
- **Danger**: Background `#DC2626`, text `#FFFFFF`.
- **No Over-Rounded Pill Buttons**: Max radius 8px for standard controls to preserve crisp corporate structure.

#### 4.2 Form Controls & Inputs
- Height 40px, border `#CBD5E1`, background `#FFFFFF`, text `#0F172A`, focus ring `#2563EB`.
- Labels sit above input, font-weight 500, size 14px.

#### 4.3 Data Tables
- Row height 48px, header background `#F1F5F9`, header text uppercase tracked-wide 12px `#475569`.
- Alternating row zebra subtle shading or hairline horizontal dividers.
- Numeric columns right-aligned with `tabular-nums` formatting.

#### 4.4 Header Status Telemetry Badge
- Fixed top-right header position. Displays live connection mode (`Online` / `Offline`), PostgreSQL buffer status, and pending queue count (`0 Ops Pending`).

---

### 5. Specialized Touch POS Layout
- **Split View Ratio**: 40% Left Panel (Active Cart & Fast Payment Controls) / 60% Right Panel (Category Tabs & High-Frequency Touch Product Grid).
- **Touch Target Minimum**: 48px x 48px on mobile, 60px x 60px on Touch POS terminals.
- **Instant Feedback**: Physical keyboard barcode scanner input triggers immediate audio beep and visual highlight animation on cart list row.
