# MID Test Report 0.9.84.60

Gezielt geprüft:
- Multi-Source-Wolkenvertrag: DWD CDC + DWD SYNOP/POI + METAR parallel, Bright Sky nur Fallback.
- DWD-SYNOP-Achtel-Normalisierung und qualitative Himmelsbeobachtung.
- Deduplizierung gleicher physischer Stationen ohne sekundären METAR-Wolkenoverride.
- CAVOK-Vertrag bleibt erhalten.
- Widget-Kurvenübersicht mit moderat deutlicheren Temperatur-Hilfslinien.
- Versionierung, Release-Lineage, Worker-Syntax und Worker-Parität.

Fachliche Referenz: DWD dokumentiert Gesamtbewölkung bei Stationsbeobachtungen in Achteln (1/8); MID normalisiert diesen Stationsparameter intern auf Prozent.
