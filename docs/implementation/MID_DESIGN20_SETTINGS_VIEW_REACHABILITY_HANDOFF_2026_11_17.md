# MID Design 2.0 · Settings-Tab-Ownership, Ansichts-Erreichbarkeit und sichere Codebereinigung

**17.11.2026 · SOURCE QA / Integrationshand-off · keine Produktions- oder Releasefreigabe**

## 0. Verifizierte Ausgangsbasis

- Kanonisches GitHub `MeteoMartini/MID`: `main = mid-stable = 9fe4dfbcdfd5a1f8fec55efa868e22110a612953`, `v0.9.85.488` über `package.json`, `MID_BASELINE.json` und `contracts/index.json`, fünf aktive Rulesets.
- `src/App.tsx` Git blob `d5fd0cee5c6cf8df187f3493c864d136ab11bcd9`. Normative `AGENTS.md`, `MID_SOURCE_OF_TRUTH.md`, `MID_UI_ARCHITECTURE_CONTRACT.md`, `MID_NAVIGATION_BOTTOM_BAR_CONTRACT.md` gelesen. Parallel-#868 berührt `App.tsx`, `ForecastCockpit.tsx`, `startupPreload.ts` auf einer älteren Basis. LC #902 trainiert .489; #900 besitzt `DashboardModuleSettings.tsx`.
- **Absichtliche Eigentümerschaft:** Dieser Spezial-Draft enthält nur neue, disjunkte QA-/Integrationsskripte und diese Dokumentation. `src/App.tsx` wird im Spezialbranch NICHT geändert; die produktive Anwendung gehört ausschließlich dem jeweils aktuellen Leitchat-Integrationsbranch nach Source-of-Truth- und Hunk-Abgleich. Diese Hand-off-Skripte sind kein CI-/Review-Gate-Ersatz.

## P1 · SettingsManager: vier eigenständige, nur bedarfsweise gemountete Tabs

**Realer Fehler:** `contentReady&&(['view','weather','navigation','units'] as SettingsSection[]).includes(section)` mountet im Stable-Source in jedem der vier Menüpunkte dieselbe komplexe JSX-Teilstruktur. Dadurch gibt es logisch duplizierte Optionslisten und vermeidbare React-Teilbäume (keine reale Laufzeit-/INP-Messung). Die bestehenden onClick-/onChange-Handler, echten Storage-Werte und Semantiken dürfen nicht geändert werden.

`scripts/qa/design20SettingsTabSplit.mjs` ist ein SHA-gebundener, minimaler Patchgenerator mit exakt elf JSX-Gruppelement-Gates plus zwei Sondergates:
- `view`: Standard/Erweitert, Dichte, Favoritenstreifen, Theme, Logo
- `weather`: Prognosekonfidenz, Skybar/Stundenquadrate, ECMWF-Farbwahl, 7d-Zusammenfassung, Radar-Nowcast, Modelllauf-Änderungsradar (nur im Erweiterten Modus)
- `navigation`: Gesundheits-/Pollenmodule, DWD Niederschlagsarten-Radar, lokale Gefahrenhinweise, Dashboardmodule/Reihenfolge
- `units`: Lokal-/Z-Zeit und Einheiten

Alle Original- JSX-Subtrees, Event-Handler, Warn-/Quellwerte, DOM-Rollen und Klassen bleiben byteidentisch **innerhalb** der neuen Gates. Nur die Bedingungen für das tatsächliche Mounting ändern sich; kein CSS-`display:none`-Scheinfix, kein neuer Store, kein neuer Listener, kein zweites Fetch/Preload.

**Abfolge für den Leitchat (nie blind auf einem anderen Commit oder branch):**

```bash
node scripts/test-design20-settings-route-owners.mjs
node scripts/test-design20-view-reachability.mjs
node scripts/qa/design20SettingsTabSplit.mjs --preview
# Erst auf berechtigtem chatgpt/v0.9.85.489-... / codex/v0.9.85.489-...
# mit identischem Original-Git-Blob und gesichertem sauberem App.tsx:
node scripts/qa/design20SettingsTabSplit.mjs --apply
node scripts/qa/design20SettingsTabSplit.mjs --check-after
node scripts/test-design20-settings-route-owners.mjs
node scripts/test-settings-menu.mjs
node scripts/test-lazy-optional-settings-0985483.mjs
node scripts/test-forecast-design-visibility-0985415.mjs
```

Der Helper prüft den Git-Blob, die strukturellen JSX-Marker, alle neun Menüpunkte, Originaloptionen, zulässigen Branch-Namen und unveränderte Arbeitsdatei. `--preview` und `--selftest` schreiben nichts. `--apply` ist **nur** nach expliziter Eigentümerintegration zulässig; jeder andere App-Blob bzw. Versions-/Branchdrift stoppt fail-closed. `--check-after` prüft die gegateten Gruppen ohne weitere Schreibaktion. Die echte CI muss zum finalen LC-SHA nach erneuter Base-/PR-Überlappungslage ausgeführt werden.

## P2 · Nicht erreichbare Altansichten – geschützt, nicht blind gelöscht

`scripts/test-design20-view-reachability.mjs` prüft die aktiven Renderpfade und inventarisiert fünf Kandidaten. Das ist bewusst ein **read-only** Source-Inventar. Vor jeder Löschung sind Importgraph, Design-CSS, gespeicherte Schlüssel und 320/390/430/834/1024/1440-Browserprofile mit Unterschieden im Bild und in Eingabeeigenschaften zu qualifizieren:

1. **Alte Navigation:** `NavigationMode='section-rail'|'bottom-tabs'`, aber Hauptwert ist fest `bottom-tabs`. Nur nicht erreichbare alternative JSX-Schnellnavigation qualifizieren; die Desktop-`.dashboard-section-rail` und ihre CSS/ARIA-Regeln bleiben produktiv.
2. **Cockpit-Ribbons:** App ruft `ForecastCockpit mode='cockpit-tabs'` auf, während `mode==='cockpit-ribbons'` im Renderer weiter existiert. Nicht nur nach Textsuche löschen; vollständige Testfixtures, Styles und mögliche Export-/UI-Abhängigkeiten analysieren.
3. **Startup-Altpräferenz:** `startupPreload.ts` liest `settings.presentationMode` (`cockpit-ribbons`/Tabs), obwohl aktuelle ForecastDisplaySettings keine solche auswählbare Option führt. **Nicht ungesehen entfernen:** ursprüngliche Ensemble-Vorladebedingung, Offline-/DataSaver-Verhalten, letzte aktive Horizonte und Backups vergleichen.
4. **Bottom-Bar-Auto/Fixiert:** Der normative Vertrag nennt den Schalter, der aktuelle Produktcode erlaubt nur `fixed` und entfernt den historischen Schlüssel. Dies ist ein **Vertragswiderspruch**, keine automatische Produktentscheidung. Mit Leitchat/Nutzer die kanonische Regel klären.
5. **Alter 24-h-Navigationseintrag:** Separater Tab entfällt, aber `24h`-Altwerte werden zur Kurzfristansicht migriert. **24-h-Daten, 24-h-Profil und Lesemigration erhalten.**

Weiterhin **aktiv und löschgeschützt**: Standard/Erweitert, Auto/Kompakt/Komfortabel, Konfidenz Signal/Text, Skybar/Quadrate, 7d Übersicht/Diagramme/Tabelle (Schalter im `SevenDayBand`, interner Doppelschalter bewusst `false`), 14d Übersicht/Diagramme/Tagesvergleich, Langfrist 46d/Saison, `UnifiedWeatherMap` mit `RadarPanel`/Synoptik/Radar/Satellit sowie Desktop-Sektionsleiste.

## P3 · Präferenz-/Vertragskonsolidierung

Alle `mid:...`-Schlüssel und vorhandenen `updatedAt`-/Fallback-Verträge bleiben bis zur nachgewiesenen Migration bestehen. Vor Entfernen eines alten Auswahlschlüssels echte Wiedergabe-/Backup-/Sync-Szenarien prüfen: Missing vs. false vs. 0, quota/storage-denied, parallele Tabs, iCloud, Favoritenwechsel, nicht verfügbares Produkt. Die frühere `presentationMode`-Abfrage darf nur nach äquivalenter Start-Ensemble-Entscheidung verschwinden.

## P4 · Abnahmematrix und Grenzen

Nach LC-Integration echte App in Browsern auf 320/360/390/430/834/1024/1440 CSS px und Landscape, mit 200%-Text, Light/Dark/High-Contrast, Reduced Motion und Zoom prüfen. Pro der neun Settings-Tabseiten: (a) nur eigene fachliche Bedienelemente im sichtbaren/Accessibility-DOM, (b) aktive Buttons korrekt `aria-pressed`, (c) Werte bleiben über Tabs/Unmount/Reload und gerätespezifischen Sync erhalten, (d) Tastaturfokus/Scroll sichtbar, keine Root-Overflow-/Text-Clipping-Fehler, (e) touch target mindestens MID-Vorgabe, (f) 7d/14d und Kartenfokus unberührt. Erst dann Vorher/Nachher DOM-Nodes, JS heap, JS mount long tasks, INP-/Interaction-to-Next-Paint und Renderkosten gegen **SHA-festes Stable** erheben; keine hypothetischen Verbesserungen als gemessene Werte ausgeben.

W3C normativ: [WCAG 2.2 Reflow](https://www.w3.org/WAI/WCAG22/Understanding/reflow.html) und [Target Size (Minimum)](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html); für neue primäre MID-Touchbereiche gelten die strengeren MID-Design-Tokens. [React Conditional Rendering](https://react.dev/learn/conditional-rendering) erklärt das bedarfsgesteuerte Ein-/Aushängen und [Preserving and Resetting State](https://react.dev/learn/preserving-and-resetting-state) die nötigen Persistenzprüfungen. Browser Chromium ist keine native WKWebView-/VoiceOver-Abnahme.

**Status:** QA-/Patch-Generator und Quellwachen erstellt; P1-Codeänderung auf dem fremdverwalteten Integrationsbranch, P2-Löschungen, P3-Produktentscheidung sowie P4-gerenderte Browsermessungen noch offen. Keine Änderung an Produkt-/Produktionscode, kein Build, kein Merge, keine Promotion. #740/#839 bleiben Spezialbereich, ohne ein Design-QA-Fachziel als Release-Bypass zu verwenden.
