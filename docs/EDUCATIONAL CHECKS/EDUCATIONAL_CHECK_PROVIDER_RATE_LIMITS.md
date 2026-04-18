# Educational Check Provider and Rate Limits

This note is for the educational-check service used by learning mode buttons.

## Provider and Model in current code

- Provider endpoint: Cerebras Inference API ([https://api.cerebras.ai/v1/chat/completions](https://api.cerebras.ai/v1/chat/completions))
- Model tag used: llama3.1-8b`n

## Official rate limits for llama3.1-8b (Cerebras docs)

### Free tier

- Requests per minute (RPM): **30**
- Tokens per minute (TPM): **60K**
- Requests per day (RPD): **14.4K**
- Tokens per day (TPD): **1M**

## Current implementation used for system demo

For the current implementation and panel demo, the educational check is configured and presented using the **Free tier** limits above.

## Important behavior

- Limits are enforced by whichever is hit first (requests or tokens).
- If limits are exceeded, API returns **429 Too Many Requests**.
- Exact active limits can vary by organization/account and are visible in Cerebras account limits and response headers.

## Sources

- [Cerebras Rate Limits](https://inference-docs.cerebras.ai/support/rate-limits)
- [Cerebras Llama 3.1 8B model page](https://inference-docs.cerebras.ai/models/llama-31-8b)