# MID v0.9.77.23 – 24-h-Wetterprofil: transparente Wertepillen + gemeinsame Sonne/Wolken-Leiste

## Umsetzung

- Die Wertepillen am aktiven senkrechten Auswahlcursor verwenden weiterhin den theme-adaptiven Tooltip-Hintergrund, jetzt aber mit `fill-opacity: .8`. Dadurch bleiben Kurven, Raster und Bänder unter der Pille sichtbar, ohne die Lesbarkeit des Werts aufzugeben.
- Die bisherige **Gesamtbewölkungs-Zellenzeile** im 24-h-Wetterprofil entfällt.
- An genau dieser Stelle wird jetzt die **Sonne-/Gesamtbewölkungs-Leiste der Tagesansicht** wiederverwendet. Die Logik wurde dafür in `src/detailSkyBar.ts` zentralisiert; Tagesansicht und 24-h-Profil verwenden denselben Helfer, dieselben Gelb-/Grau-Farben, dieselben vier Stärken und dieselbe Tag-/Nacht-Semantik.
- Das 24-h-Profil übergibt dem gemeinsamen Helfer seine bereits per `profileXForEpoch` bestimmte Stundenposition. Dadurch bleibt die senkrechte Zeitachse über Wetter, Sonne/Wolken und alle Messparameter exakt synchron.
- H/M/L bleiben unverändert als drei graue Intensitätsbänder unter der neuen Gesamt-Leiste bestehen.
- Desktop, iPhone/iPad Hoch- und Querformat nutzen denselben React/Vite-Fachkern; es gibt keinen separaten iOS-Pfad.
- Keine Forecast-, KNMI-, Cache- oder Worker-Fachlogik wurde verändert.

## Regression

`scripts/test-weather-profile-skybar-pills-097723.mjs` schützt die gemeinsame Skybar-Implementierung, die exakte Profil-Zeitprojektion, den Wegfall des parallelen Gesamt-Graubands, H/M/L und die 80-%-Füllopazität der Wertepillen.
## KNMI EPS – Abschnitt 4/4 Aktivierungsprüfung

`MID_KNMI_HARMONIE_EPS_ACTIVATION_AUDIT_0.9.77.23.md` dokumentiert die reale Runtimeprüfung. Der vorhandene Python/ecCodes-Decoder kann nicht unverändert in Cloudflare Python Workers betrieben werden. Zusätzlich wurde jedoch ein neuer kostenfreier Forschungspfad identifiziert: fokussierter ecCodes-Wasm32/MEMFS/Nearest-Point-Build und – falls 10 ms HTTP-CPU nicht reichen – ein asynchroner Cloudflare-Queues-Free-Consumer mit numerischem KV-Resultcache. `MID_KNMI_HARMONIE_EPS_WASM_FEASIBILITY_0.9.77.23.md` schützt die dafür nötigen Bundle-/RAM-/CPU-/Signed-URL-Gates. In v0.9.77.23 wird weder eine Wasm-Dependency noch eine Queue/Ressource aktiviert.

