# MID-Karten 1.14 · GPU-Eigentümer für Umfeld- und Vollkarte (QA-DRAFT)

Stand: 17.11.2026 · Basis `main=mid-stable=a78465b655d25cafc9ecc0390080694cb7aca957`, v0.9.85.486, fünf aktive Branch-Rulesets. LC #868 HEAD `3fa9980bd0b271345dbb49cd2d4cce0b4b54ba1e` war vor der Erstellung geprüft. **NO READY / NO MERGE / NO RELEASE.**

## Reproduzierbarer Befund
In der klassischen `section-rail`-Navigation lässt `src/App.tsx` die Bereiche „Aktuell“ und „Karten“ gleichzeitig montiert, während die bestätigte Spezial-Browserfixture #881 `request ? FullMap : CurrentSurroundings` nutzt und die kompakte Karte **unmountet**. `ViewportGate` bleibt nach der ersten Aktivierung dauerhaft sichtbar, daher kann der kompakte MapLibre-WebGL-Kontext selbst beim Kartenwechsel weiterlaufen. Die bekannte `Invalid LngLat object: (NaN, NaN)`-Exception in Stable .486 besitzt separat schon einen `MapFitBounds`-Guard im LC #868. Ob parallele WebGL-Kontexte den tatsächlichen iOS-Absturz auslösen, bleibt **nicht nachgewiesen**.

## Exakter Kandidat
- `src/App.tsx`: Nur bei aktivem, freigegebenem `composite`-Workspace die Vorschau als pausiert markieren.
- `src/CurrentSurroundings.tsx`: `mapPaused` optional an die existierende Komponente weiterreichen. Bei Pause den **gesamten** `MidMapLibre`-Subtree aus React entfernen, nicht nur den Canvas mit CSS verstecken. Der vorhandene MapLibreCore-Cleanup ruft bei Unmount `map.remove()` auf. Außerhalb bleiben sämtliche Zeitsteuerung, meteorologischen Status-/Quellangaben, Wetterdaten, der Modus und die „Karte öffnen“-Aktion erhalten. Bei Rückkehr zu „Aktuell“ wird die Vorschau wieder montiert.
- `src/CurrentSurroundings.css`: barrierearm lesbare Ersatzinformation im vorhandenen responsiven Kartengehäuse, ohne neue Farbskala oder neue Layout-Höhe.
- `tests/unit/mid-map-compact-gpu-owner.test.ts`: Syntax und Gate-Quellvertrag. **Statische Tests beweisen keine echte WebGL-Lebensdauer oder iOS-Reparatur.**

Kein Versionsspiegel, CSS-Bundle-Split, Produktprovider, Wetterwert, Akkumulation, Warnung, Worker, Release-/CI-Workflow, Cloudflare, Secret oder wirtschaftlicher Dienst geändert. Kein anderer Kartenrenderer erhält eine globale GPU-Sperre.

## Selektive Übernahme in den LC
`src/App.tsx`, `src/CurrentSurroundings.tsx` und `src/CurrentSurroundings.css` werden in #868 parallel geführt; **KEIN Vollfile-Austausch**. Vor Intake Stable- und LC-HEAD erneut vergleichen, `mapPaused`-Props/JSX minimal semantisch übertragen, dabei die in #868 bereits integrierten #881-Temperatur-/Crash-UX- und #853-WMS-/Raster-Änderungen unverändert bewahren. `openingMap`-Latch aus #868 bei erfolgreichem Wechsel und Rückkehr reaktivieren; dieser historische Stable-basierte Spezialpatch verändert die dort bereits existierende Latch-Logik ausdrücklich **nicht**.

## Nicht bestandene oder noch auszuführende Akzeptanz
1. Tatsächliche React/MapLibre-App (nicht bloß `request ? Map : Map`-Fixture), beide `section-rail`/ `bottom-tabs` mit exakt 1 aktivem Canvas/WebGL-Map-Eigentümer beim Wechsel; 320/390/430/834/1024/1440px, Light/Dark, Landscape, Orientierung und 200 % Text, 44px Targets.
2. Mindestens 20 Hin-/Rückwechsel inkl. schnellen Doppeltipps, Browser Back, asynchron scheiternder Navigation, Ortswechsel, langer Ortsnamen, Modul geschlossen, Scroll/ViewportGate, Slow Network, betriebsbereitem Radar/WMS, Ausbleiben alter Stale-Images. WebGL-Context-lost/restored und Ressourcen-/Listener-Cleanup mit GPU-/Memory-Messung.
3. iOS WKWebView/Safari physisches Gerät: WebContent-/Jetsam-/GPU-Stack und Speicherdruck, damit **echte** Ursache bewiesen wird; MapLibre GL JS v6 benutzt WebGL2 und kann bei GPU-Fehlern direkt scheitern.
4. Meteorologisch: DWD/EUMETSAT echte TIME/CRS-/Alpha-/NoData-/WMS-Innenpixel-Gates aus #853 und eigene Originalzeiten/Quellen; keine fehlenden Werte als 0.
5. Vollständige vorhandene Source/Core/Heavy/Browser/WebKit/Review/ZIP/Installer/betroffene Worker/Pages/Stable-Gates **auf finalem LC-SHA**; #839/#740 bleiben unabhängig und sind keine zusätzliche pauschale Releasesperre.

Offizielle MapLibre-Quellen: https://maplibre.org/maplibre-gl-js/docs/API/classes/Map/ und https://maplibre.org/maplibre-gl-js/docs/guides/v5-to-v6-migration-guide/ . Nur `map.remove()` ist dokumentierte Ressourcenfreigabe; die mögliche Verringerung von iOS-Jetsam wird erst nach Messung behauptet.
