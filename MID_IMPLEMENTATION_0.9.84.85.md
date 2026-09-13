# MID v0.9.84.85 – Implementierungsbericht

## Ziel
App-weite Fortsetzung des Viewport-/Textfluss-Audits aus MID 17.7.24 mit Schwerpunkt auf mobilem Header, Bottom-Navigation, Prognose-Konfidenz, 24-h-Einzeldaten und Auffindbarkeit amtlicher Pegelstände.

## Umsetzung
- Header priorisiert auf schmalen iPhones Logo/Version und essentielle Aktionen; die Versionsnummer bleibt vollständig sichtbar.
- Bottom-Navigation hält kurze Register einzeilig und verhindert Worttrennung; Icons und Typografie skalieren kompakt, Touchziele bleiben erhalten.
- Prognose-Konfidenzkarten stapeln Label, Kernaussage und Erklärung auf schmalen Displays; lange Erklärungen bleiben über den bestehenden Infozugang erreichbar.
- 24-h-Einzeldaten wurden verdichtet. Lufttemperatur, gefühlte Temperatur und Taupunkt stehen als drei getrennte Miniwerte; die sichtbare Delta-Temperatur entfällt.
- Wasser-/Wassersport-Zugänge benennen amtliche Pegel ausdrücklich. Bei aktiviertem Wasserprofil eines Favoriten erscheint im Bereich „Strömung & Tide“ bei vorhandener amtlicher Quelle „Amtlicher Pegel“ (Deutschland: WSV PEGELONLINE, Schweiz: BAFU).
- Neuer Schutzvertrag `test-viewport-textflow-098485.mjs` ergänzt.

## Viewport-Audit
Geprüfte Referenzen: 320×568, 360×640, 375×667, 390×844, 402×874, 430×932, 768×1024, 820×1180, 1024×768, 1280×800, 1440×900 und 1920×1080. Der repräsentative Geometrie-Audit meldete 0 Grenzüberschreitungen.

## Fachlogik
Keine Änderung an Wetterdaten, Modellfusion, Warnlogik, RADOLAN, Pegelquellen oder Worker-Fachlogik.
