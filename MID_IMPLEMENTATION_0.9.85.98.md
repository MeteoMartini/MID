# MID 0.9.85.98 · MID 18.2.10 · 90‑Minuten-Skybar-Nachtkennzeichnung

## Anlass
Die Skybar in „Aktuell“ kennzeichnet Nachtstunden bereits dezent und zeitlich exakt. In der 90‑Minuten‑Vorhersage unter „Heute / Ab jetzt“ fehlte diese visuelle Orientierung noch.

## Umsetzung
- Die 90‑Minuten‑Skybar verwendet dieselbe zentrale Solar-Geometrie wie „Aktuell“ und das 24‑h‑Profil.
- Beginn und Ende der Nachtfläche werden aus den realen 15‑Minuten-Prognoseintervallen abgeleitet.
- Nachtbereiche liegen hinter Skybar-/Quadratsegmenten und verändern keine meteorologischen Farben oder Prioritäten.
- Sonnenaufgang und Sonnenuntergang erhalten denselben weichen Übergang wie in „Aktuell“.
- Vollständig nächtliche sowie teilweise nächtliche 90‑Minuten‑Fenster werden unterstützt.
- Die Änderung funktioniert sowohl für Skybar als auch für die alternative Quadratdarstellung.

## Prüfung
Die Regression `scripts/test-mid-18-2-10-now90-night-098598.mjs` schützt Solarquelle, Fade, MID-Nachtfarbe, Layer-Reihenfolge und Releasevertrag. Die vollständige Geräte-/Buildprüfung erfolgt zusätzlich im Source-PR-Gate und Installer.
