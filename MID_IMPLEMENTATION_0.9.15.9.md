# MID v0.9.15.9 – Benachrichtigungsstart und K3D-Layer

## Benachrichtigungen

Der Service Worker ignoriert beim Öffnen einer Push-Benachrichtigung nun absichtlich eine eventuell mitgelieferte Ziel-URL. Als Ziel wird immer der Root des registrierten MID-Scopes verwendet. Hash und vorhandene Suchparameter werden entfernt; nur die geprüften Standortparameter der Benachrichtigung werden ergänzt.

Bereits geöffnete MID-Fenster erhalten zusätzlich `MID_NOTIFICATION_OPEN`. Die App schließt dadurch Einstellungen und Impressum und setzt die Startansicht auf den Seitenanfang zurück.

## KONRAD3D

Die K3D-Pfade verlassen sich nicht mehr auf den impliziten Leaflet-Standardrenderer. `KonradNowcastObjects` erstellt einen expliziten SVG-Renderer für `mid-nowcast-objects` und weist ihn sämtlichen Kreisen, Polygonen, Polylinien und Prognosepunkten zu.

Zusätzlich wurden Sichtbarkeit und Ausfallsicherheit verbessert:

- heller Halo für Zellfläche, Korridor, Zugbahn und Unsicherheitsellipsen,
- stärkere Vordergrundlinien,
- permanente kompakte Zeitmarken an ausgewählten Prognosepunkten,
- Fallback-Spur aus einer vorhandenen prognostizierten Endposition, falls weder amtliche Einzelpunkte noch ein verwertbarer Zugvektor vorliegen.

## Deployment

Frontend- und Service-Worker-Änderung. Der Cloudflare-Worker enthält keine funktionale Änderung und wird nur versionssynchronisiert.

## Qualitätssicherung

- 289 automatisch erkannte MID-Regressionstests bestanden.
- Neuer v0.9.15.9-Vertrag für Startansicht aus Benachrichtigungen und explizites K3D-SVG-Rendering bestanden.
- K3D-Zellfläche, Prognosepunkte, 1σ-Korridor, Unsicherheitsellipsen und Legende regressionsgeschützt.
- 80 TypeScript-/TSX-Dateien syntaktisch parsergeprüft.
- Frontend-Service-Worker, Spiegel-Service-Worker und Cloudflare-Worker syntaktisch geprüft.

Ein vollständiger lokaler npm-/Vite-Produktionsbuild war in der isolierten Umgebung nicht möglich, weil der bereitgestellte interne Paketserver `yallist-3.1.1.tgz` mit HTTP 404 beantwortet. Die vollständige projektspezifische Regression wurde unabhängig davon erfolgreich ausgeführt.
