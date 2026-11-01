# MID v0.9.85.404 – schnellere Karten und effizienterer Extremwetter-Ausblick

- **Kartenstart vorbereiten:** MID lädt die bestehenden Kartenmodule nach dem ersten vollständigen Ortswetter im freien Browser-Leerlauf vor. Beim späteren Kartenwechsel kann der Code dadurch bereits verfügbar sein. Bei langsamer 2G-Verbindung, Datensparen, Offline oder im Hintergrund startet kein automatisches Vorladen.
- **Extremwetter-Ausblick entlasten:** Vorhandene Gefahrensignale und Datenabdeckung werden gemeinsam statt mehrfach ausgewertet. Ist ein Ensemble-Raster unvollständig, werden unnötige Gefahrenpolygone nicht berechnet. Fehlende Daten bleiben ausdrücklich unbekannt; eine echte Null bleibt eine echte Null.
- **Unveränderte Wettergrundlage:** Warnstufen, amtliche DWD-Warnungen, Vorhersagemodelle, Niederschlagsakkumulationen, Messwerte, Quellen und die gespeicherten Kartenpräferenzen bleiben unverändert.
- **Datenlücken korrekt anzeigen:** Unvollständige, ungültige oder nicht endliche vierstufige Wahrscheinlichkeitsfelder werden nicht als vorhandene Nullwerte gezählt. Die interaktive Extremwetterkarte ist für assistive Technologien als benannter Kartenbereich statt als unzugängliches Gesamtbild gekennzeichnet.
- **Technische Datenqualität:** Die Diagnostik der RUC-Ensembleverarbeitung wird um eine lesende Auswertung echter Protokollphasen ergänzt. Sie aktiviert keine neue Fast-Lane und verändert weder Prognosewerte noch die Veröffentlichung der Daten.

**Messgrenze:** Eine bestimmte Verkürzung der vollständigen Kartenladezeit wurde nicht nachgewiesen; Realgerät, Netzprofil, WebGL-Kartenaufbau und der Extremwetter-End-to-End-Pfad müssen separat verglichen werden.
