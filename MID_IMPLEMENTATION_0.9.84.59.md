# MID 0.9.84.59

## Installer #1014
TypeScript 7.0.2 und Vite 8.2.2 liefen erfolgreich. Von 751 Regressionen scheiterte ausschließlich `test-interaction-performance-cleanup-08155.mjs`, weil der Test `synoptic.ts` noch als bewusst deaktiviertes Modul klassifizierte. Seit der gewünschten Integration von Fronten, Isohypsen und Druckzentren in das Kompositbild ist `synoptic.ts` jedoch absichtlich aktiv.

Der Performancevertrag wurde präzisiert: `RadarPanel` bleibt lazy geladen; `synoptic.ts` darf ausschließlich über diesen Pfad erreichbar sein. Das separate alte `SynopticPanel.tsx` sowie andere deaktivierte Altmodule bleiben dormant. Die Produktivlogik von v0.9.84.58 wurde nicht verändert.
