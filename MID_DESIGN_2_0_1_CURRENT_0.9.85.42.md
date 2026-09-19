# MID Design 2.0.1 · Aktuell/Kopf/Favoriten · v0.9.85.42

Basis: `main = mid-stable = 474017a4392a760c24d85f757aac437cae7f2d2c`, v0.9.85.41.

## Ziel

Schritt 2 der parallelen Design-2.0.1-Übernahme: Kopf, Favoriten und aktuelle Wetterlage werden im neuen Designpfad neu komponiert. Klassisch bleibt unverändert. Meteorologische Logik und Datenquellen werden nicht dupliziert.

## Umgesetzt

1. **MID-Branding**
   - Desktop/Tablet: originales horizontales MID-Logo.
   - Smartphone: originales Compact-Logo.
   - Light/Dark-Auflösung bleibt über den bestehenden Brandingvertrag erhalten.

2. **Kopf und Suche**
   - Kompakter Instrumentenkopf mit Suchfeld, Standort, Aktionen und Favoriten in einer gemeinsamen Fläche.
   - Favoriten bleiben horizontal bedienbar, aktiv markiert und verwaltbar.
   - Touchziele, Safe-Area-Abstände und Querformat bleiben erhalten.

3. **Aktuelles Wetter**
   - Wetterzeichen, Temperatur und Wetterzustand bilden die Hauptaussage.
   - Vier Kernwerte bleiben unmittelbar sichtbar: Niederschlag, Wind/Böen, Feuchte/Taupunkt und Luftdruck.
   - Niederschlags-/Gefahrenlage und Quellenstatus bleiben Bestandteil derselben Arbeitsfläche.
   - Sekundärwerte werden unterhalb als ruhige Instrumentfläche gezeigt.

4. **12-h-Wetterfaden**
   - Verwendet ausschließlich die vorhandenen kanonischen stündlichen MID-Temperaturwerte.
   - Keine Interpolation, kein neues Modell und keine Änderung der Prognosewerte.
   - Dient nur als grafischer Verlauf im Design-2.0.1-Pfad.

5. **Responsive Komposition**
   - Smartphone: Wetterzeichen + Hauptaussage zuerst, Faden und Kernwerte darunter.
   - Tablet hoch: Hauptaussage + Faden oben, vier Kernwerte in gemeinsamer Zeile.
   - Tablet quer/Desktop: Wetterzeichen, Hauptaussage, Faden und Kernwerte parallel.
   - Schmale Geräte bis 390 px erhalten nochmals reduzierte Steuerflächen.

6. **Typografie**
   - Keine extremen negativen Laufweiten.
   - Große Wetterwerte maximal leicht negativ gesetzt; Überschriften/Ortsnamen bleiben lesbar.

## Fachlich unverändert

- stündliche Skybar-Zeitauflösung
- RUC/Nowcast und hyperlokale Korrekturen
- Warnschwellen und Warnlogik
- Wetterpiktogrammvertrag
- Parameterfarben
- Favoriten-/Ortspersistenz
- Klassische Oberfläche

## Regression

`scripts/test-design-2-0-1-current-098542.mjs` schützt:

- Original-MID-Logo je Gerätebreite,
- realen 12-h-Stundenfaden,
- responsive Aktuell-Komposition,
- lesbare Laufweiten,
- vollständige CSS-Kapselung auf `data-mid-design='next'`,
- unveränderte klassische Oberfläche.

## Nächster Schritt

v0.9.85.43: Heute / vollständiges 24-h-Wetterprofil im Design-2.0.1-Pfad, weiterhin mit gemeinsamer stündlicher Zeitachse und unverändert stündlicher Skybar.
