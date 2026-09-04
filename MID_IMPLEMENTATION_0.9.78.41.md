# MID v0.9.78.41

## Anlass
GitHub-Release-Lauf #875 installierte die Abhängigkeiten erfolgreich, bestand das Produktions-Dependency-Audit und erreichte den TypeScript-7-Check. Dort brach der Lauf mit `TS6133` in `src/detailSkyBar.ts` ab: Der Parameter `sunshineShare` des Niederschlags-Overlay-Helfers war nach der v0.9.78.39-Phasenfarben-Umstellung nicht mehr in Gebrauch.

## Fix
- Den ungenutzten Parameter `sunshineShare` aus `precipitationOverlayVisual` entfernt.
- Den einzigen Aufruf auf die tatsächlichen drei benötigten Argumente reduziert.
- Die phasenabhängigen Niederschlagsfarben, vier Dickenstufen, Tageskarten-Skybar und die v0.9.78.40-Nachtflächen-/Installer-Härtung bleiben unverändert erhalten.
- Neue Regression verhindert die Wiedereinführung des TS6133-Fehlers.

## Worker
Keine fachliche Worker-Änderung; nur Releaseversionssynchronisierung.
