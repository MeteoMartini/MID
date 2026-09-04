# MID Test Report v0.9.78.34

## Ergebnis

**Bestanden.** Der Professional-Quellstand ist für den unversionierten Transport freigegeben.

## Prüfungen

| Prüfung | Ergebnis |
| --- | --- |
| TypeScript (`tsc --noEmit`, App + Node) | bestanden |
| Vite-Produktionsbuild 6.4.3 | bestanden |
| Worker-/Service-Worker-Syntax | bestanden |
| Vollständige MID-Regressionssuite | 657/657 bestanden |
| CodeQL-Remediation #81–#90 | bestanden |
| Produktionsabhängigkeiten | keine HIGH-/CRITICAL-Befunde; OSV-Fallback erfolgreich |
| Release-Uploadbudget | bestanden, ZIP < 24 MB |
| Light-/Dark-Logoassets | 18/18 produktive Dateien bytegenau bestätigt |
| Worker-Semantik v0.9.78.33 → v0.9.78.34 | unverändert (`changed=false`) |

## Bekannte externe Grenze

Die fachlich abzulehnenden Dependabot-PRs #6, #18 und #21 konnten mit dem verbundenen GitHub-App-Zugang wegen `403 Resource not accessible by integration` weder kommentiert noch geschlossen werden. Es wurde nichts gemergt und keine Schutzregel umgangen.
