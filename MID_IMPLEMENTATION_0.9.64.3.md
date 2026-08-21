# MID v0.9.64.3 – amtliche Warnungen, Zellbezeichnung und Modellstand

## Amtliche Warnungen in Europa

- Die für Rhodos gültige HNMS-Warnung erreicht MID über den offiziellen griechischen MeteoAlarm-Atom/CAP-Feed. Die bisherige Lücke entstand beim zu wörtlichen Ortsabgleich zwischen „Rhodes“ beziehungsweise „Dodecanese“ und dem CAP-Gebiet „Dodekanisa Islands“.
- Der Gebietsabgleich verarbeitet jede CAP-Area getrennt, wertet vorhandene Polygone oder Kreise vorrangig aus und unterstützt bei reinen Gebietsnamen vorsichtige Schreibvarianten sowie die Dodekanes-/Rhodos-Aliasgruppe.
- Die hinterlegte Länderliste entspricht den aktuell veröffentlichten MeteoAlarm-Atomfeeds. Deutschland bleibt beim DWD-WFS; DWD-CAP ist nur Ausfallfallback. Alle übrigen unterstützten europäischen Länder verwenden ihren MeteoAlarm-Feed als kanonische amtliche Quelle.
- MID mischt keine kommerziellen oder zweiten Warnungsprovider in dieselbe Standortantwort. Dubletten werden zusätzlich providerneutral über CAP-Kennung und Referenzen sowie Ereignis, Gebiet und Gültigkeitszeitraum zusammengeführt. Getrennte Warnungen für verschiedene Tage bleiben getrennt.

## Starker Schauer und Gewitter

- Eine aktuelle KONRAD3D-Zelle ohne detektierten Blitz heißt „Starker Schauer“; die Kartenrubrik lautet „Schauerinformation“.
- Der Begriff „Gewitter“ wird für eine aktuelle Zelle erst bei mindestens ein Blitz je Fünf-Minuten-Zellobjekt verwendet.
- Reine Radar-/Modellsignale ohne bestätigten Blitz werden als „Konvektionsinformation“ ausgegeben und erfinden kein aktuelles Gewitter.
- Starkregen-, Hagel-, Böen-, Zugbahn- und Intensitätsinformationen bleiben vollständig erhalten.

## Modellstand

- Die Modellstand-Pille der 14-Tage-Übersicht besitzt nun in Hoch- und Querformat eine reservierte zweite Grid-Spalte.
- Überschrift und Pille können sich nicht mehr überlagern; die Schaltfläche behält ihr berührungssicheres Zielmaß.

## Worker

- Das Release enthält ein funktionales Worker-Update: amtliche Feedabdeckung, CAP-Gebietsabgleich, Quellenstrategie und Dublettenprüfung wurden geändert.
- Frontend, Worker, Service Worker, Versionsdatei und beide Auslieferungs-ZIPs müssen deshalb gemeinsam auf v0.9.64.3 aktualisiert werden.
