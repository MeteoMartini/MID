# MID 18.2.35 · Skybar-Intervallgrenzen zu astronomischen Sonnenereignissen

## Gültige Basis und Abgrenzung

Entwicklung auf freigegebener v0.9.85.277 / `6754d25358c809966a3e1d026c88f500a1699d69`. `MID_24H_PROFILE_STORY_AXIS_CONTRACT.md` und Issue #374 gelten weiter. Die bisherige Korrektur .268 war erforderlich, aber gelbe/graue Grundbänder benutzten noch den Tagesstatus ganzer Stunden-/Viertelstunden-Slots; die Nacht-Hintergrundgeometrie benutzte bereits genaue Sonnenepochen. Daraus konnte unmittelbar am Sonnenereignis eine zeitliche Inkonsistenz entstehen.

## Semantik

1. Sonnenaufgang und Sonnenuntergang stammen aus `solarTimelineWindow` mit absoluter UTC-Epoche und Ortszeitzonen-/Standortauswertung durch die bestehende `astronomy-engine`-Basis. Die Darstellung verwendet nicht `Date.getHours()` und erfindet keine Zeiten.
2. Nur das gelbe/graue Skybar-Grundband wird am **echten** Ereignis innerhalb eines bereits vorhandenen Datenintervalls geometrisch geteilt. Für graue Wolken bleibt dieselbe bekannte Gesamtbewölkung maßgeblich. Für gelbe Wolkenlücken bleibt das Produkt klar als Himmelslücke und *nicht* als Messung von direkter Sonnenscheindauer bezeichnet.
3. Der tatsächliche direkt übergebene Sunshine-Anteil wird weiterhin auf die vollständige Akkumulationsdauer bezogen, nicht rückwirkend in eine fiktive Sonnenscheinmessung während des Tagesanteils umgerechnet. Damit gilt der unveränderte 50-%-Sonnenschein-Schwellenvertrag plus bisheriger Wolkenlücken-Fallback.
4. Niederschlagsmenge, Niederschlagsfarbe/-phase, WMO-Code, Intervall und Overlay werden aus dem existierenden gemeinsamen Renderer unverändert übernommen. Die momentane Bewölkung wird auf `hour.epoch` verankert, nicht unbemerkt auf die Niederschlagsintervall-Start-/Endsemantik umgestellt.
5. Bei fehlenden Zeitstempeln kann nicht sicher geteilt werden: Originaldarstellung bewahren und den NoData-/Unsicherheitsvertrag respektieren. Keine vorgetäuschte Zeitauflösung unterhalb des Modell-/Nowcast-Slots.
6. Nacht durch echte Nachtbänder ermittelt; Polartag/Polarnacht und 23-/25-h-Tage erfolgen auf UTC-Epochen. Die diskreten Stundenquadrate bleiben bewusst komplette Slots; sie behaupten keine minutengenaue Wetterbeobachtung.

## Abnahmematrix und offene Nachweise

Neuer synthetischer Regressionstest: Sonnenaufgang in Stundenmitte, Sonnenuntergang nach 15 Minuten, hohe Wolkenbedeckung tags/nachts, Niederschlags-Overlay identisch, fehlende Wetter-/Zeitdaten, Polarnacht und beide deutschen DST-Umstellungen. Frühere Schwellen-, Niederschlags- und Gerätevertragsprüfungen müssen weiterhin bestehen. Browser-/Light-/Dark-/Widget-/PNG-/Export-/Tablet-/Touch-/Accessibility-Regressionen laufen über die unveränderten Source-/Heavy-/Installer-Gates. Physisches iOS/WKWebView/VoiceOver bedarf weiterhin gesonderter Geräte-Evidenz; kein CI-Ersatz.

## Regressionstest-Signaturen nach v0.9.85.278

Die fünf bestehenden Source-Token-Regressionen `test-cloud-profile-structures-09740`, `test-design-2-0-1-today-098543`, `test-skybar-quarter-consistency-0985152`, `test-weather-profile-rolling-openmeteo-audit-09653` und `test-weather-profile-story-axis-09750` hatten den seit .278 absichtlich ersetzten `profileSkyBarSegments=detailSkyBarSegments(...)`-Aufruf wörtlich festgeschrieben. Diese Source-Anker wurden an `detailSkyBarSolarSegments(...,solarWindow.nightBands)` angepasst und prüfen weiterhin die identische kanonische Stundenpositionsreihe, separat unveränderte Niederschlagsintervalle, Profilelemente und weitere Fach-/Responsive-Kontrakte. Der eigenständige dynamische Solar-Epoch-Test prüft Sunrise/Sunset, Missing, Polar/DST, Niederschlagsidentität und schmale Nachtlücken. Es wurde kein Test aus der Baseline entfernt oder übersprungen.
