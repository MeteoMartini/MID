# MID v0.9.40.6

- Buildfix für das Niederschlagsartmodellradar: `RadarPhase` ist wieder als strikt typisierte Union (`rain | mixed | snow | freezing | uncertain`) aus `radarColorTables.ts` exportiert.
- Damit ist der Zugriff `PRECIPITATION_TYPE_COLORS[phase.phase]` vollständig typisiert und die beiden GitHub-TypeScript-Fehler TS2305/TS7053 aus v0.9.40.5 sind beseitigt.
- Die fachliche Zuordnung aus v0.9.40.5 bleibt unverändert: Farbtabellen-Auswahl nur für normales 1-km-/250-m-Radar; feste klassische meteorologische Phasenfarben für das Niederschlagsartmodellradar.
- Regression `test-radar-colortables-09404.mjs` prüft nun zusätzlich den Export der Phasen-Union.
