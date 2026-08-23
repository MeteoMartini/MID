# MID v0.9.65.1 – Regression-Hotfix für v0.9.65.0

## Anlass

Der Installationslauf von v0.9.65.0 erreichte den Produktionsbuild, scheiterte anschließend jedoch an drei bestehenden Regressionen. Die fachlichen KV-/Sync-Einsparungen waren nicht die Ursache. Zwei historische Worker-Tests importieren bewusst interne Diagnosefunktionen als benannte ESM-Exports; diese Exportzeilen fehlten im ausgelieferten Workeraggregat. Zusätzlich verlangte der bestehende UI-Standardisierungsvertrag weiterhin die wörtlich geschützte 36-px-Mindest-Touchfläche, während v0.9.65.0 die sichtbare Info-Schaltfläche zu Recht wieder kompakt gemacht hatte.

## Korrekturen

- `pushThunderState` und `thunderPushBody` werden wieder als benannte ESM-Testexports angeboten; die produktive Gewitter-Push-Logik bleibt unverändert.
- `synopticUpstreamBearing` wird wieder als benannter ESM-Testexport angeboten; Front-/Strömungsrichtung und Synoptikkarte bleiben fachlich unverändert.
- Die sichtbare Info-Schaltfläche bleibt kompakt. Die geforderte Mindest-Touchfläche von 36 px wird ausschließlich über das unsichtbare, layoutneutrale `::before`-Trefferfeld getragen. Damit sind sowohl die optische Regression aus v0.9.52.3 als auch der appweite Touchvertrag erfüllt.
- Neue Regression `scripts/test-release-hotfix-09651.mjs` schützt beide Worker-Testexports und die Trennung von sichtbarer Button-Größe und Touchfläche.

## Funktionsschutz

Es wurde keine Wetter-, Warn-, Sync- oder Datenquellenfunktion entfernt, abgeschwächt oder in ihrer Kadenz verändert. Sämtliche KV-/Wetterzwilling-/Geräte-Sync-Einsparungen aus v0.9.65.0 bleiben unverändert erhalten.

## Release

Da v0.9.65.0 nicht erfolgreich installiert und committed wurde, wird der korrigierte Installationsstand als **v0.9.65.1** ausgeliefert. App und Worker müssen gemeinsam installiert werden.
