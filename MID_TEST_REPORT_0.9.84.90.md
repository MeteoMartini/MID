# MID v0.9.84.90 – Testbericht

- Ursache aus GitHub Actions #1043 reproduziert: 3 von 783 Regressionen schlugen trotz erfolgreichem TypeScript-/Vite-Produktionsbuild fehl.
- Die drei betroffenen Tests wurden auf den seit v0.9.84.88 gültigen kompakten Komposit-UI-Vertrag migriert.
- Fokussierte Wiederholung der drei zuvor fehlerhaften Tests: bestanden.
- Versionssynchronisation auf 0.9.84.90: package, Lockfile, Baseline, iOS-Status, Web-/Service-Worker und Worker-Version synchronisiert.
- Der vollständige lokale `npm run verify`-Pfad wurde gestartet, konnte aber nicht valide abgeschlossen werden, weil `npm ci` in der isolierten Containerumgebung am Pakettransport-Timeout abbrach und dadurch TypeScript-Typdefinitionen unvollständig waren. Dieser lokale Infrastrukturfehler wird nicht als Produktfehler oder bestandener Volltest gewertet.
- GitHub #1043 hatte TypeScript 7 und Vite 8 für denselben Produktionscode bereits erfolgreich gebaut; die drei einzigen nachgelagerten Regressionsfehler wurden lokal reproduziert und bestehen nach der Korrektur.
