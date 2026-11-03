# MID v0.9.85.417 – Wetterhinweise und Skybar zuverlässig abgestimmt

- **Schneehinweise:** Eine geringe berechnete Schneesumme wird nicht mehr irreführend als „bis zu 3 cm“ ausgegeben. Echte Werte unter 1 cm werden auch so bezeichnet, sonst wird ohne künstlichen Unsicherheitsaufschlag moderat aufgerundet.
- **Langfrist-Hinweise:** Die zusätzlichen 72 Stunden zur Prüfung von Schneeakkumulationen verlängern den Warnbereich nicht mehr unbemerkt auf Tag 9 oder 10. Schwache Schneesignale ab fünf Tagen Vorlauf sind nicht als prominente MID-Warnung geeignet und bleiben in der normalen Vorhersage. Relevante Schneefälle bleiben als Hinweise verfügbar. „Tag 6–7“ wird durch den tatsächlich errechneten Prognosetag ersetzt.
- **Skybar:** Die vier gelben/grauen Balkendicken folgen bei bekannten Wolkenwerten ausschließlich der Gesamtbewölkung: ab 50 % Grau, darunter am Tag Gelb nach Wolkenlücken (100 % minus Bewölkung). **45 % Wolken = 55 % Lücken = Gelb 1/4**, selbst bei separat vorhandener 100-%-Sonnenscheindauer. Die Sonnenscheindauer bleibt als eigene physikalische Größe erhalten.
- **Gemeinsam:** Aktuell, 90 Minuten, Heute/24h, 7/14 Tage, Wetterquadrate, Widgets und Exporte verwenden die zentrale Skybar-Logik; amtliche DWD-Warnungen, Rohdaten, Modellzeiten, Niederschlagsphase, Intensität, NoData und Extremwerte werden nicht verändert.
- Ein neuer adversarieller Pflicht-Test sichert 7d-Horizont, Schnee-Mengen, echte starke Fälle, Prognosetag und Skybar-Wolkenstufen ab. Die Freigabe folgt unverändert erst nach vollständigen Source-/Installer-Gates.

# MID v0.9.85.416 – Vorlagentreues 7-/14-Tage-Prognosedesign

- **7 Tage:** Durchgehende originale Skybar unverändert. Übersicht als kompakte horizontale Wetterzeilen mit Datum, Symbol, Temperatur, Niederschlag sowie Wind/Böen. Sonnenschein/UVI und sämtliche Stunden-/Ensembledetails bleiben über Tagesdetails beziehungsweise Diagramme erreichbar.
- **Diagramme:** Fünf 7d- und vier 14d-Parameterdiagramme untereinander, mit originalen Vorhersagewerten und echten Ensemble-Unsicherheiten.
- **Tabelle:** Auch auf Smartphones vergleichbare, horizontal scrollbare Tabellenzeilen mit fixierter Datumsspalte, statt einzelner mehrzeiliger Karten.
- **14 Tage:** Temperatur- und Ensemble-Unsicherheitsverlauf zuerst; kompakte zwei Wochenstreifen danach und Wetterphasen als sekundäre Orientierung. Vollständige 14 Tageskarten und Prognose-Kompass bleiben.
- **Design:** Einheitliche MID-Typografie, Fokuszustände, Touchziele, Farben, Flächen und die klaren Ansichtsbezeichnungen „Übersicht“, „Diagramme“ und „Tabelle“. Keine A/B/C-Entwurfsbuchstaben.
- **Wetterdaten:** Keine Änderungen an amtlichen Warnungen, Modell- und Gültigkeitszeiten, Mengen, PoP, NoData, RUC/DWD oder Ensemble-Originalen.

Veröffentlichung ausschließlich nach vollständigem geschützten Source-/Installer-Gate und verifiziertem Stable-Readback.
