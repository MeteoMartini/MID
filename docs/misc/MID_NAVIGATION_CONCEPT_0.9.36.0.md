# MID Navigationskonzept ab v0.9.36.0

## Ziel
MID behält das Dashboard als zentrale, datenreiche Startseite. Die vielen Sektionen werden nicht in voneinander getrennte Seiten zerlegt, sondern über eine zusätzliche Navigation schnell erreichbar. Dadurch bleiben Favorit, geladene Wetterdaten, Diagrammzustände und Scroll-/Interaktionskontext erhalten.

## Empfohlene Lösung: Sektionen-Menü + Dashboard

### 1. Globales Sektionen-Menü
- Mobile: seitlich einfahrender Drawer über ein kompaktes Menüsymbol im Kopfbereich.
- Desktop/Tablet: schmale Navigationsleiste bzw. ausklappbarer Drawer.
- Ein Klick springt zur vorhandenen Dashboard-Sektion und öffnet sie bei Bedarf.
- Kein Reload und kein unnötiges Neuabfragen von Wetterdaten.

### 2. Fachliche Gruppen
**Überblick**
- Aktuelles Wetter
- Warnungen und Gefahren
- Kurzfrist
- 7 Tage

**Analyse & Trend**
- Kompositbild
- 14-Tage-Ensemble
- Langfrist

**Profile**
- Berg- und Wintersport
- Wassersport
- Reisewetter

**Profi**
- Prognosegüte/Rückblick
- Flugmeteorologie
- Wetterkarten

**Werkzeuge**
- Widget-/PNG-Generator

### 3. Bestehende Modulverwaltung weiterverwenden
Die bestehende Einstellung „Dashboard → Sektionen und Reihenfolge“ bleibt die zentrale Quelle für Reihenfolge und Sichtbarkeit. Das Seitenmenü spiegelt exakt diese Konfiguration, statt eine zweite unabhängige Ordnung einzuführen.

### 4. Navigation ohne Funktionsverlust
- Navigation per Abschnittsanker/Hash (`#current`, `#ensemble`, `#long-range` usw.).
- Browser-Zurück kann zum vorherigen Abschnitt zurückführen.
- Favoritenwechsel bleibt global und verändert nicht die gewählte Sektion unnötig.
- Eingeklappte Bereiche werden beim gezielten Anspringen automatisch geöffnet.
- Scrollposition pro Sektion kann optional gespeichert werden.

### 5. Mobile Schnellnavigation
Zusätzlich zum Drawer maximal vier dauerhaft sichtbare Schnellziele:
- Heute
- Kurzfrist
- 7 Tage
- Mehr

„Mehr“ öffnet das vollständige Sektionen-Menü. Dadurch bleibt die mobile Oberfläche ruhig, ohne wichtige Analysebereiche zu verstecken.

### 6. Kontextabhängige Module
Berg-/Wintersport und Wassersport erscheinen im Menü nur, wenn das jeweilige Favoritenprofil aktiv ist. Erweiterte Profiwerkzeuge folgen weiterhin dem Standard-/Erweitert-Modus.

## Umsetzungsempfehlung
1. Phase 1: Drawer als reine Anchor-Navigation auf die vorhandenen Module.
2. Phase 2: Hash-/Back-Navigation, Auto-Expand und mobile Schnellnavigation.
3. Phase 3 optional: „Fokusansicht“, die nur eine gewählte Sektion groß zeigt, während das Dashboard unverändert als Standard erhalten bleibt.

Diese Architektur nutzt die bereits vorhandene MID-Modulverwaltung und benötigt keine zweite Seiten-/Datenarchitektur.
## Umsetzungsstatus v0.9.36.1
Die Phasen 1 und 2 sind umgesetzt: Drawer/Seitenleiste, Hash-/Back-Navigation, Auto-Expand, Cockpit-Horizontsprung und mobile Schnellnavigation sind produktiv integriert. Phase 3 „Fokusansicht“ bleibt bewusst optional und ist noch nicht Bestandteil der Standardnavigation.

