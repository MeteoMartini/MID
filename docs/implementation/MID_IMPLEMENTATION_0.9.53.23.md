# MID v0.9.53.23

## Modulzustand, Eventhinweise, Niederschlagswahrscheinlichkeit und aktuelle Wetterkarten

- Der Öffnungszustandsvertrag der großen Hauptmodule wurde auf v3 migriert. Standardmäßig geschlossene Module werden einmalig erneut auf einen sauberen geschlossenen Ausgangszustand gesetzt; insbesondere `Langfrist` darf nicht durch einen Altzustand aus der v2-Migration offen starten.
- Eventhinweise wurden sprachlich auf sachliche Lagehinweise und konkrete empfohlene Maßnahmen umgestellt. Umgangssprachliche Formulierungen wie „Pausen und Wasserstellen einplanen“ entfallen.
- Im 7-Tage-Trend wird ein DWD-6-h-Zeitfenster nur hervorgehoben, wenn dessen Niederschlagswahrscheinlichkeit klar über dem Mittel der Tagesfenster liegt und zugleich gegenüber dem nächsthöchsten Fenster abgesetzt ist. Bei 0 % wird weiterhin kein Zeitfenster angezeigt; ohne markanten Schwerpunkt bleibt 00–24 h maßgeblich.
- Event-PoP wird bevorzugt ensemblebasiert über die im vollständigen Eventzeitraum aufsummierte Niederschlagsmenge bestimmt. Fehlt diese Ensembleauswertung, verwendet MID nun das zeitgewichtete Mittel aller tatsächlich mit dem Event überlappenden Stundenwahrscheinlichkeiten statt der höchsten Einzelstunde.
- Die aktuelle Wetterkarte zeigt den hyperlokalen Modellhintergrund und die numerischen Restfeld-/Windkorrekturen wieder kompakt an. Parameterkacheln führen im Erweiterten Modus den verwendeten Modellhintergrund mit; die Windkachel weist die Gelände-/Oberflächenkorrektur aus.
- Unicode-/Sonderzeichen in den betroffenen Wettertexten bleiben explizit UTF-8: `ΔT`, `°`, `±`, `ü. NHN`, Gedankenstrich und typografische Einheiten.

Neue Required-Regression: `scripts/test-mid-followups-095323.mjs`.
