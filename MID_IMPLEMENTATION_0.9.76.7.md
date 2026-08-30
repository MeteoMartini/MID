# MID v0.9.76.7 – deutsche Kurzfrist-Wortstellung

Stand: 2026-08-30

## Anlass

Dynamische Kurzfristtexte kombinierten bisher eine Präposition mit einem relativen Zeitlabel. Bei Folgetagen entstand dadurch die unnatürliche Wortstellung `um morgen 19:00` bzw. `ab morgen 14:00`.

## Umsetzung

- Neuer satzgrammatischer Zeitphrasen-Helfer trennt Darstellungslabel und Fließtext.
- `at` ergibt am selben Tag `um 19:00 Uhr`, am Folgetag `morgen um 19:00 Uhr`.
- `from` ergibt am selben Tag `ab 14:00 Uhr`, am Folgetag `morgen ab 14:00 Uhr`.
- Die beiden Kurzfrist-Zusammenfassungspfade verwenden ausschließlich diese Phrasen.
- Neue Regression schützt Wortstellung, Tagesbezug und `Uhr`-Suffix.

## Unverändert

Kanonische Forecast-Fusion, Modellstände, 24-h-Profil, Reisewetter, RUC-Produkte, Worker-Fachlogik und gemeinsamer Browser/PWA/iOS-Kern bleiben unverändert.
