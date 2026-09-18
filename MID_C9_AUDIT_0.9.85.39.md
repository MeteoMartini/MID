# MID-C9 · Screenshotkorrektur und offene Designarbeit · v0.9.85.39

Basis: main = mid-stable = 95d6d0c74cb05cf29975feeaab711c417d6733d1, v0.9.85.38. Beim Start keine offene parallele Agent-PR. Referenzen: die drei Nutzeraufnahmen IMG_1850–1852, die bereits abgeglichenen Konzeptbilder „Aktuelles Wetter“ und „Moderne UI-Konzeptübersicht“, UI-Architekturvertrag und vollständiger Modulkatalog in dashboardModules.ts.

## Konkrete Fehler und Korrektur

1. **Aktuell:** Eine alte mobile Regel belegt mit jedem Wert zwei Spalten. Spätere Zweispaltenraster allein setzen diese Kindbelegung nicht zurück. Jetzt explizit normale Zellbelegung für alle vier sichtbaren Kernparameter; Sicht bleibt in den Details. Wetterkopf kompakter, Niederschlagsinformation nutzt die verfügbare Breite. Die Safe-Area-Reserve bleibt am Seitenende, die doppelte Reserve vor dem Footer entfällt.
2. **Kurzfrist:** Sieben reale Zeitpunkte treffen auf die in v38 eingeführten sechs expliziten Spalten. Jetzt automatische Spalten mit horizontaler Flussrichtung, unabhängig von der Anzahl. Wetterwerte, Auswahl und Zeitschritte werden nicht gekürzt.
3. **Favoriten:** Alte benannte Grid-Bereiche kollidieren mit Griff, Stern, Name und Badge; ein generiertes „Std.“ erscheint zusätzlich zum wieder sichtbar gemachten „Standard“. Jetzt intrinsische Flexzeile, einmalige Kennzeichnung, separat erreichbare Verwaltung, mindestens 44 px hohe Schaltflächen. Favoritenzustand, Drag-Reihenfolge und Auswahl bleiben unverändert.
4. **Aktive Kurzfrist-Auswahl:** Expliziter Textkontrast auf der hellen Auswahlfläche.

## Appweiter Abgleich / nächste Schritte

Die folgende Matrix ist ein Quellstand-/Konzeptabgleich, keine behauptete visuelle Abnahme sämtlicher Ansichten. Reihenfolge: P1 zuerst, P2 anschließend. Fachfunktionen bleiben erhalten.

| Ansicht | Bestehender Stand | Noch ausstehend / Abnahmekriterium |
|---|---|---|
| Aktuell | Wetterbühne, vier Kernwerte, Zusatzdetails; Screenshotfehler hier korrigiert | P1: reale iPhone-/iPad-Abnahme mit langen Ortsnamen, Standard/Erweitert, großer Schrift und Warnlage |
| Favoriten/Kopf | Horizontale Auswahl und Verwaltung; Überlagerung korrigiert | P1: mehrere lange Namen, Standard-/Berg-/Wasserprofile, Ziehen und aktive Auswahl beim Drehen prüfen |
| Heute/Kurzfrist | Durchgehender Zeitverlauf, eingeklapptes DWD-Produkt, 24-h-Profil | P1: Touchauswahl, sieben Zeitpunkte, Achsengleichlauf und Tooltips in Hoch-/Querformat visuell abnehmen |
| DWD Wolken/Niederschlagsart | Originalbild, Zoom und Ansichtssteuerung aus v38 | P1: absolute Georeferenz an unabhängigen Kartenankern nachweisen; weiterhin ausdrücklich offen |
| 7 Tage | Gemeinsame Instrumentfläche, Tagesband und Stundenprofil | P1: Tagesköpfe/Achsen bei 320 px, iPad Split View und Desktop; vollständige Tooltipwerte |
| 14 Tage/Ensemble | Zentrale Daten-/Farbverträge, gemeinsame Prognosehülle | P1: Kurven-/Legendengewicht, mehrere Parameter und Touchtooltips vergleichend prüfen |
| 46 Tage/Saison | Fachmodule vorhanden, über Zeithorizonte erreichbar | P2: innere Ergebnisflächen und Modellmetadaten stärker an ruhiges Instrumentkonzept angleichen |
| Karten/Komposit | C14-Kartenarbeitsfläche und Timeline | P1: Layer-/Legendenüberlagerung, geringe Querformathöhe und Beobachtung→Prognose-Übergang praktisch prüfen |
| Warnungen/Gefahren | Amtliche Lage und automatische Hinweise fachlich getrennt | P1: nur relevante Ereignisse priorisieren; lange aktive Warntexte und Quellenausfall visuell prüfen |
| Extremwetter | Eigenständige probabilistische Karte vorhanden | P1: Legende, Zeitraum und Tooltip auf kleinen Displays; keine semantische Vereinfachung |
| Mehr/Navigation | Listen statt gleichgewichtiger Schnellzugriffskacheln, zentraler Drawer | P2: Fachmodule gruppieren und Einstiegsdichte mit Gesamtkonzept abgleichen |
| Eventplaner/Reiseplaner | Gemeinsamer Planereinstieg, bestehende Detailformulare | P2: Formular-/Ergebnishierarchie innerhalb der Module vereinheitlichen |
| Berg-/Wintersport/Wassersport | Profilabhängige Fachflächen | P2: Höhen-/Pegel-/Tideninformation als zusammenhängende Fachfläche gestalten |
| Klima | Monatsauswahl, Klimadiagramm und Windrose vorhanden | P2: Steuerung, Legende und Diagrammflächen auf Tablet/Telefon abstimmen |
| Lüftungsassistent | Eigenständige Sensor-/Empfehlungsansicht | P2: kompakte Zusammenfassung, Details progressiv öffnen |
| Prognosegüte/Rückblick | Technische Kontrollansicht vorhanden | P2: Parameterwahl, Diagramme und Quellenstatus vereinheitlichen |
| Flugmeteorologie/Wetterkarten | Fachwerkzeuge mit eigenen Bedienflächen | P2: gleiche Kopf-, Filter-, Quellen- und Vollbildmuster, mobile Legenden prüfen |
| Widget/PNG-Generator | Bestehende Exportansicht und Parameterfarben | P2: Generatorbedienung harmonisieren; Exportmaße und Farbinhalte unverändert prüfen |
| Einstellungen/Impressum/Quellen | Gemeinsame Dialog-/Portalverträge | P1: Tastatur, Safe Areas, große Schrift und Schließen in flachem Querformat prüfen |

## Prüfung und Grenzen

- Produktionsbuild/TypeScript erfolgreich.
- Produktions-CSS mit realer Kaskade/Selektorspezifität an zwölf Referenzformaten geprüft: 320×568 bis 1920×1080, einschließlich Telefon-/Tablet-Querformat. Vier normale Zellen, ausgeblendete Sichtzelle, horizontale automatische Timeline-Spalten, Flexfavoriten und einmaliger Standard-Badge bestätigt. Reproduzierbar mit tools/qa/check_c9_mobile_css.py (tinycss2, cssselect2; nach Build).
- Diese Prüfung berechnet Regelauflösung; sie ist kein Layout-Rendering und kein Ersatz für die oben genannten Geräte-/Touchprüfungen.
- v38 im Live-Browser reproduziert; Nutzer-Screenshots zeigen den Mobilzustand. Die neue Version wird über den bestehenden Source-PR-/Installerweg veröffentlicht, nicht durch direkte Stable-Manipulation.
- Fachliche Wetterdaten, Modellfusion, Warnschwellen, Farblogik und DWD-Geokalibrierung unverändert.
