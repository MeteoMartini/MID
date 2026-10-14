# MID v0.9.85.252 · Modellkarten bei echten Datenlücken besser erreichbar

- Bei geöffneten Modellkarten wählt die gemeinsame Zeitleiste zum Einstieg einen tatsächlich vorhandenen Modelltermin statt eines reinen Radar-/Beobachtungszeitpunkts. Das reduziert leere Synoptik-Komposite bei ungleichmäßig verfügbaren Modellzeiten.
- Bei „Wolken und signifikantes Wetter“ kann ICON-D2 für einzelne fehlende Termine ein schon vorhandenes, zeitgleiches natives Wolken-/Wetterfeldpaar nutzen. Fehlende oder unpassende Felder werden weiterhin nicht ergänzt oder geschätzt.
- Zusätzliche Regressionen prüfen die Terminwahl und stellen sicher, dass nur gemeinsam verfügbare Modellfelder verwendet werden.
- Modellberechnungen, Warnschwellen, RUC-Datenformat, Speicherschutz und die Bedienung anderer Wetterkarten bleiben unverändert.
