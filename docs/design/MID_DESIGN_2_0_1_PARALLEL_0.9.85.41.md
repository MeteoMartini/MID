# MID Design 2.0.1 · parallele Oberfläche · v0.9.85.41

Basis: `main = mid-stable = 8aae65bda29bcc413cbbc5af1b2a86ce3c98fcb0`, v0.9.85.40.

## Ziel

Die neue grafische Umsetzung wird nicht als zweite Wetteranwendung aufgebaut. Klassisch und Design 2.0.1 teilen Ort, Favoriten, reale MID-Daten, Modellfusion, Warnlogik, Radar/Nowcast und sämtliche fachlichen Verträge. Getrennt werden nur Navigation, Komposition und Styles.

## In diesem Schritt umgesetzt

1. **Echte parallele Navigation**
   - `Klassisch` nutzt wieder die bestehende Sektionen-/Dashboard-Navigation.
   - `Design 2.0.1` nutzt die neue Bottom-Tab-/Arbeitsflächen-Navigation.
   - Der aktive Designmodus wird weiterhin persistent in `mid:designMode:v1` gespeichert.

2. **Sicherer Standard**
   - Ohne explizit gespeicherte Auswahl startet MID vorerst in `Klassisch`.
   - Bestehende Nutzerwahl `mid-next` bleibt erhalten.

3. **Forecast-Komposition getrennt**
   - Das neue Prognose-Cockpit wird nicht mehr allein durch die fest verdrahtete Bottom-Navigation in die klassische Oberfläche gezogen.
   - Die klassische Oberfläche behält ihre bisherige Modulfolge; Design 2.0.1 verwendet die neue Arbeitsraum-Komposition.

4. **CSS-Isolation**
   - Die bislang noch ungekapselten Regeln in den Redesign-Dateien wurden auf `html[data-mid-design='next']` begrenzt.
   - Dadurch wirken spätere Redesignkorrekturen nicht mehr unbeabsichtigt auf Klassisch.
   - Betroffen sind insbesondere gemeinsame Instrumentflächen, sichtbares C8-Redesign, Kartenarbeitsfläche/Viewport-Fixes, Heute-Dichte, Responsive-Politur und Workspace-Politur.

5. **Benennung**
   - Die Auswahl in Einstellungen → Ansicht & Einheiten heißt sichtbar `Design 2.0.1` und `Klassisch`.
   - Der Text stellt klar, dass beide Darstellungen dieselben Wetterdaten und Fachfunktionen verwenden.

## Unverändert

- stündliche Skybar-Auflösung und bestehende Skybar-Fachlogik
- Wettermodelle, RUC/Nowcast, Radar, Warnungen und Schwellen
- Favoriten-/Ortsdaten und Persistenz
- MID-Parameterfarben und Datenquellen
- Light/Dark und Original-MID-Logoset
- Standard-/Erweitert-Modus als fachliche Informationsdichte

## Regression

`scripts/test-design-2-0-1-dual-ui-098541.mjs` prüft:

- getrennte Navigationsmodi für Klassisch und Design 2.0.1,
- Klassisch als sicheren Initialzustand ohne explizite Auswahl,
- neues Forecast-Cockpit ausschließlich im neuen Designpfad,
- eindeutige Bezeichnung im Einstellungsdialog,
- vollständige Design-Scope-Kapselung der betroffenen Redesign-CSS-Dateien.

## Nächste Übernahmereihenfolge

1. Aktuell / Kopf / Favoriten
2. Heute / 24-h-Profil
3. 7-/14-Tage-Prognose
4. Warnungen
5. Radar / Karten
6. Analyse / Ensemble
7. übrige Fachmodule und finaler Gerätematrix-Abgleich

Jeder Schritt bleibt über den Source-PR-Gate-/Installer-/Stable-Promotion-Pfad getrennt rückrollbar.
