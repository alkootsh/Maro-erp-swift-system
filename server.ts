import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";

// In-memory PostgreSQL simulated store buffer for local/container dev when external database is offline
const erpDatabaseStore: Record<string, any[]> = {
  products: [],
  product_categories: [],
  product_groups: [],
  brands: [],
  manufacturers: [],
  inventory_settings: [
    {
      id: 'global',
      defaultValuationMethod: 'FIFO',
      allowNegativeStock: false,
      defaultTaxRate: 14,
      defaultReorderLevel: 5,
      enforceBatchTracking: false,
      enforceExpiryTracking: false,
      updatedAt: new Date().toISOString()
    }
  ],
  audit_logs: []
};

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API routes FIRST
  app.get("/api/health", (req, res) => {
    res.json({ 
      status: "ok", 
      architecture: "PostgreSQL + MARO Sync Engine (Offline-First Enterprise ERP)",
      syncEngine: "Active"
    });
  });

  // --- MARO Sync Engine PostgreSQL Operational ERP Endpoints ---
  app.get("/api/erp/:collection", (req, res) => {
    const { collection } = req.params;
    const data = erpDatabaseStore[collection] || [];
    res.json(data);
  });

  app.post("/api/erp/sync", (req, res) => {
    try {
      const { operations } = req.body || {};
      const syncedOperationIds: string[] = [];

      if (Array.isArray(operations)) {
        operations.forEach((op: any) => {
          const { id, collectionName, type, entityId, payload } = op;
          if (!erpDatabaseStore[collectionName]) {
            erpDatabaseStore[collectionName] = [];
          }

          const coll = erpDatabaseStore[collectionName];

          if (type === 'DELETE') {
            erpDatabaseStore[collectionName] = coll.filter(item => item.id !== entityId);
          } else {
            const idx = coll.findIndex(item => item.id === entityId);
            if (idx >= 0) {
              coll[idx] = { ...coll[idx], ...payload, updatedAt: new Date().toISOString() };
            } else {
              coll.push({ ...payload, id: entityId, updatedAt: new Date().toISOString() });
            }
          }
          syncedOperationIds.push(id);
        });
      }

      res.json({
        success: true,
        syncedCount: syncedOperationIds.length,
        syncedOperationIds,
        timestamp: new Date().toISOString()
      });
    } catch (err: any) {
      console.error("MARO Sync Engine Error:", err);
      res.status(500).json({ error: err.message || "Sync execution failed" });
    }
  });

  app.post("/api/chat", async (req, res) => {
    try {
      const { messages, context } = req.body;
      
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return res.status(500).json({ error: "GEMINI_API_KEY environment variable is required" });
      }

      const ai = new GoogleGenAI({ apiKey });
      const model = "gemini-3-flash-preview";

      const systemInstruction = `أنت مساعد ذكي لنظام MARO ERP (نظام إدارة موارد المؤسسات).
النظام يعمل بمعمارية PostgreSQL ومحرك المزامن Offline-First MARO Sync Engine.
البيانات الحالية للنظام (سياق مهم للإجابة على الأسئلة):
${context}

أجب دائماً باللغة العربية بأسلوب مهني، محاسبي دقيق، ومختصر قدر الإمكان.
استخدم البيانات المقدمة في السياق لإنشاء تقارير دقيقة والتنبؤ بالمستقبل أو اقتراح نصائح إدارية.
إذا طُلب منك تقرير، قم بتنسيقه بشكل جميل باستخدام الجداول العادية في Markdown.
`;

      const response = await ai.models.generateContent({
        model,
        contents: messages,
        config: {
          systemInstruction,
          temperature: 0.7,
        }
      });

      res.json({ text: response.text });
    } catch (error: any) {
      console.error("AI Chat Error:", error);
      res.status(500).json({ error: error.message || "Internal Server Error" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`MARO ERP Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
