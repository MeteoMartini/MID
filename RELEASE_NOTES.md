# MID v0.9.85.399 – Datenlücken korrekt anzeigen, Modelllinien besser unterscheiden und Tagesdetails stabilisieren

- **Wasserwetter ohne falsche Nullwerte:** Fehlt in einer einstündigen oder dreistündigen Prognoseperiode ein erforderlicher Niederschlagswert, zeigt MID die Menge als nicht verfügbar statt fälschlich „0 mm“ an. Das gilt auch für Regen, Schauer und Schneezuwachs. Tatsächlich gemessene oder prognostizierte 0 mm bleiben erhalten.
- **Saisonmodelle eindeutig vergleichen:** Die Legende zeigt jetzt exakt dieselben Strichmuster wie die Modellkurven. Mehrere Wettermodelle sind damit auch ohne alleinige Farbunterscheidung leichter zuzuordnen.
- **Tagesdetail auch bei eingeschränktem Speicher:** Verweigert ein Browser den Zugriff auf gespeicherte Darstellungseinstellungen, bleibt die Tagesdetailansicht benutzbar. Vorhandene gespeicherte Aufklappzustände bleiben erhalten. Auch die gespeicherte Layoutwahl und Favoritenreihenfolge werden bei blockiertem Browser-Speicher sicher eingelesen.

