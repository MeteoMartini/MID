# MID v0.9.84.11 – Skybar: Wolkenpriorität und sonnige Schauer

## Extern

- Die Skybar verwendet **Gesamtbewölkung als primäre Himmelsgröße**. Bei bekannter Gesamtbewölkung kann eine hohe Sonnenscheindauer den Himmelszustand nicht mehr überstimmen; 69 % Gesamtbewölkung werden daher grau und nicht maximal gelb dargestellt.
- Unter 50 % Gesamtbewölkung wird tagsüber ein gelbes Grundband aus dem komplementären Aufklarungsanteil abgeleitet. Die WMO-Sonnenscheindauer bleibt fachlich ein eigener Parameter und dient in der Skybar nur als Fallback, wenn Gesamtbewölkung fehlt.
- **Schauer bei Sonne bleiben ausdrücklich möglich:** Niederschlag wird als eigene farbreine Lage zentriert über dem gelben Grundband gezeichnet. Ist der Niederschlagsstreifen dünner, bleibt Gelb ober- und unterhalb sichtbar; ist er gleich dick oder dicker, verdeckt der Niederschlagsstreifen das Grundband vollständig.
- Niederschlagsdicken verwenden die zeitnormalisierte Intensität. Für Regen gelten die DWD-Grenzen leicht bis 0,5 mm/h, mäßig über 0,5 bis 4 mm/h und stark über 4 mm/h. Für die vierte MID-Dickenstufe wird die starke Klasse rein darstellerisch ab 15 mm/h weiter unterteilt.

## Intern

- `src/detailSkyBar.ts` bleibt die zentrale Engine für 24-h-Tagesansicht, 24-h-Profil, 7-Tage-Kurvenübersicht/Widget und Tageskarten.
- Grundband und Niederschlagslage bleiben getrennte SVG-Layer; `baseSegments` werden vor `precipSegments` ausgegeben, beide verwenden dieselbe Mittellinie und dieselben vier Strichdicken `2.4 / 3.6 / 4.8 / 6.0`.
- Der frühere Vorrang direkter Sonnenscheindauer vor Gesamtbewölkung wurde aufgehoben. Fehlende Gesamtbewölkung bleibt fehlend und wird nicht als 0 % interpretiert.
- Die bestehenden Skybar-Verträge/Regressionen wurden auf die neue Priorität aktualisiert; zusätzlich schützt `scripts/test-skybar-shower-overlay-cloud-priority-098411.mjs` den 69-%-Fall, Schauer-Overlays, DWD-Intensitätsgrenzen und die appweite zentrale Einbindung.
- Keine fachliche Workeränderung.
