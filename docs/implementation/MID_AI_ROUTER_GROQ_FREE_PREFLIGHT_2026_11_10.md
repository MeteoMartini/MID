# MID AI Router 1.2 – Groq Free key and model read-only preflight

QA DRAFT (10 November 2026). NO model inference, secrets, deploy, merge or release authorized by this document. Stable base: ba4901932c33e584167c31c310fb11601e77b6df, version 0.9.85.453 when written.

## Key creation (user action, no key in ChatGPT)
In Groq console choose a Free organization, create/select project MID-AI-Router-QA, configure project model permissions Only Allow openai/gpt-oss-20b and openai/gpt-oss-120b and conservative rates. ZDR enabled by user assertion must be confirmed in Groq organization Data Controls. Create ordinary PROJECT-SCOPED API key named MID-AI-Router-Groq-Free-QA. Do not activate Developer (paid) tier, billing method or premium services.

## Secret placement – AFTER source release and independent security gates
GitHub public MeteoMartini/MID → Settings → Environments → new environment mid-ai-router-free-qa → restrict to mid-stable branch, require reviewer if available → Environment secrets → New secret, Name GROQ_API_KEY, Value generated secret. Never paste into ChatGPT, issue, PR, workflow source, logs or app frontend. Do not use a repository-wide secret.

The source workflow is defined twice, byte-identically, at canonical ci/github/workflows/mid-ai-router-groq-free-preflight.yml and .github/workflows/mid-ai-router-groq-free-preflight.yml. It can be triggered only manually, by MeteoMartini, on the selected mid-stable ref, on trusted reviewed SHA with contents:read and no persisted credentials. It must pass full normal MID Source-PR, signed controlled merge, installer and stable promotion BEFORE becoming eligible. It uses the protected GitHub Environment secret.

## What it tests
The script checks exact main==mid-stable==GitHub event commit, synchronized version mirrors from the existing fixed-origin GitHub reader, then does exactly one GET to https://api.groq.com/openai/v1/models and no POST. It inspects only whether the exact pinned GPT-OSS model IDs are active; it rechecks source drift after the response. Logs only model IDs and booleans with masked unknowns. Missing Free-account eligibility, actual ZDR and zero-cash status are NEVER promoted to true from a successful model GET. GitHub workflow and secrets remain unconfigured until successful promotion and user account setup.

Source: https://console.groq.com/docs/projects ; https://console.groq.com/docs/models ; https://console.groq.com/docs/model-permissions ; https://console.groq.com/docs/your-data ; https://docs.github.com/en/actions/how-tos/deploy/configure-and-manage-deployments/manage-environments .
