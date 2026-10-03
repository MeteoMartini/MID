# Modellkarten: einheitliche Einheiten und kontinuierliche Farben

## Basis und Bestandsschutz

Veröffentlichte Basis: `.147`, `main == mid-stable == e28fdd42a3e68decf4b2671d3cd71751a3e711af`. Die während der vorangegangenen Arbeit veröffentlichten .146/.147 wurden vor Beginn übernommen. Sonnen-/Mondzeilen, Bergwettertabelle, feste untere Navigation und Kartensteuerung bleiben erhalten. Dependabot-PR #139 gehört nicht zu diesem Auftrag. Keine neuen Abhängigkeiten, kostenpflichtigen Dienste oder erhöhten Budgets.

Zusätzlich abgeglichener unveröffentlichter Parallelstand: `chatgpt/v0.9.85.148-model-map-units-palette-bottom-viewport` bei `e3d9f7ac2567b66bfbd0f769ffc5fa5d415eb5fb` (vier Commits, letzter 2026-10-03 06:47:30 UTC). Die dort begonnene Einheitenweitergabe wird funktional zusammengeführt und bis zum Raster-/Exportformatter vervollständigt; keine konkurrierende Prop-Kette. Die Navigation wird wie im Parallelstand per Portal an den Viewport gebunden. Ein neutraler `display:contents`-Wrapper erhält jedoch den bisherigen `.navigation-bottom-tabs`-Namensraum: Die originale mobile/Tablet-/Desktop-CSS und die Forecast-Oberkantenmessung funktionieren weiterhin. Ein blindes Umbenennen nur der mobilen CSS hätte die Desktopnavigation ausgeblendet und die Forecast-Höhenmessung getrennt. Das Browsergate rendert das tatsächliche produktive Portal-/Tab-JSX mit sämtlichen Styles unter einem transformierten und `contain:paint`-Dashboard, prüft fünf Ziele und die feste Lage nach Scrollen. Der Parallelbranch selbst bleibt unverändert erhalten.

## Einheitenvertrag

Die bestehende Wind-Einstellung `kn | kmh | ms | mph` wird von App über MapWorkspacePanel und WeatherMapsPanel bis NativeModelMap weitergereicht. `modelMapUnits.ts` verwendet ausschließlich den bestehenden Formatter `wind`: native, verifizierte km/h werden einmal nach kanonischen Knoten umgerechnet und anschließend entsprechend der Einstellung formatiert. Numerische Ortswerte, Favoriten, Popups, Legenden und PNG-/SVG-Exports stimmen überein. Ein Einheitenwechsel lädt keine neuen Felddaten und ändert weder Rohwerte noch Rasterfarben. Der Validator weist widersprüchliche bzw. nicht unterstützte Roh-Einheiten ab. Andere Parameter behalten ihre vorhandenen festen Einheiten; die Einstellungen enthalten dafür keine separate Auswahl.

Standard-Windfiedern auf originalen WMS-Karten bleiben als meteorologische Symbole unverändert (halbe Feder 5 kt, ganze 10 kt, Wimpel 50 kt). Die zusätzliche Erklärung zeigt diese Werte in der gewählten Einheit. Anbieter-Kategorien/Prozentlegenden werden nicht fälschlich als Geschwindigkeiten umgerechnet.

## Gemeinsame Skala

`modelMapColorScale.ts` berechnet genau eine Skala, die aktive Rasterpixel, sichtbare Legende und Export teilen. Numerische Farben werden zwischen bestehenden Palettenankern in sRGB kontinuierlich interpoliert; CSS- und SVG-Verläufe deklarieren denselben Farbraum ausdrücklich.

- **Wertebereich:** volle gültige Min-/Max-Spanne des dargestellten Deutschland-Rasterfelds, nicht nur sichtbare Zoompixel. Keine Perzentilabschneidung von Extremwerten. Eine geringe Mindestspanne verhindert instabile Division; konstante oder leere Felder fallen auf die feste Skala zurück und erfinden keinen Kontrast.
- **Feste Skala:** absolute zentrale Palettenanker. Temperatur folgt der kanonischen ECMWF-inspirierten MID-Skala. Animationen erzwingen die feste Skala, damit Terminfärbungen vergleichbar bleiben.
- **Kategorien:** WMO-Wettercodes bleiben diskret; kein scheinbar numerischer Verlauf.
- **Niederschlag:** unter 0,1 mm transparent; vorhandene Null ist trocken, nicht fehlend. Fehlende beobachtete Zellen (-1) bleiben grau und beeinflussen die Wertebereichsskala nicht. Ganz nasse Felder beginnen bei ihrem tatsächlichen Minimum.

WMS-Bilder ohne verifizierte numerische Rasterdaten behalten ihre Originalpalette. Eine Bild-Neufärbung würde die Mengen-/Kategoriezuordnung verfälschen und wird nicht vorgetäuscht.

## Referenzen

- Copernicus Interactive Climate Atlas: einstellbare Min-/Max-Grenzen, Auto-Fit und kontinuierliche/dis­krete Skalen: https://confluence.ecmwf.int/spaces/CKB/pages/394237545/Copernicus+Interactive+Climate+Atlas+User+Guide
- Windy Map Forecast API: Trennung der Overlaymetriken/Umrechnung von der Farbsteuerung: https://api.windy.com/map-forecast/docs
- NOAA/NWS, standardisierte Windfiedern: https://www.weather.gov/hfo/windbarbinfo

## Verifikation

Bestehender Pflichtkatalog bleibt bei 899 Regressionen. Einheiten-/Skalenprüfung wird in `test-adaptive-native-maps-0985141.mjs` eingebunden; Browser-QA prüft echte NativeModelMap-/PrecipitationTotalsMap-Ansichten in fünf Größen, Hell/Dunkel, vier Windeinheiten und beiden Exportformaten. Integritäts-, Intervall-, Frische-, Geographie- und Missing-Cell-Prüfungen bleiben erhalten. Legendenwerte und Buttons werden zusätzlich gegen alle übergeordneten Overflow-/Paint-Clipping-Grenzen geprüft: Eine nur geometrisch vorhandene, aber vom Kartencontainer abgeschnittene Legende ist nicht zulässig. Die produktive Legende steht deshalb außerhalb des Kartencontainers.

## Fail-closed UI-Fallback

Replit lieferte zunächst eine eigenständige Komponente ohne tatsächliche Integration (fb88dbd0a6066cd1232813966c79655151f23995, Handoff-Gate 37105360699 rot wegen gültiger Reachability-Prüfung). Der nachfolgende Stand e07b1f20986708e21af382d2bd2c3a322481ed1c erhielt nur durch eine Dormant-Ausnahme in dieser Architekturprüfung ein grünes Gate 37105880084. Diese Teständerung wurde ausdrücklich abgelehnt. Mehrere Korrektur-/Abschlussaufträge ergaben keinen neuen verifizierbaren Handoff; das Replit-Arbeitspaket wurde ohne Freigabe beendet. **Kein Replit-Quellcode und keine Testausnahme werden in die Produktionsänderung übernommen.**

Die numerische Legende wurde deshalb eigenständig in der vertrauenswürdigen Codex-Integration als `ModelMapScaleLegend.tsx`/`modelMapScaleLegend.css` fertiggestellt: zentraler App-Theme-Vertrag, mindestens 44-px-Skalenbuttons, drei formatierte Werte, sichtbar erklärte relative/feste Skala, deaktivierter Wertebereich bei konstanten Feldern sowie feste Animation. Der unveränderte Reachability-Test und das vollständige reguläre Source-Gate bleiben zwingend. Der nicht freigegebene Replit-Entwurf bleibt in seinem unprivilegierten Branch; keine Promotion/Veröffentlichung über Replit.

Lokale Abschlussprüfung: `npm run verify` (Build, Types, Worker-Syntax und 899/899 Pflichtregressionen) erfolgreich; Dependency-Audit ohne HIGH/CRITICAL-Befunde. Echte Browsermatrix: fünf Größen × Temperatur, einstündiger Niederschlag, Wind, Böen, prognostizierte Summen, beobachtete Summen sowie produktive Navigation, jeweils Hell/Dunkel. Wind/Böen zusätzlich mit allen vier Live-Einheiten; SVG-Werte/Einheiten, PNG-Downloads, beide Skalenmodi, Animation und Clipping geprüft. Main-JS ca. 1.493 MB unter 1.500 MB, Main-CSS 1,759,941 unter 1,760,000 Bytes; neue Legenden-CSS ausschließlich im lazy Kartenchunk. Vollständige Source-/Installer-Gates und tatsächliche Stable-/Live-Verifikation bleiben Voraussetzung für eine Veröffentlichungsaussage.
