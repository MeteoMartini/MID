# MID-C20 · Kurvenwidget-Ortskopf · v0.9.85.192

Basis: main = mid-stable = df7df09c167b7c482e31c27e64aefa77148bc5ad, veröffentlichtes v0.9.85.191.

Der bisher ausschließlich im Tageskarten-Zweig gerenderte Kopf sitzt jetzt einmalig vor der Karten-/Kurven-Auswahl innerhalb desselben PNG-/Zwischenablage-Exportziels. Beide Ansichten nutzen exakt denselben Ortsnamen, dieselben Koordinaten, die vorhandene Prognosehöhe und Ortszeit. Ensemble bleibt unverändert. Es gibt keine neue Ortsdatenquelle oder abweichende Formatierung.

Die Widget-Funktionsreferenz im strengen Modul-Golden wird nur für diese bewusst angeforderte Kopfverschiebung neu signiert. Alle übrigen Implementierungs-Hashes, CSS-Fingerabdruck, Quellenreihenfolge, Duplikatprüfung und Release-Gates bleiben erhalten. Ein Render-Test vergleicht beide Profile für drei feste Orte und Light/Dark; eine Browserprüfung prüft zusätzlich fünf Displaygrößen und die Lage innerhalb der Exportfläche.
