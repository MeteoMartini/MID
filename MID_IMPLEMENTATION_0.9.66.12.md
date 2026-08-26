# MID 0.9.66.12

Die aktuelle Wetterkarte verwendet für Radar-Nowcast und lokale Zusatzgefahren einen gemeinsamen, kartenbreitenabhängigen Layoutvertrag.

- Radar-Nowcast-Rahmen, Diagramm und Info-Schaltfläche bleiben vollständig innerhalb der Niederschlagskarte.
- Die 2-h-Summe und die P25–P75-Spanne stehen bei ausreichender Breite kompakt nebeneinander und ordnen sich in schmalen Karten in eigene Zeilen um.
- Stundenmarken und Jetzt-Kennzeichnung erhalten getrennte vertikale Lesebereiche.
- Lange Texte in Gewitter-, Starkregen- und Sturzflutkarten sowie Status-, Orts-, Fakten- und Quellenfelder umbrechen ohne Überdeckung.
- Container-Abfragen reagieren auf die tatsächliche Kartenbreite und damit auch auf zweispaltige Tablet-, Desktop- und Querformatlayouts.

Die meteorologische Auswertung und der Worker-Datenvertrag bleiben unverändert; die Worker-Version wird ausschließlich für einen eindeutigen gemeinsamen Release-Stand synchronisiert.
