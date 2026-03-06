# Rayeva AI — AI Systems Assignment

Role target: Full Stack / AI Intern  
Focus: Applied AI for Sustainable Commerce

This project fully implements **2 modules** (Module 1 and Module 4) and provides architecture for the remaining modules (Module 2 and Module 3), with production-oriented separation of AI and business logic.

## Folder Structure

```text
rayeva-ai/
  backend/
    server.js
    database.js
    services/
      aiService.js
    src/
      controllers/
        productController.js
        whatsappController.js
      routes/
        productRoutes.js
        whatsappRoutes.js
      utils/
        productValidation.js
  frontend/
```

## Architecture Diagram

```text
[Client/Postman] --> [Express API]
                        |-- /api/products/classify --> [AI Service] --> [OpenAI]
                        |                              \-> [AI Logs table]
                        |-- /whatsapp --> [Twilio Webhook Logic]
                        |
                        \-> [SQLite]
                              |- Products
                              |- Orders
                              |- Conversations
                              \- AILogs
```

## Scope Coverage

- Fully implemented: **Module 1**, **Module 4**
- Architecture outlined: **Module 2**, **Module 3**

## Fully Implemented Modules

### Module 1 — Product Categorization (Implemented)

Input:
- `name`
- `description`

Flow:
1. Controller builds prompt.
2. `services/aiService.js` calls OpenAI.
3. Raw prompt/response is logged in `AILogs`.
4. JSON is validated against allowed categories and filters.
5. Product is stored in `Products` table.
6. Structured JSON is returned.

### Module 4 — AI WhatsApp Support Bot (Implemented)

Route:
- `POST /whatsapp`

Rules:
- If message contains `order status` → latest order fetched from DB.
- If message contains `return` or `return policy` → return policy response is provided.
- If message contains `refund`, `urgent`, `angry`, `complaint`, or `cancel order` → high-priority escalation (`escalated = 1`).
- For other messages, AI generates concise support response.
- Conversation is stored in `Conversations`.
- Twilio XML response is returned.

Structured output endpoint (for evaluation/Postman):
- `POST /api/whatsapp/preview` returns JSON with `reply` and `escalated`.

## Architecture for Remaining Modules

### Module 2 — AI B2B Proposal Generator (Architecture only)

Input:
- Budget
- Industry type

Design:
1. AI suggests product mix.
2. Backend calculates total cost.
3. Backend enforces `total <= budget`.
4. Response is structured JSON.

### Module 3 — AI Impact Reporting Generator (Architecture only)

Backend-first logic:
- `plasticSaved = quantity * 20g`
- `carbonAvoided = quantity * 0.5kg`

AI role:
- Generate a readable narrative summary from computed metrics.

Store with order:
- `impactStatement` and computed metrics can be saved against order record in a next iteration.

## Prompt Strategy

- Use strict schema prompts.
- Include allowed category/filter lists in prompt.
- Enforce JSON-only output.
- Reject invalid AI output via backend validation.
- Log prompt + raw AI response in `AILogs` for observability.

## Technical Requirements Mapping

1. Structured JSON outputs  
  - Module 1: `POST /api/products/classify`  
  - Module 4: `POST /api/whatsapp/preview`
2. Prompt + response logging  
  - All OpenAI calls logged to `AILogs`
3. Environment-based API key management  
  - `.env` and `.env.example` used; no hardcoded keys
4. Clear separation of AI and business logic  
  - AI in `services/aiService.js`, logic in controllers/utils
5. Error handling and validation  
  - Try/catch wrappers, validation on AI JSON, clean error responses

## Evaluation Criteria Alignment

- Structured AI Outputs: strict JSON schema + validation
- Business Logic Grounding: category/filter allowlists, order lookups, escalation rules
- Clean Architecture: routes/controllers/services/utils/database split
- Practical Usefulness: real WhatsApp flow + DB-backed order status
- Creativity & Reasoning: hybrid logic + AI fallback for support conversations

## Example JSON Output (Module 1)

```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "Compostable Coffee Cup",
    "description": "Plant-based lined paper cup for cafes",
    "category": "Hospitality",
    "subCategory": "Cups",
    "seoTags": ["compostable cup", "eco cafe supplies", "plastic free cup"],
    "sustainabilityFilters": ["compostable", "plastic-free", "food-safe"],
    "createdAt": "2026-03-04T00:00:00.000Z"
  }
}
```

## Local Run

1. Install dependencies:

```bash
cd backend
npm install
```

2. Configure env:

```bash
cp .env.example .env
```

Fill values for:
- `OPENAI_API_KEY`
- `TWILIO_SID`
- `TWILIO_AUTH_TOKEN`

3. Start server:

```bash
npm start
```

Backend runs on `http://localhost:5000`.

## API Endpoints

- `GET /` health message
- `GET /health` health check
- `POST /api/products/classify`
- `POST /whatsapp`
- `POST /api/whatsapp/preview`

## Postman Quick Test

`POST /api/products/classify`

Body:

```json
{
  "name": "Bamboo Cutlery Set",
  "description": "Reusable bamboo spoon, fork, and knife for takeaway meals"
}
```

## Demo Checklist (3–5 min)

1. Show product categorization API result.
2. Show WhatsApp webhook flow (`order status`, `refund`).
3. Show SQLite tables and records (`Products`, `Conversations`, `AILogs`).
4. Show logs from failed/invalid AI responses.
