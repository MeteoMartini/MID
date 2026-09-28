# MID – Pull Request Checklist

## Beschreibung
<!-- Kurz beschreiben, was dieser PR ändert oder hinzufügt -->

## Art der Änderung
- [ ] Bugfix
- [ ] Neue Funktion
- [ ] Wartungsrelease (Dokumentation, Refactoring, Dependencies)
- [ ] CI/CD / Infrastruktur
- [ ] Breaking Change

## Basis
- [ ] Branch basiert auf `mid-stable` (nicht `main` oder älterem Stand)
- [ ] `package.json`-Version und `MID_BASELINE.json` geprüft

## Meteorologische Fachgrundlage
- [ ] WMO/DWD-Standards eingehalten (falls zutreffend)
- [ ] Schwellenwerte und Terminologie korrekt (falls zutreffend)
- [ ] Datenquelle im Quellen-Dialog dokumentiert (falls neue Datenquelle)

## Tests
- [ ] Source-PR-Gate grün (881 Regressionstests)
- [ ] Produktionsbuild erfolgreich
- [ ] Responsive Design geprüft (iPhone, iPad, Desktop)
- [ ] Light/Dark-Modus geprüft

## Sicherheitsregeln
- [ ] Keine direkten Änderungen an `main` oder `mid-stable`
- [ ] Keine Secrets, API-Keys oder Tokens im Code
- [ ] Keine Umgehung von Rulesets oder Release-Gates
- [ ] Keine Aufweichung von Least-Privilege-Regeln

## Cloudflare
- [ ] Worker-Code (`worker/metar-proxy.js`) funktional geändert? → Auto-Deploy wird ausgelöst
- [ ] Worker-Code unverändert? → Auto-Deploy entfällt korrekt
- [ ] RUC-Pipeline betroffen? → `?mode=ruc-health` geprüft
