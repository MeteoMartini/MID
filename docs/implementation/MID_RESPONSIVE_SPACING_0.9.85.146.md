# MID 18.2.23 · v0.9.85.146 — Responsive Astronomie- und Bergwetter-Abstände

## Ausgangsbasis

- Verifizierte Basis: `mid-stable` / `main` auf SHA `d759038140c0b60b333efff02e977acba92012f9`.
- Replit wurde geprüft, lag jedoch noch auf v0.9.85.144 und wurde deshalb nicht als Codebasis verwendet oder zurückgemischt.

## Änderungen

- Sonne/Mond: längere Ereignislabels werden nicht mehr innerhalb des Wortes umgebrochen; die rechte Ereignisspalte erhält geringfügig mehr Platz und die Typografie skaliert auf sehr schmalen Ansichten leicht mit.
- Bergwetter-Stundenraster: die starre Mindestbreite von 1180 px wurde entfernt. Die Tabelle nimmt nur noch die tatsächlich benötigte Inhaltsbreite ein; Beschriftungs- und Stunden-Spalten besitzen definierte kompakte Breiten.
- Mobil bis 620 px werden die Beschriftungs- und Stunden-Spalten zusätzlich moderat verdichtet. Der horizontale Scrollcontainer bleibt unverändert bestehen, sobald die tatsächliche Tabellenbreite den Viewport überschreitet.

## Regressionen

- Der bestehende Sonne-/Mond-Vertrag schützt den Einzeilenmodus für die Ereignislabels.
- Der bestehende Bergwetter-Redesign-Vertrag schützt adaptive Tabellenbreite, kompakte Spalten und verbietet die alte pauschale 1180-px-Mindestbreite.
- Der Style-Aggregatvertrag bleibt erhalten; `src/styles.css` entspricht weiterhin exakt den kanonischen `styles-src`-Fragmenten.
