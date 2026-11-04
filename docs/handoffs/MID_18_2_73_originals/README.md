# MID 18.2.73 · Karten-/RUC-/WMO-Konsolidierung (04.11.2026)

**Nicht veröffentlichter Kandidat.** Diese Lieferung enthält ausführbare, teilweise SHA-geschützte Ausgangscode-Bausteine, isolierte Node-Regressionen und konkrete Integration-/QA-Aufträge. Sie ist **kein GitHub-Commit**, keine automatisch freigegebene MID-Version, keine reale iOS-/VoiceOver-Abnahme und kein nachweislicher Produktions-Fix. Es wurde kein GitHub-Branch verändert und kein Source-/Installer-Gate umgangen.

## Ausgangsquelle (live verifiziert)

- Repository `MeteoMartini/MID`; `main=mid-stable` `4d3051f80a17a180c3952c83bf5afa51623b1eb3`.
- Version `v0.9.85.427`; 1.070 Pflichtregressionen in `MID_BASELINE.json`; fünf GitHub-Rulesets aktiv; 16 offene PRs zum Prüfzeitpunkt.
- `AGENTS.md`, `MID_SOURCE_OF_TRUTH.md` und relevanten Karten-/Persistenz-/WMO-Quellcode geprüft.
- Relevant bereits parallel: SYNOP-Draft #480, RUC-PRs #551/#554/#612/#636/#638/#640/#642/#647, Design #523, Karten #422, Persistenz #508, ICON-Karten #434, RUC #541. **Nicht** ältere Drafts direkt auf Stable mergen.
- Für die Abnahme neuer Änderungen auf jeden Fall die aktuellen `main/mid-stable`-SHAs/PRs/CI erneut prüfen, auch wenn alle Prüfungen hier grün waren.

## Vier inhaltlich getrennte Pakete

| Verzeichnis | Inhalt | Aktueller Nachweis / Grenzen |
|---|---|---|
| `01_verified_cache` | Kurzzeit-Warmstart für unveränderliche SHA256-RUC-Kartenfelder mit strengen Speicher-/Zeit-/Herkunftsgates | TypeScript/Node-Suite isoliert grün; keine `latest.json`-Cache-Umgehung |
| `02_map_settings_iso` | Persistenz via MID Durable Storage, identische Isobaren-/Isohypsen-Termine, native ICON-v2-Gate, Pseudo-Wolkenbild-only, gebündelter Transform | Synthetic-Anchor-Tests grün; voller React-/Render-/Exporter-Gate noch ausstehend |
| `03_synop_symbols` | Originale SVG-Plotformen aus **Modell**-ww, responsiver MapLibre-Marker, Schutz extremer Einzelzellen, keyboard-/mobile-relevante Basiselemente, HTML-Escaping | Unit-Tests grün; 33 Codes sind keine amtlichen Symbolgrafiken, kein echter Browser-/Radar-Readback |
| `04_icon_global` | Weltweite ICON-Strategie: vorhandene on-demand DWD-WMS-Karten vor einer kostenintensiven neuen Rohdatenpipeline qualifizieren | Architekturentscheidung; aktuelle amtliche Live-WMS-Layer/Clientmigrations-Gates erforderlich |

## Wie die Bausteine anzuwenden sind

- `02_map_settings_iso/apply-combined-visual.mjs` ist die **einzige** koordinierte Transformroutine für sechs ursprüngliche Quellfiles und drei neue SYNOP-Symbolfiles. Sie verlangt eine **saubere autorisierte** `.428`-Integrationsbranch und exakt die sechs originären .427-Git-Blobs; bei Drift oder fremden Änderungen stoppt sie. Sie verändert **keine** Version, Branch-Refs, CI, Worker, Secrets oder Releases. Experten müssen danach `git diff`, Typ-/Build-/Browser-/Export-Tests und vollständige Source-/Heavy-/Installer-Gates durchführen.
- Die zwei untergeordneten `apply-...`-Transforms dienen der isolierten Prüfung; nicht unabhängig hintereinander an denselben Dateien anwenden.
- `01_verified_cache/src/verifiedMapFrameCache.ts` ist eine eigenständige Komponente, **noch nicht** mit dem existierenden `nativeModelFields.ts` verdrahtet. Lauf-/Frame-Validierungsregeln und Originalhash bleiben maßgeblich.
- `03_synop_symbols/synopWiring.mjs` bietet einen reinen, nicht schreibenden Quelltransform; das kombinierte `apply-combined-visual.mjs` nutzt ihn intern nach den beiden Karten-Transforms.
- `docs/HANDOFF.md` enthält SHA-/Gate-gebundene Codex-/Work-Aufträge, Modell/Intensität sowie konservative Releasekette.

## Wichtige bewusste Sperren

1. Kein pseudo-Satbild ist eine Messung; die bevorzugte Darstellung zeigt **modellierte** Gesamtbewölkung und konkrete WMO-Modellwettercodes. Das ECCC-GDPS-WMS-Original bleibt als gesonderte Anbieterdarstellung fachlich getrennt und muss im aktuellen Clouds-&-Weather-Menü erneut bewertet werden, damit kein zweiter **stilwählbarer** Modus zurückkehrt.
2. Höhen-/Druckisolinien werden **nur** mit gleicher Modell-ID, Laufzeit und exakt gleichem Gültigkeitszeitpunkt angezeigt. Deaktivierte User-Toggles dürfen nie aus einem bloß fehlenden aktuellen Feld erschlossen werden.
3. WMO/SYNOP `ww` beschreibt traditionell **Stations-Beobachtungen**; MID verwendet ausschließlich den explizit vom Modell gelieferten Wetterinterpretationscode und bezeichnet Glyphen konsequent als Modellgrafiken. Keine Lizenzannahme über originale WMO-Zeichenvorlagen.
4. Der verifizierte Feldcache ist kein RUC-Live-Freigabe-, Offline- oder Hyperlokal-Fusionsersatz. Kein Stale-if-error gegen laufübergreifenden Frische-/Domänenvertrag, keine unbewilligten API- oder Cloud-Kosten.
5. Gesamtpaket-/CSS-Budget überschritten; post-Release-Revision für Stable `.427` fehlgeschlagen. Diese Befunde bleiben getrennte Release-/QA-Blocker und dürfen nicht als grün ausgegeben werden.

## Tests (im Paket)

```
node --test 01_verified_cache/tests/verified-cache.spec.mjs
node --test 02_map_settings_iso/test-cloud-iso-fix.mjs
node --test 02_map_settings_iso/test-pseudo-only.mjs
node --test 03_synop_symbols/test-synop-model-plot.mjs
node --test 03_synop_symbols/test-synop-wiring.mjs
```

Voraussetzungen: Node 22+ und globales `tsc`. Diese Tests verifizieren eigene Logik und synthetische GitHub-Anker, **nicht** den kompletten MID-Produktionsbuild.
