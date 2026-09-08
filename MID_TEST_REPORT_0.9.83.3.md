# MID v0.9.83.3 – Test-/Freigabebericht

## Fehleranalyse GitHub #942
Der Release-Inhalt ließ sich sicher entpacken, `npm ci`, Dependency-Audit, TypeScript-7-Typecheck und Vite-8-Produktionsbuild waren erfolgreich. Die nachgelagerte Suite meldete fünf fehlschlagende Pflichtregressionen: zwei direkte `esbuild`-Imports ohne deklarierte Abhängigkeit sowie drei veraltete Erwartungen zu entferntem `browserslist`, dem Klima-Tmax-Farbalias und der Plugin-React-Policy.

## Prüfungen
- saubere Neuinstallation aus `package-lock.json`: bestanden, 202 Pakete
- Dependency-Audit: bestanden, keine HIGH-/CRITICAL-Befunde
- TypeScript-7-Typecheck und Vite-8-Produktionsbuild: bestanden
- alle 721 automatisch erkannten Regressionstests: bestanden
- Worker- und Service-Worker-Syntax: bestanden
- iOS-Webbundle mit Capacitor synchronisiert: bestanden
- Release-Preflight und ZIP-Integritätsprüfung: bestanden

## Änderungsauswirkung
Keine fachliche Änderung an App, Wetterdaten, UI oder Worker. Der Worker benötigt keinen Cloudflare-Upload; seine Versionskennung wird nur releaseweit synchronisiert.
