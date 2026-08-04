# MID Implementation v0.9.13.1

## Fokus
- 7-Tage-Ansicht erhält ein meteoblue-ähnliches, nach unten aufklappbares Tagesdetail für kompakte Displays.
- Tageskarten zeigen das Nachtpiktogramm nur noch als kleineres Symbol rechts neben dem Tagespiktogramm – ohne zusätzlichen „Nacht“-Schriftzug.
- Tag-/Nacht-Paare nutzen weiterhin die wolkenschichtfähigen Wetterpiktogramme.

## Umsetzung
- `src/App.tsx`
  - `WeatherPeriodIcons` ohne Textlabel für die Nachtvariante angepasst.
  - neue Hilfen für Windrichtungs-Kurzform und kompakte Niederschlagsanzeige ergänzt.
  - kompakte Tagesdetails als meteoblue-ähnliches Akkordeon direkt unter dem aktiven Tag implementiert.
  - 3h/1h-Umschalter bleibt im aufgeklappten Tagesdetail erhalten.
  - Klick auf denselben Tag klappt die Details wieder zu; Klick auf einen anderen Tag öffnet dessen Detailbereich.
- `src/ForecastCockpit.tsx`
  - Nachtpiktogramm ebenfalls ohne Textlabel dargestellt.
- `src/styles.css`
  - Abstand/Anordnung für Tages- und Nachtpiktogramme so überarbeitet, dass keine Überlagerung entsteht.
  - neue kompakte Listenoptik für aufgeklappte Tagesdetails ergänzt.
- `scripts/test-cloud-layer-day-night-details-09130.mjs`
  - Regressionstest auf schriftzugfreie Nachtpiktogramme und das neue Akkordeon-Detail erweitert.

## Regression
- `node scripts/test-forecast-cockpit-pictograms-09100.mjs`
- `node scripts/test-night-icons-astronomy-08130.mjs`
- `node scripts/test-cloud-layer-day-night-details-09130.mjs`

## Hinweis
- Ein vollständiger `npm run build` war in der vorliegenden Arbeitsumgebung nicht möglich, weil die lokal installierten Frontend-Abhängigkeiten fehlten (`react`, `react-dom`, `lucide-react` etc. konnten vom TypeScript-Build nicht aufgelöst werden).
