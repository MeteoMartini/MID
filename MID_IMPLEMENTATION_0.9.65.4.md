# MID 0.9.65.4 – Compact-Kopf und responsive Warnkarte

## Ergebnis

Der obere Bereich der aktuellen Ortsansicht folgt nun der freigegebenen Variante „Compact“. Aktuelles Wetter, Tagesminimum/-maximum, Niederschlagswahrscheinlichkeit, Radarstatus und Datenbasis bilden eine gemeinsame responsive Karte. Der bisher schwebende „mehr/weniger“-Schalter ist in die Quellenzeile integriert.

## Lokale Gefahrenkarten

- Gewitter-, Starker-Schauer- und Konvektionsinformationen verwenden kompakte Aufklapper. Status, betroffene Orte, Zugbahn, Schnellfakten, Beratung, technische KONRAD3D-Details und Quellen bleiben erreichbar.
- Starkregen- und Sturzflutindikatoren verwenden denselben Disclosure-Vertrag. Zusammenfassung, Sturzflutpotenzial, Detailpunkte und Quelle bleiben vollständig erhalten.
- Die Karten bleiben ausdrücklich von amtlichen Warnungen getrennt. Die bereits vorhandene fachliche Regel „Gewitter“ erst ab mindestens einem detektierten Blitz bleibt unverändert geschützt.

## Responsive Warnkarte

- Automatische Best-Match-Hinweise werden in einer gemeinsamen Karte nach Tagen gruppiert.
- Jedes Zeitfenster besitzt DWD-konforme Stufenfarbe, Gültigkeit, Titel, Kennwert und einen Chevron. Die Detailansicht öffnet unmittelbar unter der zugehörigen Zeile; beim Schließen wird die kompakte Ausgangsansicht wiederhergestellt.
- Im Hochformat stehen die Tagesgruppen untereinander, im mobilen Querformat zweispaltig.
- Amtliche CAP-Warnungen schließen direkt an die automatische Karte an. Vollständiger Originaltext, Handlungsanweisung, Gebiet, Sprache, Quelle und Gültigkeit bleiben erhalten.

## Kompatibilität und Worker

- Sämtliche Verträge und Open-Meteo-Audit-Fixes aus 0.9.65.2 und das rollierende 24-h-Profil aus 0.9.65.3 bleiben unverändert erhalten.
- Die Änderung verursacht keine zusätzliche Wetter-, Radar- oder KV-Anfrage. Bereits geladene Zustände werden lediglich responsiv neu dargestellt.
- Die Worker-Fachlogik ist unverändert; Professional-App und Worker tragen gemeinsam die Releasekennung 0.9.65.4 und sind als zusammengehöriges Update auszuliefern.

## Regression

`scripts/test-current-warning-compact-responsive-09654.mjs` schützt Compact-Struktur, lokale Gefahren-Disclosures, Hoch-/Querformatregeln, Tagesgruppierung und den vollständigen amtlichen Warntextvertrag.
