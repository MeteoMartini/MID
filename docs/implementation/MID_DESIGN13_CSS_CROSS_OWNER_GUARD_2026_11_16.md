# MID Design 1.3 – Cross-Owner-Sperre für CSS-Lazy-Loading (16.11.2026)

**Status:** SHA-gebundener QA-only DRAFT, kein Release, kein CSS-Runtime-Umzug, keine neuen UX-/Wetter-/RUC-/Warnlogiken.

## Verifizierte Ausgangslage
- Veröffentlichtes `main=mid-stable=c9fadfcd0969e949a92f414b321627dd3d4fb0cc`, Version `0.9.85.483`; fünf aktive Regeln, Rechte bestätigt. Leitchat `#833` beim Isolationsabgleich `708680ebaf2509557f7921e7620a2189b9ac9059` mit 111 betroffenen Pfaden und **keiner** Überlappung dieser vier QA-Dateien. Keine Übernahme aus altem Chat-/ZIP-Stand.
- Der echte unveränderte v0.9.85.484-Vite-Diagnosebuild des Leitchats (Commit `23148c288df9986503d8a147193af658c4cc3cf5`; Actions `43809865421`) zeigte initiales CSS `1.753.539 / 1.760.000` Rohbytes: **6.461 B Reserve**, gzip-9 `248.714` B. Werte gelten für **jenen** Kandidaten-SHA, nicht automatisch für spätere Branch-HEADs.
- `scripts/audit-css-move-candidates-0985482.mjs` fand bei `src/midC18FourteenReplitFluidGrid.css` (12.823 rohe Quellbytes) null identische, *nachfolgende* Selektor-/Eigenschaftskollisionen und meldete daher zuvor `UNVERIFIED_NEEDS_OWNERSHIP_BROWSER_QA`. Das war **kein** sicherer Move-Befund.

## Konkrete, quer über Komponenten verteilte Eigentümer
Die per PostCSS untersuchten Selektoren aus der 14-Tage-Datei beziehen sich auf mindestens drei reale Komponenten, unabhängig davon, ob sie sich im CSS gegenseitig exakt überschreiben:

1. **App-weite Bottom-Navigation**: `.navigation-bottom-tabs`, echte Klasse in `src/App.tsx`, mobile `@media(max-width:850px)`.
2. **Berg-/Wintersport-Touchziele**: `.mountain-ski`, JSX in `src/MountainWeather.tsx`, 44×44-px-Regeln bei `@media(max-width:850px)`. Dies ist *kein* Kind des `FourteenDayDevelopment`-Moduls.
3. **Vollständige 14-Tage-Karten**: `.cockpit-fourteen-grid` und `.cockpit-fourteen-card`, echte JSX-Klassen im Eager-`src/ForecastCockpit.tsx`. `React.lazy(FourteenDayDevelopment)` lädt nur den eigenen Entwicklungsbereich, nicht alle Karten als einzigen Besitzer.

Die Quelle wird **nicht** verschoben: Der dortige mobile Navigationsabstand, Touch-Zielgröße, Karten-Zeilen- und Safe-Area-Kontext müssten bei einem Umbau als eigene, bewusst klassifizierte CSS-Schichten mit erhaltenem Vorrang nachgewiesen werden.

## Umsetzung und Guard
- Neues reines Prüfmodul `scripts/lib/cssCandidateOwnerEvidence.mjs` liest gültiges CSS via PostCSS-AST, markiert konkrete CSS-Anker und prüft ihre Vorkommen in den tatsächlichen Besitzerkomponenten. Die konservative Rückgabe `safeToDefer:false` wird **niemals** allein aus fehlenden Treffern zu `true`. Nicht vorhandene Komponentenmarker führen fail-closed zu Fehler statt fälschlich grünem Bericht. Fundstellen melden CSS-Quellzeilen und `@media`-/Kontextregeln.
- Bestehender CSS-Auditor ergänzt das **bestehende JSON-Schema v1 additiv** um `ownerEvidence` für diesen Kandidaten und ersetzt nur dessen vorherigen offenen Status durch `BLOCKED_CROSS_MODULE_OWNERSHIP`. Andere Kollisionskandidaten, Reihenfolge und Quellgenerierung bleiben unverändert.
- `tests/unit/mid-css-candidate-owner-evidence.test.ts` enthält synthetische Besitzer-/Nichttreffer-/NoData-/Malformed-Prüfungen, überprüft die echten CSS-/TSX-Dateien und startet den **echten** Auditor in einem temporären Verzeichnis; die Original-Quell- und CSS-Reihenfolge wird nicht verändert.

## Aussagegrenzen
Eine statische Text-/AST-Zuordnung ist **keine** Browser-/Layout-/Accessibility-/Geräteabnahme. Laut Vite 8.3 wird CSS eines dynamisch importierten Moduls zusammen mit dem Chunk geladen (https://vite.dev/guide/features); laut MDN bestimmen Spezifität, Herkunft, Kontext und Reihenfolge die Kaskade (https://developer.mozilla.org/en-US/docs/Web/CSS/Guides/Cascade/Introduction). Vor einem tatsächlichen Split: Klassen-/Owner-Mapping vervollständigen, CSS-Kaskaden-Low-Level-Snapshots samt Light/Dark + 320/390/430/834/1024/1440 px, Navigation/14 Tage/Berg, Touch und Erstaufruf im Browser **und** reales iOS/VoiceOver getrennt nachweisen. Kein Renderer-Build, Installer, Worker/Pages oder Stable-Release aus diesem Draft.
