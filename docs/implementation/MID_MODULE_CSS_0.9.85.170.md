# MID v0.9.85.170 · Widget/Bergwetter und CSS-Konsolidierung

## Basis und Umfang
Verifizierte Basis: main = mid-stable = 9b917ed7054903df6da983ed79fe20561af45ab9, v0.9.85.169. Keine überlappende offene Integrations-PR. Logo-Anhänge, Fach-/Kartenlogik und Release-Workflows bleiben unverändert. Die Auslagerung umfasst den vollständigen Widget-/PNG-Generator und die vollständige Bergwetterdarstellung, einschließlich der zugehörigen Auswertungshelfer.

## Modulgrenzen
- `MountainWeather.tsx`: 74 bisher eingebettete Deklarationen; Stationswahl, Stunden-/Tagesprognose, Saison, Wolken-/Sichtdiagnostik, Gewittersignal, Schneefallgrenzen, amtliche Hinweise und Zusatzdatenzustände.
- `WidgetGenerator.tsx`: 7 Deklarationen; gespeicherte Einstellungen, Karten/Kurve/Ensemble, PNG/Clipboard-Fallback und Nur-Widget-URL-Bereitschaft.
- `ForecastDisplayPrimitives.tsx`: 36 gemeinsam benötigte Datums-, Warnungs-, Piktogramm- und Winddarstellungsdeklarationen. App und beide optionalen Module importieren denselben Code; keine Rückabhängigkeit nach App.tsx.
- Alle 117 ausgelagerten Definitionen sind byteidentisch zur freigegebenen .169-Basis. Props werden aus den Originalsignaturen typisiert; lokale Suspense-Grenzen halten die übrige Oberfläche verfügbar. Memo-, Schlüssel-, Abbruch-, Aktualisierungs- und Speicherverträge bleiben erhalten.
- Auch die übrigen 338 App-Deklarationen sind byteidentisch; neue Laufzeitdefinitionen sind ausschließlich die beiden Lazy-Adapter.
- Die Kurvenansicht nutzt weiter SevenDayCurveOverview mit denselben kanonischen Stunden/Quartilen/Einstellungen. PNG-Farben werden weiter über freezeWidgetSvgPaintsForExport aufgelöst. Keine zweite Fach- oder Exportimplementierung.

## CSS-Kaskade
`styles-src/presentation-order.json` enthält die bisherige Reihenfolge von 65 globalen Quelldateien. Der eine verschachtelte lokale CSS-Import wird am ursprünglichen Ort aufgelöst. `maintain:aggregates` erzeugt daraus `midPresentation.css`, den einzigen globalen CSS-Import im Produktionsentry. v078 wird als JavaScript weiterhin ausgeführt; seine Styles laden nicht doppelt. Der frühere separate C14-Link entfällt, sein Style-Modul bleibt an unveränderter Position in der globalen Kaskade.

Die Konsolidierung entfernt ausschließlich frühere Deklarationen, die später mit identischem Selektor, gleicher Folge von Media-/Supports-Bedingungen, identischem Property/Wert und gleichem Importance-Status abgedeckt werden. 1.122 solcher Deklarationen entfallen aus der Laufzeitausgabe. Es werden keine Selektoren zusammengelegt, Werte umgeschrieben, Bedingungen verschoben oder Regeln umsortiert. Layer, Keyframes, Scope, Container und verschachtelte Regeln bleiben von der Entfernung ausgeschlossen. Unbekannte CSS-Importformen und Zyklen führen zum Fehler statt zu einer stillen Umordnung.

Die historischen kanonischen Teilquellen bleiben nachvollziehbar; die generierte Ausgabe ist keine zusätzliche Korrekturschicht und keine zweite handgepflegte Source of Truth. `check:css-consolidation` prüft ihre reproduzierbare Erzeugung. Der reihenfolgeempfindliche semantische SHA-256 der normalisierten .169-Kaskade ist d6ac5656ee252a9ec45a4883828007e32945047b2da455e837376dd64afaa7c2. Neue Ausgabe und kanonische Quellen müssen denselben Hash ergeben. Bei späteren ausdrücklich beauftragten Design-/Fachänderungen ist dieses reine Refactoring-Golden zusammen mit den relevanten fachlichen/visuellen Nachweisen bewusst zu aktualisieren.

## Regressionen und Budgets
Bisherige statische Feature-Checks lesen über appFeatureSources die kanonischen Modulimplementierungen statt nur deren früheren Speicherort. Ladereihenfolge-Checks lesen über presentationEntrySources die tatsächlich für den Generator verwendete Manifestreihenfolge. Ihre fachlichen Assertions bleiben bestehen; direkte Entry-/Modul-/Output-Prüfungen ergänzen sie. Zwei frühere Import-Literalprüfungen prüfen nun getrennt denselben zentralen Periodenrenderer und dessen Datentyp; der Sunshine-Check prüft die tatsächlichen Widget- und App-Formatter an ihren neuen Orten.

Der etablierte eager App-/Wetterkern bleibt im index-Bundle; WidgetGenerator und MountainWeather sind eigenständige Lazy-Chunks. Keine Budgetgrenze wurde erhöht. Die Haupt-JS-Prüfung summiert nun ausdrücklich sämtliche index-Chunks statt nur den größten zu prüfen. PostCSS 8.5.28 ist die bereits im Vite-Lockfile vorhandene Version und wird für den Buildparser direkt als Entwicklungsabhängigkeit gepinnt.

## Browsernachweise
- 56 Fälle: 320×568, 390×844, 412×915, 844×390, 834×1194, 1024×768, 1440×900 × Light/Dark × Widget-Karten/Kurve/Ensemble/Bergwetter. Gegen die .169-Arbeitskopie identische DOM-Layoutmaße, Texte und berechnete Style-/SVG-Farben; keine Laufzeitfehler oder Seitenüberläufe. Netzwerkprotokoll bestätigt keine optionalen Modulabrufe bei geschlossenen Flächen und den Abruf beim Öffnen.
- 12 vorhandene App-/Widget-Browserfälle: echte P25–P75-Geometrie, astronomische Nachtflächen, aufgelöste Exportfarben, tatsächliches PNG und fehlende Mitgliedsdaten.
- 12 Bergwetterfälle im tatsächlichen Produktions-App-Render: Jahreszeiten-/Stationswechsel, Stationshöhe, Datenlücken, Einheiten, Tag/Nacht, Trefferflächen und Footer-/Bottom-Bar-Abstand. Die Testmessung wartet jetzt auf das abgeschlossene Layout am Seitenende; alle bisherigen Geometrie-/Überdeckungsassertions bleiben bestehen.
- Fixtures sind deterministische Komponenten-/UI-Nachweise, kein Live-DWD-Kalibrierungsnachweis. In dieser Umgebung benötigt Chromium die Headless-Shell-Variante; der normale Chrome-Singleton kann keinen Unix-Socket erstellen. Native Xcode-Kompilierung ist auf Linux nicht möglich und wird nicht behauptet.

## Release
Neue Pflichtregression test-module-css-consolidation-0985170.mjs; unter Actions wird zusätzlich die 56-Fälle-Browsermatrix ausgeführt. Release ausschließlich über Source-PR, Source-PR-Gate, bestehenden SHA-gebundenen Release-Bot, serverseitige Paketierung, Installer, Worker-/Pages-Gates und verifizierte Stable-Promotion. Kein lokales Release-ZIP, keine direkten main-/Stable-Schreibvorgänge.

## Lokale Abschlussprüfung
`npm run verify`: TypeScript, Vite, Worker-Syntax und alle 913 Regressionen bestanden. Der neue Test wurde zusätzlich mit GITHUB_ACTIONS=true ausgeführt und bestand alle 56 Browserfälle. Produktionsaudit und Dependency-Policy grün; iOS cap sync erfolgreich. Nach allen Tests erneut sauber gebaut: 100 Assets, Code/Text gzip 1.765.796 Byte, statische Medien 6.536.625 Byte; Haupt-JS als Summe beider index-Chunks 1.405.190/1.500.000 Byte, Haupt-CSS 1.734.454/1.760.000 Byte. Feature-/Lazy-Budgets unverändert bestanden. Gegen .169 sinkt Haupt-JS um 72.058 Byte, Haupt-CSS um 25.008 Byte. Keine native Xcode-Kompilierung behauptet.
