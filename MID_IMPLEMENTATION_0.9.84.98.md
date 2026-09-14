# MID v0.9.84.98 – Implementierungsstand

## Basis

- Arbeitsbasis: v0.9.84.97 aus dem vom Nutzer bereitgestellten `MID-professional-replacement.zip`.
- GitHub Actions Installer #1052 hat exakt diesen v0.9.84.97-Ausgangsstand vollständig erfolgreich gebaut, getestet, veröffentlicht und per Fast-Forward nach `mid-stable` promoviert.
- Die in #1052 installierte ZIP hatte SHA-256 `b95d7c2d2f2c3039255120f5a363cf7b09df16258b6ee48117fb07037a994deb` und entspricht bytegenau dem für v0.9.84.98 verwendeten Ausgangsarchiv.
- Kanonischer Stable-Ausgangscommit: `c03d0a059c3116cc81ad547eb2d37fe3aea1b134` (`Install MID v0.9.84.97`).
- Release-Ziel: v0.9.84.98.

## I. Kurzfrist wieder zusammengeführt

Die moderne Prognoseleiste hatte 90 Minuten und 24 Stunden in zwei separate Tabs aufgeteilt, obwohl beide inhaltlich zum selben Kurzfrist-Arbeitsbereich gehören. Das wurde zurückgeführt auf:

- **Kurzfrist** (90-Minuten-Übersicht + 24-h-Wetterprofil gemeinsam),
- **7 T**,
- **14 T**,
- **46 T**,
- **Saison**.

Der Kurzfrist-Inhalt selbst wird nicht reduziert: `ShortTermRibbon` enthält weiterhin sowohl „Nächste 90 Minuten“ als auch das „24-h-Wetterprofil“. Die Navigation erzwingt nur nicht mehr per zweitem Tab ein Scrollen direkt zum 24-h-Teil. Persistierte ältere `24h`-Auswahlen werden beim Einlesen auf den gemeinsamen Kurzfrist-Horizont migriert.

## II. MID · PLANEN fertig gestaltet

Die Ursache des im Desktop-Screenshot sichtbaren Rohbau-Eindrucks war ein CSS-Cascade-/Breakpoint-Fehler: Die vollständigen Karten-/Buttonstile des Planen-Hubs lagen im Kern nur im `max-width:850px`-Block, während Desktop später lediglich `display:grid`, Spaltenzahl und Höhe aktivierte. Dadurch erschienen auf Desktop weitgehend Browser-Standardbuttons.

Korrigiert wurden:

- gemeinsame Basisstile für Planen-Hub und Aktionskarten auf allen Viewports,
- klare Iconflächen, typografische Hierarchie, Abstände, Hover/Focus und Setup-Zustände,
- der doppelte separate „Planer“-Kopf wird im modernen Arbeitsbereich auf allen Viewports ausgeblendet,
- die eigentlichen Event-/Reiseplaner bleiben als konsistente `module-shell` direkt unter dem Hub erreichbar.

## III. Weitere Rohbau-Reste

Beim gleichen statischen Audit wurde derselbe Fehler im `modern-more-quick-actions`-Block gefunden: Dessen vollständiges Kartenlayout war ebenfalls im Wesentlichen auf mobile Media-Queries begrenzt. Die Schnellzugriffe im „Mehr“-Drawer besitzen nun auch auf Desktop/Tablet die gemeinsame Karten- und Typografielogik.

Andere `modern-*`-Arbeitsbereiche wurden geprüft. `modern-forecast-section`, `modern-map-focus-shell` und `forecast-cockpit.modern-workspace` besitzen bereits viewportübergreifende Basisverträge und zeigten diesen Rohbau-Cascade-Fehler nicht.

## Responsive Simulation

Ein Playwright/Chromium-Fixture mit dem realen aggregierten MID-CSS wurde für 390×844, 820×1180 und 1440×1000 gerendert. Ergebnis:

- kein Dokument-Horizontalüberlauf,
- kein Horizontalüberlauf der fünf Horizont-Tabs,
- Planen-Aktionsraster 1 / 2 / 4 Spalten auf iPhone / iPad / Desktop,
- redundanter Planer-Kopf auf allen drei Größen verborgen,
- Beschriftungen bleiben innerhalb der Karten und dürfen mehrzeilig umbrechen.

## Worker

Keine Worker-Fachlogik geändert; kein separater manueller Worker-Upload erforderlich.
