# MID v0.9.78.83 – Event-Empfehlungen plausibilisiert

Basis: v0.9.78.82.

## Anlass

Der Eventplaner empfahl bei Fußball und rund 24 °C pauschal „wetterangepasste Übergangskleidung“. Ursache war eine globale Dreistufenlogik (`>=27 °C`, `<=4 °C`, sonst Übergangskleidung), die Aktivität und Umgebung nicht berücksichtigte.

## Änderungen

- Neue zentrale `eventRecommendationPolicy.ts` mit aktivitäts- und umgebungsbezogener Empfehlungspolitik.
- Fußball/Laufen/Tennis: ab etwa 18 °C leichte, atmungsaktive Sportkleidung; kühlere Bereiche erhalten Pausen-/Funktionsschichten statt Alltagskleidung.
- Radfahren, Wandern/Klettern und Golf besitzen eigene thermische Profile.
- Skifahren und Wassersport erhalten stets sportartspezifische Hinweise.
- Indoor-Ereignisse werden nicht mehr anhand der Außentemperatur als hitze- oder kältekritisch eingestuft.
- Wärmehinweise setzen bei intensiven Sportarten früher ein als bei passiven Aktivitäten; Kältehinweise berücksichtigen Exposition und Aktivität.
- Niederschlags-/Windzusätze sind aktivitätsspezifisch, z. B. trockene Wechsel-/Pausenschicht beim Fußball.
- Fehlende Event-Niederschlagswahrscheinlichkeit wird nicht länger über `Number(null)` als `0 %` dargestellt; fehlende Werte erscheinen als `–`.
- Bei unvollständiger Datengrundlage zeigt der kompakte Timing-Hinweis keine parallele Entwarnung mehr, sondern fordert eine erneute Aktualisierung vor dem Termin.
- Verbindlicher Vertrag `MID_EVENT_RECOMMENDATION_CONTRACT.md` und Pflichtregression `test-event-recommendation-sanity-097883.mjs` ergänzt.

## Worker

Keine fachliche Workeränderung. Versionssynchronisierung erfolgt nur für den gemeinsamen Releasevertrag.
