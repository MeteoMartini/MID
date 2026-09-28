# MID-C7 · Implementierungsnotiz v0.9.85.24

## Problem

Ein neuer Service Worker konnte nach `registration.update()` vollständig heruntergeladen sein, blieb bei geöffneter App aber wartend. Dadurch konnte eine alte App-Shell trotz erfolgreichem Pages-Deployment aktiv bleiben.

## Korrektur

Die PWA registriert den `updatefound`-/`installed`-Übergang und aktiviert einen wartenden MID-Service-Worker kontrolliert über den vorhandenen `MID_ACTIVATE_UPDATE`-Vertrag. Ein bereits wartender Worker wird zusätzlich beim Start erkannt. Die bestehende Update-Vorbereitung, der Gesundheitsnachweis und der Rückfallpfad bleiben unverändert.

## Regression

`test-pwa-waiting-update-098524.mjs` schützt Aktivierung, Controller-Prüfung und den neuen sowie bereits wartenden Updatepfad.
