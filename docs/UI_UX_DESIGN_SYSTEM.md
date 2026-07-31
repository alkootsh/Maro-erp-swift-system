# UI/UX Design System Specification
## MARO Business Platform - Unified Enterprise UI/UX Standard

### 1. Overview & Aesthetic Philosophy
The MARO Business Platform employs a **High-Contrast, Sophisticated Light Aesthetic** (with full Dark Mode support) designed for intensive enterprise operations, high-speed retail checkout, and long-session financial management. It prioritizes clarity, data density, rhythmic spacing, touch-friendliness, and low eye strain.

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

#### 2.2 Dark Mode Palette (Night Shift & High-Contrast Operations)
- **Background**: `#0F172A` (Slate 900).
- **Surface Cards**: `#1E293B` (Slate 800).
- **Primary Text**: `#F8FAFC` (Slate 50).
- **Secondary Text**: `#94A3B8` (Slate 400).
- **Borders & Dividers**: `#334155` (Slate 700).
- **Primary Accent**: `#3B82F6` (Blue 500).

---

### 3. Typography System
- **Primary Body Font**: `Plus Jakarta Sans`, system-ui, sans-serif (Crisp legibility for tables & numbers).
- **Display Headings**: `Plus Jakarta Sans` bold / `Playfair Display`.
- **Monospace (SKUs, Amounts, Barcodes)**: `JetBrains Mono`, monospace (`font-mono tabular-nums`).
- **Minimum Body Size**: 14px (UI dense tables) / 16px (Standard content).
- **Line Heights**: 1.5 for body text, 1.25 for titles.

---

### 4. Iconography
- **Library**: `lucide-react` only.
- **Sizing Grid**: 16px (Dense table icons), 20px (Standard buttons & inputs), 24px (Navigation & Header actions), 32px (KPI metric cards).
- **Coloring**: Inherits parent text color or specific semantic color (e.g. `text-emerald-500` for connected status).

---

### 5. Component Design Standards

#### 5.1 Buttons
- **Primary**: Background `#2563EB`, text `#FFFFFF`, rounded `rounded-lg` (8px), padding `px-4 py-2` (2:1 horizontal ratio), font `font-medium hover:bg-blue-700`.
- **Secondary**: Background `#F1F5F9`, border `#CBD5E1`, text `#0F172A`, hover `#E2E8F0`.
- **Danger**: Background `#DC2626`, text `#FFFFFF`, hover `#B91C1C`.
- **Function Buttons (POS F1-F24)**: High-visibility key label, 14px bold, tactile press animation.

#### 5.2 Forms & Inputs
- **Height**: 40px standard.
- **Borders**: `#CBD5E1` (Light) / `#334155` (Dark).
- **Focus State**: Ring 2px `#2563EB` with 0px offset.
- **Labels**: Positioned above input, `font-medium text-xs uppercase tracking-wider text-slate-500`.
- **Smart Tooltips**: Hover explanation attached to every field describing business, tax, and inventory impact.

#### 5.3 Data Tables
- **Header**: Height 40px, background `#F1F5F9` / `#1E293B`, uppercase tracked-wide 12px `#475569`.
- **Row**: Height 48px, horizontal hairline borders, hover background `#F8FAFC` / `#334155`.
- **Numeric Formatting**: Right-aligned, monospace font, zero-padded decimals.

#### 5.4 Dialogs & Modals
- **Backdrop**: `bg-slate-900/50 backdrop-blur-sm`.
- **Container**: Elevated `#FFFFFF` / `#1E293B` panel, rounded `rounded-xl` (12px), shadow `shadow-2xl`.
- **Header & Footer**: Sticky action footers with primary action on the right (LTR) / left (RTL).

#### 5.5 Navigation Sidebar
- **Width**: Collapsed 64px (icons only) / Expanded 256px.
- **Hierarchy**: Grouped by domain (Sales, Purchasing, Inventory, Accounting, BI, Settings).
- **Active State**: Left border accent 4px `#2563EB`, background `#EFF6FF` / `#1E293B`, font `font-semibold`.

---

### 6. Specialized Layouts

#### 6.1 Touch POS Layout
- **Split Ratio**: 40% Left Panel (Active Invoice, Cart Items, Totals & Instant Pay) / 60% Right Panel (Category Selector & Customizable Quick-Item Grid).
- **Function Keys Bar**: Top or Bottom F1–F12 quick action strip.
- **Touch Target Minimum**: 48px x 48px (Mobile) / 60px x 60px (POS Terminals).

#### 6.2 Executive Dashboard Layout
- **Header KPI Band**: 4-card metric strip (Total Sales, Net Profit, Inventory Value, Cash Flow).
- **Analytics Canvas**: Responsive 2-column grid featuring interactive charts (Recharts) and real-time event feeds.

---

### 7. Responsive Rules & Accessibility (WCAG AA)
- **Breakpoints**: `sm` (640px), `md` (768px), `lg` (1024px), `xl` (1280px), `2xl` (1536px).
- **RTL & LTR**: Full native support using CSS logical properties and Tailwind `rtl:` modifiers.
- **Contrast Ratio**: Minimum 4.5:1 for body text, 3:1 for large display elements.
- **Keyboard Navigation**: Full tab index, shortcuts (F1-F12, Esc, Enter) for touchless operation.

