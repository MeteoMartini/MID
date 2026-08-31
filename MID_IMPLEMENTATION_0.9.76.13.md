# MID v0.9.76.13 – TypeScript-Gate-Hotfix nach Release #787

## Ursache

GitHub Actions Release #787 entpackte das konsolidierte v0.9.76.12-ZIP korrekt,
installierte alle Abhängigkeiten erfolgreich und bestand den Dependency-Audit.
Der Build stoppte anschließend ausschließlich im TypeScript-7-Gate mit TS6133,
weil `profileWindowEndLabel` nach dem Entfernen der redundanten Kopf-Zeitpille
nicht mehr verwendet wurde.

## Korrektur

- Die unbenutzte Konstante `profileWindowEndLabel` wurde vollständig entfernt.
- Der bestehende mobile 24-h-Profil-Regressionsvertrag schützt nun zusätzlich
  davor, dass diese entfernte Konstante erneut eingeführt wird.
- Sämtliche in v0.9.76.12 konsolidierten Änderungen bleiben unverändert: DWD-
  Standort-/Favoritenausschnitt mit Originalpixel-Rückrechnung sowie der mobile
  24-h-Profil-Feinschliff.

## Plattform- und Worker-Vertrag

Browser, PWA und iOS verwenden weiterhin denselben React/Vite-Fachkern. Der
Worker erhält nur die synchronisierte Releaseversionsnummer; es gibt keine
funktionale Worker-Änderung.
