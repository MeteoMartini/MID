# MID-C12 · Integrationsbeleg v0.9.85.144

Basis: main = mid-stable = 8e511937458ce06808f0487ce1c61441e87fe360, veröffentlicht v0.9.85.143.
Quellcheckpoint: f25fb7f85791a9ae66c39f723eb98c5978c3c53f, Tree e5fbb2e8ece29805b5b4fd3972733a74a4eddbfe; vollständig mit dem damaligen lokalen Quellbaum hashidentisch.
Integrationsbranch: codex/v0.9.85.144-weekly-uncertainty.
Source-PR: https://github.com/MeteoMartini/MID/pull/228.

## Änderungen und Herkunft

- Wochen-P25/P50/P75 aus vorhandenen stündlichen Mitgliedsabrufen, exakte Epoch-Zuordnung und erkennbare Lücken.
- Trendtext erhält den Tagesregen vor der folgenden nassen Nacht.
- Dezente P25/P75-Balkenwerte für Tmax, Tmin, Regen und Böen in 7d/14d.
- Native DWD-RELHUM-Verarbeitung korrigiert; WMS-Summenkarten beachten ihr vollständiges Zeitfenster.
- Version, Cachegeneration und erforderliche Regressionen konsistent aktualisiert.

Replit-Handoff: replit/v0.9.85.144-uncertainty-values-Handoff@6f104f93d351f8d7990db60bb0b057aab7022f53. Merge-base exakt die obige Stable-Basis; sechs lineare Commits. Vier erlaubte UI-/Testpfade; keine geschützten Änderungen. Guide, CSS und Browser-QA sind bytegleich zum Handoff; beim gemeinsamen Regressionstest bleiben auch die neuen fachlichen Stundenband-Assertions erhalten.

Erster Handoff-Gate 37013316280 war rot: Die neue Test-Erwartung verlangte „2 mm“, obwohl der bestehende Formatter korrekt „2,0 mm“ ausgibt. Folgestand 6f104f9 ändert ausschließlich diese Erwartung; keine fachliche Prüfung abgeschwächt. Handoff-Gate 37014195917 ist für den exakten Folgestand erfolgreich abgeschlossen. Replit erhält keine Produktionsfreigabe und erzeugt keinen Release.

## Verifikation des zusammengeführten Stands

Produktionsbuild und Typecheck grün; CI=true: alle 899 Regressionen bestanden. 20 Balken- und 10 Wochenkurven-Browserfälle in Hell/Dunkel bei 320–1440 px grün, keine Überschneidung oder horizontales Überlaufen. Dependency-Audit: 0 vulnerabilities. iOS-Hülle und fünf echte Python-GRIB-/Publikationstests grün. Live-Aufbereitung des DWD-09-UTC-Laufs: 48 native Raster, ca. 6,15 MB komprimiert. Alle 32 angebotenen WMS-Produkte im amtlichen Katalog; repräsentative PNGs einschließlich vollständiger Summenfenster geprüft.

## Veröffentlichungsweg

Ausschließlich Source-PR-Gate → bestehender kontrollierter Release Bot → serverseitige Paketierung → Installer → Pages → Stable-Promotion. Kein manuelles Merge-/Stable-Update und kein lokales Release-ZIP. Live version.json, Stable-SHA und Kartenmanifest sind nach Abschluss getrennt zu prüfen. Native Kartenprodukte erscheinen über die reguläre RUC-/Pages-Aufbereitung; ein laufgleicher Schedule-Guard wird nicht umgangen.

Fachliche Details: docs/implementation/MID_WEEKLY_UNCERTAINTY_0.9.85.144.md.
