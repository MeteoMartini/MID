# MID v0.9.85.195

- Karten: dezente Verwaltungsgrenzen statt heller Doppelkonturen; Parameter in sechs fachlichen Kategorien.
- Neues Synoptik-Komposit: Temperatur 850 hPa, Höhenlinien 500 hPa und MSL-Isobaren ausschließlich aus demselben ICON-Lauf und Termin.
- ECCC GDPS Global ergänzt Gesamtbewölkung über freie GeoMet-Karten mit eigenem Lauf und Termin, glatter Originaldarstellung und erhaltener Herkunft.
- ICON-EU ergänzt die 2-m-Temperatur; verifizierte 12-h-Niederschlagskarten aus ICON-EU und ICON Global. Druckflächenabhängige Farbskalen werden passend gewählt.

- Warnungs-Timeline: vollbreite Ereigniskarten und ein gemeinsamer Tageszeitstrahl mit Wochentag, Datum und Ereigniszahl in allen Ansichten und beiden Designs.
- Die Jetzt-Markierung zeigt Datum und Uhrzeit in Ortszeit. Tagesgruppierung berücksichtigt Zeitzonen; Ereignisse über Mitternacht behalten ihren vollständigen Zeitraum.
- Die horizontale Layout-Kollision und der große Leerraum links entfallen. Amtliche Warnstufen und MID-Quellen bleiben unverändert getrennt.

# MID v0.9.85.194

- Inhaltlich gleiche, überlappende MID-Windhinweise werden nach der probabilistischen Fensterbildung als ein zusammenhängendes Ereignis dargestellt. Unsicherheit und längerer Prognosehorizont bleiben kenntlich.
- Unterschiedliche Warnstufen, Windrichtungen, konvektive Risiken und getrennte Ereignisse bleiben erhalten. Amtliche Warnungen und Niederschlagssummen werden nicht zusammengeführt.

# MID v0.9.85.193

- Der Installer prüft Core und Heavy-Regressionen parallel auf getrennten Runnern, ohne Tests auszulassen.
- Alle 24 Karten-Browserfälle werden verlustfrei auf drei isolierte Gruppen verteilt.
- Event-SHA, Manifest-, Archiv- und Datei-Hashes binden sämtliche Jobs an dasselbe validierte Release-Paket. Commit und Deployment bleiben bis zum Erfolg aller Prüfungen gesperrt.
- Laufzeitberichte je Test und Kartenfall machen Verzögerungen messbar. Keine Testergebnisse werden zwischen Releases wiederverwendet; sämtliche bestehenden Deployment-/Stable-Gates bleiben erhalten.
