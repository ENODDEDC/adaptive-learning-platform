# Educational checks for learning modes

## What happens when you click a mode

Before any learning mode runs, the app checks the document text to see if it looks like real learning material.

- If it **passes**, the mode continues.
- If it **fails**, the user sees a message that the document does not look suitable for learning, and the mode stops.
- If the check **cannot run** (service unavailable), the user may see a warning and the behavior can vary by viewer.

This check only decides if this is usable for learning. The actual lesson, visuals, or audio is created after that in a separate step.

## How text is sampled now

For long files, the checker does not read only the beginning anymore.

It now samples three parts of the document text:

- start
- middle
- end

Inside those sampled parts, the system applies a simple score rule to prefer lesson-like chunks and reduce obvious admin/noise chunks before sending text to the model.

The total sampled text still follows the same character budget (default around 8,000, capped at 12,000).

## Model used for the check

- **Provider**: Cerebras
- **Model tag**: `llama3.1-8b`

## Prompt used for the check

```text
You are a content classifier for an adaptive learning platform.
The platform has 8 learning modes (AI Narrator, Visual Learning, Sequential, Global, Sensing/Hands-On, Intuitive/Theory, Active, Reflective).
Decide whether the given document text is SUITABLE for these learning modes.
When the document is long, the user input contains sampled sections from the start, middle, and end.
It also prioritizes stronger educational chunks from those sections using a simple score rule.

PRIMARY DECISION RULE:
- Return isEducational = true when the text contains enough meaningful educational or informational content that a learner could study from.
- Do NOT reject just because some parts are non-educational (headers, notices, admin notes, forms, ads, menus, or mixed snippets).
- Return isEducational = false only when educational/informational signal is too weak, too little, or mostly absent.

ACCEPT examples:
- Lessons, tutorials, lecture notes, textbook chapters
- Articles, research papers, reports, case studies
- Technical documentation, manuals, how-to guides
- Weekly progress reports, project write-ups, reflections about a topic
- News or opinion articles with real information
- Any document explaining, describing, or analyzing a topic

REJECT examples (unless mixed with strong educational content):
- Advertisements, marketing flyers, promotional coupons
- Receipts, invoices, billing statements, order confirmations
- Restaurant menus, price lists
- Blank forms with only labels/fields, no explanation
- Navigation menus, link lists, site maps
- Random binary noise, garbled/scanned text, gibberish
- Pure lorem ipsum filler text

Reply with a single JSON object only (no markdown fences, no text before or after).
Schema:
{ "isEducational": <true|false>, "confidence": <0-1 number>, "category": "<short label>", "reasoning": "<one sentence>", "evidence": ["<snippet1>", "<snippet2>"] }
Use at most 2 evidence strings; each should be a short quote from the document when possible.
```

