# MID v0.9.85.386 – Wetterprofile: fehlende Niederschlagsdaten nicht als trocken ausgeben

- Kurzfrist- und 24h-Profil zeigen unbekannte Mengen und Wahrscheinlichkeiten nicht mehr als 0 mm oder 0 %. Die Aggregation unterscheidet echte Null und nicht verfügbare Beiträge.
- Niederschlagsraten und Einzeldaten kennzeichnen nicht verfügbare Werte. Die bisherige Zeitintervallzuordnung und meteorologische Phasensemantik bleiben erhalten.
- 90-Minuten-/24h-Titel und Diagramm zeigen fehlende Mengen/PoP explizit. Die SVG-Wahrscheinlichkeitslinie unterbricht bei NoData und ungültige Balken/Punkte werden nicht gerendert.
- Kompakte 14d-Ensembleangaben unterscheiden sichere Trockenheit, geringe Mengen, kleine bekannte Niederschlagswahrscheinlichkeit und unvollständige Daten; eine fehlende Phase wird nicht als Gewitter ausgegeben.
- Fokussierte Negativtests für null/NaN/Infinity, echte Null und PoP. Amtliche Warnungen, Modellfusionsgewichte, RUC und Karten bleiben unverändert.
- Der vollständige appweite Design-/Geräteaudit #523 ist noch nicht abgeschlossen. Die Veröffentlichung erfolgt ausschließlich nach bestandenem Source-PR-Gate, serverseitigem ZIP, Installer, Worker-/Pages-Gates und Stable-Promotion.
- Für 24h-Aggregate werden fehlende und überlappende Original-Zeitintervalle erkannt; unvollständige Summen oder Niederschlagswahrscheinlichkeiten erscheinen nicht mehr als scheinbar vollständige Werte.
- Im 7-Tage-Stundenprofil zeigt eine dezente, gestrichelte Kennzeichnung fehlende Niederschlagsmengen an. Die zugehörige Niederschlagswahrscheinlichkeit wird im Tooltip nur bei gültigen Daten ausgewiesen.
- Im kompakten 14-Tage-Ensemble erhält unbekannter Niederschlagsstatus ein eigenes, neutrales Symbol statt der bisherigen Verwechslungsmöglichkeit mit sicherer Trockenheit. Dies ist kein amtliches Warnsymbol.
- Der verpflichtende NoData-Negativtest schützt bekannte Nullwerte, Missing-/Infinity-Eingaben, Zeitlücken, Überlappungen, Diagrammunterbrechungen und die Ensemblekennzeichnung.
