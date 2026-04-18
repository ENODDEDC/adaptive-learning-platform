# Learning modes: Gemini → Groq migration

This document summarizes changes made to move **generative** calls for the learning-mode stack from **Google Gemini** to **Groq** (OpenAI-compatible API), using **Meta Llama 3.1 8B Instant**.

## Why

- Gemini free-tier quotas were easy to exhaust (e.g. 429 / quota errors), which broke content generation for Sequential Learning and related modes.
- Groq’s free tier offers a much higher **requests-per-day** budget for `llama-3.1-8b-instant`, with fast inference and an OpenAI-style HTTP API.

## What changed

### 1. Groq client shim (`src/lib/groqGenAI.js`)

- Added a small **drop-in replacement** for the subset of `@google/generative-ai` used by services:
  - `new GoogleGenerativeAI(apiKey)` → internally uses `**GROQ_API_KEY`**
  - `getGenerativeModel({ model: ... })` → returns a wrapper that calls Groq `**POST https://api.groq.com/openai/v1/chat/completions`**
  - `generateContent(prompt)` → maps to a single user message; response exposes `response.text()` like Gemini
- **Gemini model name** passed from old code is ignored for routing. **Content generation** defaults to `**llama-3.3-70b-versatile`** (single model, no agentic fan-out); optional env overrides below.

### 2. Services switched to Groq (via shim)

These files now import `GroqGenAI` aliased as `GoogleGenerativeAI` and initialize with `process.env.GROQ_API_KEY` instead of `GOOGLE_API_KEY` / `NEXT_PUBLIC_GOOGLE_API_KEY`:


| File                                                | Role                             |
| --------------------------------------------------- | -------------------------------- |
| `src/services/sequentialLearningService.js`         | Sequential learning generation   |
| `src/services/visualContentService.js`              | Visual learning generation       |
| `src/services/globalLearningService.js`             | Global learning generation       |
| `src/services/sensingLearningService.js`            | Sensing / hands-on generation    |
| `src/services/intuitiveLearningService.js`          | Intuitive / concept generation   |
| `src/services/activeLearningService.js`             | Active learning hub generation   |
| `src/services/learningModeRecommendationService.js` | Recommendation-related LLM calls |


**Not changed in this migration:** `src/services/aiTutorService.js` (AI Narrator) — intentionally left on the existing stack unless you decide to move it later.

### 3. Educational gate (`src/app/api/content/educational-gate/route.js`)

- Classifier / pre-check for “learnable vs not” was moved to **Groq** JSON classification (same API key), so that path does not depend on Gemini quota for gating.
- Gate model is **fixed** to `**llama-3.1-8b-instant`** (cheap classifier). After approval, learning modes use `**llama-3.3-70b-versatile`** by default via `groqGenAI.js` (override with env if needed). `groq/compound` is **not used** because it's an agentic router (mixes sub-model ids in logs) and has a smaller per-request size limit that triggers `request_too_large`.

### 4. Environment variables

- `**GROQ_API_KEY`** — set in `.env.local` (server-side only; do not commit real keys to public repos).

**Built-in two-model flow:** same `**GROQ_API_KEY`** — gate always `**llama-3.1-8b-instant`**, learning-mode generation defaults to `**llama-3.3-70b-versatile`**.


| Variable                                                                                 | Used by                | Role                                                     |
| ---------------------------------------------------------------------------------------- | ---------------------- | -------------------------------------------------------- |
| *(none for gate)*                                                                        | `educational-gate`     | Classifier is hardcoded `**llama-3.1-8b-instant`**       |
| `**GROQ_CONTENT_MODEL`** (aliases `**GROQ_GENERATION_MODEL`**, `**GROQ_DEFAULT_MODEL*`*) | `src/lib/groqGenAI.js` | Optional override; default `**llama-3.3-70b-versatile**` |


Optional: `**GROQ_GATE_MAX_CHARS**` — max excerpt length for the gate (default `8000`).

**Operational note:** After changing `.env.local`, **restart** the Next.js dev server so `process.env` picks up new values.

### 5. Redundant “educational” re-check in Sequential Learning

- `sequentialLearningService.analyzeContentForEducation` was simplified so the API does **not** run a second full LLM pass when the client has already passed the educational gate — reducing duplicate calls and failure modes.

---

## Groq free tier — `llama-3.1-8b-instant` (reference)

Official limits (Developer / free plan, as documented by Groq for this model):


| Limit                         | Value |
| ----------------------------- | ----- |
| **RPM** (requests per minute) | 30    |
| **RPD** (requests per day)    | 14.4K |
| **TPM** (tokens per minute)   | 6K    |
| **TPD** (tokens per day)      | 500K  |


Docs entry point: [Groq documentation overview](https://console.groq.com/docs/overview)

---

## Estimated characters per minute / per day (rough)

Groq bills **tokens**, not characters. A common rule of thumb for English is **~4 characters per token** (real range often **~3–5** depending on text: code, JSON, and short words skew lower; prose skews higher).

**From TPM 6,000 tokens/minute**

- At **4 chars/token**: `6,000 × 4 ≈ 24,000` characters per minute **total** (input + output combined across all concurrent requests in that minute).
- At **3 chars/token**: `≈ 18,000` chars/min total.
- At **5 chars/token**: `≈ 30,000` chars/min total.

So **~24k characters/minute** is a reasonable **ballpark** for mixed English text, not a hard guarantee.

**From TPD 500,000 tokens/day**

- At **4 chars/token**: `500,000 × 4 ≈ 2,000,000` characters per day **total** (again: all requests and both directions of token usage).
- Same caveat: treat as **order-of-magnitude**, ±25% or so for typical prose.

**Interaction with RPM (30/min)**

- You can send up to **30 separate requests** per minute, but **TPM still caps total tokens** in that minute. Heavy prompts in every request will hit TPM before RPM.

---

## Defense / capstone talking points

1. **Separation of concerns:** Client (or gate API) checks learnability; mode generators focus on transforming already-approved text — fewer duplicate LLM calls.
2. **Provider choice:** Groq + Llama 3.1 8B is a **documented, rate-limited** free inference tier suitable for demos and moderate testing.
3. **Throughput language:** Always describe limits in **tokens** first, then give **character estimates as approximations** with the 3–5 chars/token range.

---

## Rollback

To revert a service to Gemini:

1. Restore `import { GoogleGenerativeAI } from '@google/generative-ai'`.
2. Restore API key to `GOOGLE_API_KEY` / `NEXT_PUBLIC_GOOGLE_API_KEY` as before.
3. Remove or stop using `src/lib/groqGenAI.js` for that service.

---

*Last updated: aligned with the Groq migration described above.*