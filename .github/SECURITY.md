# MID – Sicherheitsrichtlinie

## Meldung von Sicherheitslücken

Sicherheitslücken bitte nicht als öffentliches GitHub Issue melden.

Stattdessen: E-Mail an die Repository-Betreiber unter Angabe von
- Betroffener MID-Version
- Art der Schwachstelle (XSS, Datenleck, Auth-Bypass, etc.)
- Reproduktionsschritten
- Betroffener Komponente (Frontend, Worker, CI/CD)

## Unterstützte Versionen

Es wird grundsätzlich nur der aktuelle `mid-stable`-Stand unterstützt.
Ältere Versionen erhalten keine Sicherheits-Backports.

## Geltungsbereich

- Frontend (React/Vite-PWA unter midwx.app)
- Cloudflare Worker (`mid-data-proxy`)
- Cloudflare R2 / KV (RUC-Daten, Push-Subscriptions)
- GitHub Actions CI/CD-Pipeline
- Cloudflare Web Analytics

**Nicht im Geltungsbereich:** DWD- oder Open-Meteo-APIs selbst, iOS-App-Hülle (App Store-spezifisch).
