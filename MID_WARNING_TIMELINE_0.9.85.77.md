# MID v0.9.85.77 · Warnungs-Timeline

## Ziel
Die Warnübersicht wird zu einer ruhigen, chronologischen Ereignisspur. Amtliche Warnungen stehen fachlich und visuell zuerst; MID-Prognosehinweise bleiben klar davon getrennt.

## Sichtbare Änderungen
- Die Warnansicht beginnt mit einer vertikalen Ereignis-Timeline und einer eindeutigen „JETZT“-Marke.
- Amtliche Warnungen werden nach Beginn sortiert; abgelaufene Ereignisse werden nicht mehr als aktive Warnlage geführt.
- Die Warnstufe wird ausschließlich über den farbigen Marker signalisiert. Die Karte selbst bleibt neutral.
- MID-Prognosehinweise verwenden einen neutralen MID-Marker und erscheinen nicht als amtliche Warnstufe.
- Beginn, Ende, Geltungsbereich und – sofern die amtliche Quelle einen Wert liefert – die Eintrittswahrscheinlichkeit werden direkt am Ereignis dargestellt.
- Ein Ausfall der amtlichen Quelle wird ausdrücklich als „Warnstatus nicht bestimmbar“ angezeigt und niemals als Entwarnung.
- Der Warnstatus im Ortskopf führt weiterhin mit einem Tap direkt zur Warnübersicht; der Extremwetter-Ausblick bleibt dort direkt erreichbar.

## Daten- und Quellenvertrag
Für Deutschland bleiben DWD WFS und DWD CAP die kanonischen amtlichen Quellen. Außerhalb Deutschlands gelten die bereits etablierten nationalen/MeteoAlarm-/NWS-Pfade. Es werden keine Wahrscheinlichkeiten berechnet oder erfunden; MID zeigt sie nur, wenn die amtliche Meldung ein entsprechendes Feld tatsächlich liefert.

## Responsive Vertrag
Die Ereignisspur ist auf schmalen und breiten Smartphones, Tablet hoch/quer sowie Desktop ohne horizontalen Seitenoverflow ausgelegt. Light/Dark nutzen dieselben MID-Tokens. Die mobile Bottom-Bar erhält weiterhin ihren reservierten Sicherheitsabstand.

## Release
Source-PR-Gate → Auto-Merge → Release-ZIP → Installer → Pages/Worker-Gate → Stable-Promotion.
