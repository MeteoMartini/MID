# MID v0.9.78.49 — Hybrid-Warnzentrum und unsicherheitsbewusste Warninhalte

## Anlass
Auf Basis des vom Nutzer bereitgestellten Webarchivs wird die Warnungsdarstellung fachlich und gestalterisch neu geordnet. Das Webarchiv fordert insbesondere, bei Windböen in Schauernähe nicht jedem Ort denselben Treffer und keine künstlich exakten Spitzenwerte zu unterstellen.

## Hybrid-Design
- Gemeinsame Sektion `Warnungen & Hinweise`.
- Amtliche CAP/DWD-Warnungen stehen stets zuerst.
- Automatische MID-Hinweise folgen als separate, visuell leichtere Prognoseebene.
- Überlappende MID-Hinweise werden als `MID · ERGÄNZUNG` markiert.
- Amtliche Gelb/Orange/Rot/Violett-Farben bleiben exklusiv amtlichen Warnungen vorbehalten.
- MID-Hinweise verwenden Parameterfarben.
- Amtliche Originaltexte und Handlungsempfehlungen bleiben vollständig und unverändert aufklappbar.

## Einheiten
- MID verwendet weiterhin die gewählte Windeinheit.
- Aus amtlichen Windtexten werden, soweit eindeutig möglich, km/h-/m/s-/kn-Werte extrahiert und nur für die kompakte Kopfzeile in die gewählte Windeinheit umgerechnet.
- Originaltexte werden nicht umgeschrieben.

## Inhalt ohne Scheingenauigkeit
- Automatische Windwerte werden als gerundete Bereiche dargestellt. Bei Schauern/Gewittern: `örtlich` und `Ortstreffer unsicher`.
- Stark-/Dauerregen und Schnee: gerundete Mengenbereiche statt exakter Einzelspitzen.
- Nebel: Sichtschwelle statt metergenauer Punktzahl.
- Glätte/Glatteis: qualitative kleinräumige Aussage.
- Wärme/Frost: gerundeter Temperaturbereich mit Hinweis auf Lage/Exposition.
- Gewitter: räumlich begrenztes Ereignis; kein scheinbar sicherer Zelltreffer.
- Das exakte interne Modell-/Schwellenmaterial bleibt unverändert erhalten.

## Vertrag
`MID_WARNING_HYBRID_CONTRACT.md` ist der neue verbindliche Projektvertrag für die Warnungsdarstellung.
