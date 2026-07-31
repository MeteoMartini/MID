## MID v0.8.26.15 umgesetzt

- TypeScript-Buildfehler TS18048 in `ShortTermForecast.tsx` behoben.
- `anchor` und `horizon` werden vor Plausibilitätsprüfung und Vergleich in sichere numerische Werte überführt.
- Die hyperlokale Anpassung der ersten Kurzfrist-Zeitschritte bleibt funktional erhalten.
- Regression `test-short-term-anchor-narrowing-buildfix-082615.mjs` ergänzt.
