# MID-C38 · vorhandene Revisionsprüfungen und Sicherheits-Patch

## Verifizierte Ausgangsbasis

main=mid-stable=88c04410de7275010cdcf9ff14b2c26ca35479d1, v0.9.85.305. #435/#436, Source-Gate39556436409 und Installer39557997892 erfolgreich. Der Installer hat Core/iOS/Audit, alle5Heavy-Jobs, Worker-Smoketest, Pages und nicht erzwungene Stable-Promotion abgeschlossen. Worker-Version blieb gemäß bestehendem Versions-only-Vertrag0.9.85.292; produktiver RUC-Healthcheck ready/fresh. Keine physische Geräteabnahme behauptet.

Produktionslauf08UTC21.10.2026 aus39574875111: admitted=true, mapHours27, coreHours14, finalPhysicalBytes410534246, addedPhysicalBytes23032978, sourceRawUnchanged=true, codecProofUnchanged=true, mapPreparationSeconds85.73. Manifest-SHA vor Aufnahme d7d43efd5aa96bfe691baae4365548b981a1d9cd602e51ac5619ec79af5a0565, danach26424aabf76f845a919e541427404a25afce18e27111aeb7198ef76d6105d9e2. Der bestehende Publish-Gate bestätigte exakt08UTC auf Pages und Worker (542040Punkte,20EPS-Mitglieder, ageHours1.64). Dies ist ein belegter Produktionszyklus aus den originalen Actions-Logs, keine dauerhafte SLO-Historie und kein neuer unabhängiger Download des gesamten Produktionsarchivs.

## Reproduzierter Revisionsbefund #437

Nächtliche Revision39570739442: alle1010Tests ausgeführt, genau ein Importfehler wegen fehlendem numpy in der Revisionsumgebung; zusätzlicher vollständiger npm-Audit meldete HIGH im gebündelten launch-editor von Vite8.2.2. Der frühere Installer war bereits über #436 korrigiert; die übrigen vollständigen Core-Einstiege benötigten dieselbe Umgebung.

## Korrektur

Alle vorhandenen vollständigen Core-Einstiegspunkte richten Python3.12 und tools/ruc/requirements-pages.txt ein: Source, Installer, Replit-Handoff, Deploy, Dependency-Audit, Revision-Install/CI/Nightly und Analytics. Bereits vorhandene Trigger, Namen, Rechte und eigentliche Tests bleiben erhalten. Zwei bereits aktive, bislang nicht kanonisch verwaltete Workflow-Dateien erhalten kanonische Spiegel; die Zahl aktiver Workflow-Dateien steigt nicht. Ausschließlich expliziter Sync. Bootstrap-Regression scannt jeden tatsächlichen Core-Job; isolierte Heavy-Jobs behalten ihre bestehende Matrix.

Vite8.2.2→8.2.4 ist ein kompatibler Sicherheits-Patch derselben8.2-Reihe. Offizielle Quellen:
- https://github.com/advisories/GHSA-587h-7wmj-h5pm
- https://github.com/advisories/GHSA-698v-4r3x-3vcv
- https://github.com/advisories/GHSA-r825-w8mm-5pxw
- https://github.com/vitejs/vite/blob/v8.2.4/packages/vite/CHANGELOG.md

Context7 bestätigte den Vite-Patch-/Oxc-/Lightning-CSS-/Rolldown-Vertrag; die konkrete Patchfreigabe stammt aus den versionierten Anbieterquellen und npm-Registry-Metadaten. Node22.16 erfüllt die Anbieter-Engine. Kein Major, kein Override, kein audit-fix --force; plugin-react6.1.1 und alle Produktionspaketversionen bleiben. Lockfile mit npm10.9.2 ohne legacy-peer-Reklassifizierung erzeugt; vorhandene npm-10-devOptional-Regression bleibt unverändert. Source-Gate und Installer führen im vorhandenen Audit-Schritt zusätzlich audit:all als HIGH/CRITICAL-Gate für den Entwicklungswerkzeugpfad aus; der getrennte Produktionsaudit bleibt erhalten. Keine Unterdrückung der bekannten moderaten Befunde. Exakte Vite-Erwartungen in bisherigen Vertragstests folgen dem dokumentierten Sicherheits-Patch; andere Paketpins und historische MID-Meilensteine bleiben unverändert.

## Validierung

Reproduzierbares npm-ci, Types/Produktionsbuild, Workflow-Mirror-/Bootstrap-/Self-Modification-/Action-Pin- und Upgrade-Policy-Prüfungen bestanden. Vollständiger Audit:0HIGH/CRITICAL,3bekannte moderate Befunde im separaten Capacitor/xcode/uuid-Dev-Pfad; Produktionsaudit ohne Befund. Erste lokale Kernrunde erkannte Lockfile-Metadaten, eine korrigierte nicht betroffene Geolocation-Erwartung und die abgelaufene temporäre Python-Testumgebung; diese drei Ursachen wurden gezielt korrigiert, keine Prüfung deaktiviert. Abschließende1007-Core-Runde vollständig bestanden. Source-/Installer-Gates bleiben vor Veröffentlichung erforderlich. Lokaler Chromium141-Download scheiterte an der Übertragung; die vollständige verpflichtende Browsermatrix bleibt im bestehenden Source-/Installer-Gate. Keine lokale neue Browserabnahme behauptet.

ECMWF0p1 bleibt unter #433/#434 gesondert vorbereitet. Der genaue Chat „MID-RUC Integrationsreife“ war weder über Kontext- noch Dokumentensuche vollständig abrufbar; die ECMWF-Bewertung ist ausdrücklich an Code, Originalartefakt und Issue434 gebunden. Bestehendes direktes IFS0p25-Synoptikprodukt und Open-Meteo-Prognosen bleiben erhalten.
