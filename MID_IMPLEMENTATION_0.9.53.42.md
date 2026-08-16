# MID v0.9.53.42 – Produktionsbuild-Fix und appweite Interaktionsstandardisierung

## Anlass

Der GitHub-Produktionslauf von v0.9.53.41 brach im TypeScript-Schritt mit `TS6133` ab. In `ForecastCockpit.tsx` war `bridgeObservedTemperature` nach der Konsolidierung des Temperaturpfads nicht mehr verwendet, aber noch importiert. Da MID mit `noUnusedLocals` baut, war dies ein echter CI-/Produktionsblocker.

## Korrektur des Buildfehlers

- Der verwaiste `bridgeObservedTemperature`-Import wurde aus `ForecastCockpit.tsx` entfernt.
- `relativeForecastTimeLabel` bleibt als tatsächlich verwendete Darstellungshilfe importiert.
- Die Temperaturbrücke bleibt ausschließlich im kanonischen `ShortTermForecast`-Pfad. Es wird keine zweite lokale Temperaturassimilation im Cockpit eingeführt.
- Eine neue Required Regression verhindert, dass der entfernte Import oder eine parallele Cockpit-Temperaturbrücke zurückkehrt.

## Appweiter Design-Audit und unmittelbar umgesetzte Standards

Der Audit zeigte, dass die Kernkomponenten inzwischen weitgehend gemeinsame MID-Primitiven verwenden, aber einige browser-/interaktionsbezogene Grundregeln noch lokal oder nur teilweise abgedeckt waren. Ohne bestehende dichte meteorologische Layouts umzubauen, wurden daher ausschließlich sichere gemeinsame Grundregeln ergänzt:

- kontrollierte mobile Browser-Textskalierung (`text-size-adjust: 100 %`) für konsistenteres iOS-/PWA-Rendering,
- einheitlich deaktivierter nativer Tap-Highlight für Standardinteraktionen,
- einheitliches Touch-Verhalten für Buttons, Links und `summary` auf groben Zeigegeräten,
- konsistenter Disabled-Zustand für native und ARIA-deaktivierte Bedienelemente,
- zentrale Primärfarbe für native Checkboxen, Radios, Range-Regler und Progress-Elemente,
- appweite Respektierung von `prefers-reduced-motion`, ohne Wetterdaten oder fachliche Zustände zu entfernen,
- explizit sichtbarer Tastaturfokus auch im Forced-Colors-/Hochkontrastmodus.

Diese Regeln liegen ausschließlich in der gemeinsamen Styleschicht und sind im UI-Architekturvertrag festgeschrieben.

## Weiterer Designbefund

Der Audit bestätigt weiterhin eine große Zahl historisch gewachsener sehr kleiner Metatexte in hochdichten Fachmodulen. Eine pauschale Mindestschriftgröße wurde bewusst **nicht** in diesem Patch erzwungen, da dies Diagramme, Matrixdarstellungen und die vom Nutzer gewünschte kompakte Informationsdichte regressionsgefährdend verändern würde. Die sinnvolle nächste Stufe ist eine modulweise Migration auf zentrale Typografie-Tokens mit visueller Prüfung je Smartphone-/Tablet-Breite, nicht ein globales CSS-Override.

## Datenfluss / Worker

- Keine Wetterquellen geändert.
- Keine Cache-TTLs geändert.
- Keine zusätzlichen Requests.
- Keine Worker-Funktionsänderung; nur Versionssynchronisierung.
