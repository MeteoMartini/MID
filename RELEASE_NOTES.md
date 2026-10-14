# MID v0.9.85.250 · RUC-Datenaktualisierung wieder absichern

- Ein Fehler im neuen internen RUC-Kompressions-Prüfmodul wurde korrigiert. Er hatte zuletzt die Veröffentlichung neuer RUC-Wetterdaten verhindert, obwohl die eigentliche Datenaufbereitung bereits erfolgreich war.
- Vor dem zeitaufwendigen Laden der DWD-Modellfelder kontrolliert MID jetzt alle Python-Programme der RUC-Pipeline auf Syntaxfehler. Zusätzlich ist diese Prüfung im Entwicklungs- und Freigabetest verankert.
- Die eigentlichen RUC-Modellwerte, das Speicherbudget, die Modellkarten und das bisherige Datenformat bleiben unverändert; eine produktive verlustfreie Kompression folgt erst nach eigenen Decoder- und Leistungstests.
- Die App-Oberfläche und ihre Bedienung ändern sich durch diese Fehlerbehebung nicht.
