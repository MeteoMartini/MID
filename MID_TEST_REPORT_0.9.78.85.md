# MID v0.9.78.85 — Testbericht

Ausgangslage: GitHub Actions Release #917 baute TypeScript und Vite erfolgreich, scheiterte danach an acht Regressionen. Die Fehler wurden nach Logprüfung gezielt korrigiert.

Behoben/neu qualifiziert:
- Komposit-Sichtbarkeits-/Qualitätsvertrag für manuelle MID-Konturen
- Sat/Rad-Playback darf beim Scrollen nicht automatisch stoppen
- DWD-WMS-Fallbacktext
- Event-Empfehlungsregression ohne direkte TypeScript-7-Strada-API
- stabiler Komposit-Persistenzschlüssel `v3`
- seriöse Trinkwasser-/Erholungspausen-Empfehlung
- konfigurierbare Isobaren-/Isohypsen-Paletten statt historischer Farbkonstanten
- TypeScript-7-Kompatibilitätsregression

Lokal ausführbare fokussierte statische Regressionen wurden nach den Änderungen geprüft. Tests, die `typescript-strada` benötigen, konnten in der isolierten Containerumgebung wegen eines `npm ci`-Transport-Timeouts nicht vollständig ausgeführt werden; der GitHub-Runner hatte dieselben Dependencies im unmittelbar vorherigen Lauf erfolgreich installiert. ZIP- und Syntaxintegrität werden vor Auslieferung separat geprüft.
