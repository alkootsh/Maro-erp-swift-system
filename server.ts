import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API routes FIRST
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
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

      const systemInstruction = `أنت مساعد ذكي لنظام سويفت ERP (Swift ERP).
النظام يدير المبيعات والمشتريات والمخازن والحسابات.
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
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
