# MID v0.9.80.7 – Konsolidierung paralleler Änderungen

Stand: 7. September 2026

## Extern

- Führt die parallel entstandenen Änderungen aus den zuletzt gleich bezeichneten v0.9.80.6-Ständen in einem eindeutigen Release zusammen.
- Bewahrt die gemeinsame, gepufferte Radar-/Satelliten-Wiedergabe mit echten Produktzeiten, weichen Übergängen und wählbarer Geschwindigkeit.
- Bewahrt die direkte Synoptik-Linienwahl und geglättete 500-hPa-Isohypsen.
- Bewahrt die korrigierte 24-h-Zeitgeometrie, geglättete Niederschlagswahrscheinlichkeit, Klima-Lesbarkeit und Widget-Ausrichtung.
- Die vollständigen Light-/Dark-Logo-Sets bleiben integriert.

## Intern

- Der Zielbuild v0.9.80.6 enthielt die Fachimplementierungen beider parallelen Linien bereits; konsolidiert wurden Versionsführung, Changelog und Release-Nachweis.
- Es wurden keine meteorologischen Daten, Parameter, Schwellen oder Darstellungsinformationen entfernt.
- Bestehende Regressionen schützen Klima, 24-h-Profil, Komposit-Zeitwahrheit, gepufferte Wiedergabe, Synoptik-Konturen, UI-System und Widget.

## Worker

Keine funktionale Workeränderung. Ein Cloudflare-Worker-Upload ist nicht erforderlich.
