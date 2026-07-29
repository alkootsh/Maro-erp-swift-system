# API Report - Swift ERP

- **Endpoints**: `/api/health`, `/api/chat`.
- **Logic**: Server-side proxy for Gemini API (`GoogleGenAI SDK`).
- **Security**: API keys are securely managed in environment variables, NOT exposed to the client.
- **Quality**: The pattern of lazy initialization and secure proxying is correctly implemented.
- **Recommendation**: Add rate limiting on the `/api/chat` endpoint to prevent abuse of the Gemini API quota.
