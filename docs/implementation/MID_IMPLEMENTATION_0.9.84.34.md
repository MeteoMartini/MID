# MID v0.9.84.34 – Implementierungsnotiz

## Update / Start
- `src/v078.ts`: Installationsbeobachtung von Service-Worker-Updates auf 45 s erweitert, `updatefound` berücksichtigt, automatische Aktivierungswiederholung ergänzt. Ein kontrollierter Client wird nicht mehr unter einem alten Controller neu geladen. Nach bestätigtem `controllerchange` kann ein verzögerter 3-s-Fallback die Navigation absichern, falls iOS/PWA die Worker-Navigation nicht übernimmt.
- `public/service-worker.js` / `public/sw.js`: Shell-Precache mit begrenzter Parallelität (4), weiterhin vollständige Validierung und Cache-Löschung bei Teilfehler.
- `src/main.tsx`: Release-Health = stabile App-Oberfläche; Datenquellen-Health wird separat überwacht. Temporäre Wetterdatenprobleme lösen keinen Release-Rollback mehr aus.

## Quellen
- Quellen-Popover im Footer neu strukturiert und an die aktuell im Projekt vorhandenen deterministischen, Ensemble-, Seasonal-, Beobachtungs-, Radar-/Satelliten-, Klima-, Aviation- und Kartenpfade angepasst.
- Hinweis auf tatsächliche horizont-/ortsabhängige Nutzung und Trennung von Verfügbarkeit, Modellstand und aktivem Beitrag ergänzt.

## Events
- `summarizeTimeline`: formale Ensemble-Event-PoP bleibt führend; bei vollständiger Stunden-PoP-Abdeckung wird ein zeitgewichteter, ausdrücklich markierter Ersatzwert verwendet.
- Fehlende PoP allein erhöht keine Event-Schwere.
- `compareEventPlans`: Niederschlagsrisiko-Deltas nur bei numerischen Werten derselben PoP-Quelle.
- `eventEnsembleForecast`: jüngster noch frischer formaler Event-PoP bleibt bei partieller Nachladung nutzbar; Cache-Alter wird dabei nicht verlängert.

## iOS 26/27 Designphase 1
- Mobile Bottom Navigation als inset/safe-area-fähige, schwebende Funktionsschicht verfeinert.
- Glass-/Blur-Einsatz auf Navigation/Controls begrenzt; Inhalts- und Wetterkarten bleiben Standardmaterial.
- Reduced Transparency und Increased Contrast werden explizit berücksichtigt.
- Verbindlicher Designvertrag: `MID_IOS_26_27_DESIGN_CONTRACT.md`.
