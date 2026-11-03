# MID v0.9.85.415 – Skybar: Sonne und Wolken korrekt abgestuft

- Die vier gelben/grauen Strichdicken folgen jetzt durchgehend der **Gesamtbewölkung**: ab 50 % grau, darunter am Tag gelb nach dem offenen Himmelsanteil (100 % minus Gesamtbewölkung). 45 % Wolken entsprechen 55 % Wolkenlücken und somit **Stufe 1/4** – auch wenn der separat übermittelte Sonnenscheinanteil 100 % beträgt.
- Fehlende Bewölkung darf weiterhin mit tatsächlich verfügbarer Sonnenscheindauer als **ausdrücklich gekennzeichnetem Fallback** visualisiert werden. Wolkenlücken werden niemals als WMO-Sonnenscheindauer ausgegeben. Der Tooltip unterscheidet beide Größen samt Bezugszeit.
- Aktuell/12h, 90 Minuten, Heute/24h, 7/14 Tage, Wetterquadrate und die gemeinsamen Widget-/Export-Renderer verwenden die zentrale Klassifikation. Niederschlagsphase/-intensität, Tag/Nacht, Wetterpiktogramme und sämtliche meteorologischen Eingabewerte bleiben unverändert.
- Verbindliche Regressionsprüfungen für vier Stufen, Grenzwerte, 45-%-/100-%-Widerspruch, Sonnenauf-/-untergang, Zeitintervalle, Missing und Niederschlags-Overlays erweitert. Keine vorgezogene Freigabe von DWD-/RUC-Originaldaten.

# MID v0.9.85.414 – Wettervorhersage neu erleben: Heute, 7 und 14 Tage

- **Heute: gezielt und intuitiv:** Die Schaltflächen Temperatur, Regen und Wind betonen die jeweilige Kurve sichtbar, ohne Wetter-, Wolken-, Warn- oder andere Originalinformationen zu verbergen. Der ausgewählte Viertelstundenwert im 90-Minuten-Bereich lässt sich durch erneutes Tippen wieder einklappen.
- **Sieben Tage in drei Ansichten:** A – kompakte Standardansicht mit der bestehenden durchgehenden Skybar und Tagesgrafik; B – zusätzliche, getrennte Diagramme für Temperatur, Niederschlagsmenge, Wahrscheinlichkeit, Wind/Böen und Sonnenscheindauer; C – vergleichbare tabellarische Tagesdetails mit direktem Zugang zum Stundenverlauf.
- **14 Tage übersichtlicher:** A – kompakte Wetterentwicklung als Standard; B – erweiterte, parameterbezogene Diagramme; C – detaillierte Tagesübersicht. Ensemble-Spannen und Quantile werden nur bei vorhandenen echten Daten gezeigt.
- **Responsive und zugänglich:** Mobile, Tablet- und Desktop-Layouts erhalten fokussierbare Ansichtsschalter, mindestens 44-px-Touchziele und horizontal zugängliche Detailtabellen. Die bestehenden Einstellungen und Light-/Dark-Modi werden berücksichtigt.
- **Meteorologische Integrität:** Fehlende Mengen/Wahrscheinlichkeiten werden nicht als Null ausgegeben; Tagesakkumulation, Zeitachse, echte Ensembleunsicherheit, Extremwerte, vorhandene Modellkarten und amtliche DWD-Warnungen bleiben fachlich getrennt.
- **DWD-Originaldaten-Sicherheit:** Der geschützte ICON-D2-Signer kontrolliert main und mid-stable vor und nach der kryptografischen Signatur und bewahrt den unveränderten Originaldatenvertrag. Dieser Software-Release aktiviert keine ungeprüften D2-/Fast-Lane-Produktivdaten.
- **Freigabevorbehalt:** Native D2-/RUC-Vollgebietsveröffentlichung, atomare Pages-/R2-Aktivierung und reale Web-/iOS-/Widget-/Export-Endkunden-Frische benötigen weiterhin ihre unabhängigen Daten- und Geräte-Gates. Keine vorgezogene Behauptung einer Live-Datenfreigabe.
