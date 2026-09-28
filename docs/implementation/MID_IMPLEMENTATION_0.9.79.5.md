# MID v0.9.79.5 · Optionales Bedienkonzept, Schritt 6

## Ausgangsbasis

Verbindlicher vorheriger Stand: **v0.9.79.4**.

## Umsetzung

- Der optionale `bottom-tabs`-Modus besitzt nun einen eigenen Planen-Hub vor den bestehenden Planer-/Aktivitätsmodulen.
- Der Bottom-Tab **Planen** fokussiert den Hub, ohne automatisch Event- oder Reisemodule aufzuklappen.
- Der Hub verwendet ausschließlich bestehende Module: Eventplaner, Reiseplaner, Berg-/Wintersport und Wassersport.
- Nicht verfügbare Berg-/Wasserprofile führen zu **Favoriten & Profile**; deaktivierte Event-/Reisemodule führen zur vorhandenen Ansichts-/Modulkonfiguration.
- Der bestehende Event-/Reiseplanerblock wird im modernen Modus visuell entdoppelt; `classic` behält den bisherigen Planer-Kopf.
- Der Bottom-Tab **Mehr** zeigt im Beta-Modus oben Schnellzugriffe auf Einstellungen, Benachrichtigungen, Favoriten/Profile und Wetterzwilling. Darunter bleiben zusätzliche Fach-, Profi- und Werkzeugmodule erreichbar, ohne die Top-Level-Ziele unnötig zu duplizieren.
- Neue Touchziele sind auf kompakten iOS-Ansichten mindestens 44 px groß; Hoch-/Querformat sind berücksichtigt.
- Keine neuen Wetterabfragen, keine Änderung an Forecast-Fusion, Radar-/Satellitenprodukten, Radarfarben, Parameterfarben, Piktogrammen oder Einheiten.

## Verifikation

Neue verpflichtende Regression: `scripts/test-modern-plan-more-hierarchy-09795.mjs`. Die Regressionen aus Schritt 1–5 bleiben weiterhin verpflichtend.
