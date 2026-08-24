# MID 0.9.65.8

- Automatische Warnkarten werden im aufgeklappten Zustand strikt chronologisch dargestellt: zuerst heutige, danach zukünftige Tagesgruppen; innerhalb eines Tages nach Beginn und Ende des Warnfensters.
- Bei identischen Zeitfenstern bleibt die höhere Warnstufe als Tie-Breaker zuerst sichtbar.
- Die drei durch die vorangegangenen UI-/Flugbriefing-Anpassungen veralteten Regressionstests wurden an die geltenden Verträge angepasst: Warn-Disclosure mit chronologischer Sortierbasis, robuste Extraktion der Warnzeitformatierung sowie Höhenangaben unter FL050 in ft AGL.
- Keine Änderung der Worker-Fachlogik durch diesen Hotfix.
