# MID 0.9.70.0 – kostenfreier DWD-RUC-Produktionspfad über GitHub Pages

## Ziel

Der bereits vorbereitete DWD ICON-D2-RUC/RUC-EPS-Fachkern wird ohne Cloudflare-R2-Aktivierung produktionsfähig. Der kostenlose Pfad verwendet ausschließlich DWD Open Data, Standard-GitHub-Runner des öffentlichen MID-Repositories und die bereits vorhandene GitHub-Pages-Auslieferung. R2 bleibt eine optionale spätere Speicheroptimierung und wird nicht aktiviert.

## Speicherprofil `pages-free-v1`

Der ecCodes-Vorprozessor bleibt unverändert die einzige GRIB-Decodierstufe. Nach dem vollständigen Lauf werden für GitHub Pages nur drei fachlich erforderliche Produkte veröffentlicht:

1. deterministischer RUC-0–14-h-Datensatz,
2. voraggregierte RUC-EPS-Wahrscheinlichkeiten/Mittel/Q25/Q50/Q75,
3. räumlicher Punkt-Lookup.

Der große native EPS-Membercube wird im kostenlosen Pages-Profil bewusst nicht veröffentlicht. Die kanonische Kurzfristwahrscheinlichkeit verliert dadurch keine Information, weil sie bereits im Vorprozessor aus allen verfügbaren EPS-Membern gebildet wird. Eine exakt eventbezogene native Memberauswertung fällt bei fehlendem R2-/Punktadapter wie bisher auf ICON-D2-EPS innerhalb derselben DWD-Ensemblefamilie zurück.

Die drei Binärprodukte werden in unveränderliche Chunks aufgeteilt. Der Worker lädt je Zielpunkt nur den benötigten Chunk und ist damit nicht von HTTP-Range-Verhalten des GitHub-Pages-CDN abhängig. `latest.json` bleibt der kleine wechselnde Pointer.

## GitHub-Pages-Grenzen und Schutz

Der veröffentlichte MID+RUC-Stand wird vor Deployment auf weniger als 950 MB begrenzt. Damit bleibt ein Sicherheitsabstand zum aktuellen 1-GB-Limit von GitHub Pages. Normale MID-Releases bewahren einen bereits veröffentlichten `pages-free-v1`-Snapshot: Vor jedem der drei Pages-Deploymentversuche werden `latest.json` und sämtliche darin manifestierten immutable Chunks parallel geladen, Größe und SHA-256 geprüft und erst danach in den neuen `dist/ruc`-Baum übernommen. Bei aktivierter RUC-Pipeline bricht ein Release fail-closed ab, wenn der produktive RUC-Snapshot nicht sicher erhalten werden kann.

## Worker

- Standardquelle für den kostenlosen Datensatz: `https://midwx.app/ruc/`; optional überschreibbar über `MID_DWD_RUC_STATIC_BASE_URL`.
- R2 bleibt bevorzugter Backendpfad, falls es irgendwann ausdrücklich eingerichtet wird.
- Ist R2 nicht bereit, wird `pages-free-v1` verwendet.
- `ruc-health` meldet das tatsächlich aktive Backend (`r2` oder `pages`) und betrachtet beim Pages-Profil native EPS-Member ausdrücklich als optional/absichtlich nicht publiziert.
- Best Match, ICON-D2 und ICON-D2-EPS bleiben unverändert sichere Fallbacks.
- GRIB/BUFR wird weiterhin niemals im Worker dekodiert.

## Aktivierung

Die Stundenpipeline bleibt bis zur bewussten technischen Aktivierung über die bestehende Repository-Variable `MID_RUC_PIPELINE_ENABLED=true` inaktiv. Diese Variable ist für den Pages-Pfad **kein Kosten-Gate mehr**. Es werden keine R2-Secrets, keine neue Cloudflare-Ressource und keine kostenpflichtige Speicherung benötigt.

## Regression

- `tools/ruc/test_prepare_ruc_pages.py`: Chunkprofil, Ausschluss nativer EPS-Member und statisches Manifest.
- `scripts/test-ruc-pages-free-storage-09700.mjs`: Worker-Runtime für Pages-Health, Lookup, deterministische Punktwerte, EPS-Zusammenfassung sowie Verbot von Range-Abhängigkeit.
- Bestehende R2-, RUC-Fusion-, Worker-, Forecast- und iOS-Verträge bleiben als optionale/fallbackfähige Pfade bestehen.

## Tagesansicht – Niederschlagswahrscheinlichkeit und Windpfeile

Der Screenshot-Fehler in der stündlichen Tagesansicht hatte zwei getrennte Ursachen:

- Die **Niederschlagswahrscheinlichkeit** wurde bisher nur gezeichnet, wenn keine Niederschlagsbalken sichtbar waren. Sobald Regen-/Schnee-/Schauerbalken vorhanden waren, unterdrückte `showProbability && !showRainBars` die Kurve, obwohl die 0–100-%-Achse weiterhin sichtbar blieb. Die Wahrscheinlichkeitskurve wird jetzt immer bei aktivem Wahrscheinlichkeitsparameter gezeichnet und erhält einen kontrastierenden Halo, damit sie auch über Niederschlagsbalken lesbar bleibt.
- Die **Windpfeile in der dunklen Ansicht** wurden durch eine später geladene, unabsichtlich globale Cockpit-CSS-Regel wieder auf `#20374d` gesetzt. Diese Regel ist jetzt strikt auf das Kurzfrist-Cockpit begrenzt. Die appweite SVG-Windrichtung verwendet im dunklen Design einen hellen, leicht konturierten Pfeil und im hellen Design einen dunklen Gegenwert.

`test-day-detail-probability-wind-contrast-09700.mjs` schützt beide Ursachen einschließlich des generierten Styles-Aggregats gegen Regression.

## Validierung des Release-Kandidaten

Erfolgreich lokal geprüft wurden Worker-Syntax und die gezielten Verträge für Mitteleuropa-Domain/Kartenkontext, Tagesansicht-Niederschlagswahrscheinlichkeit, Hell-/Dunkel-Kontrast der Windpfeile, RUC-Pages-Free-Runtime und -Chunking, RUC-Fusion/-Health, Worker-Auto-Deploy, Versions-/Aggregate-Vertrag sowie die statischen Browser/PWA-/Capacitor-iOS-Grenzen. Die bestehenden Tagesdetail-/Wind-/Niederschlagsregressionen wurden zusätzlich gezielt ausgeführt und bestanden.

Der vollständige TypeScript-/Vite-Produktionsbuild bleibt bewusst Release-CI-Gate: `npm ci` konnte in der aktuellen isolierten Laufzeit den npm-Registry-Download nicht vollständig abschließen; der Arbeitsbaum enthält daher kein freigabefähiges lokales `node_modules`. Eine unvollständige Dependency-Installation wird nicht als erfolgreicher Build ausgegeben. Der normale Installer führt vor Pages/`mid-stable` weiterhin `npm ci`, TypeScript, Vite-Build, Worker-Syntax und die vollständige Regression aus und bricht bei einem Fehler fail-closed ab.

## Administrativer Gate vor Installation

Vor dem Upload von `MID-professional-replacement.zip` müssen `install-mid.yml` und `mid-ruc-preprocess.yml` einmal explizit nach `.github/workflows` synchronisiert werden. Der bestehende v0.9.69.6-RUC-Workflow auf `main` publiziert noch nach R2; der v0.9.70.0-Workflow stellt stattdessen den kostenfreien GitHub-Pages-Pfad bereit. Der Release-Installer darf `.github` gemäß Projektvertrag nicht selbst verändern.
