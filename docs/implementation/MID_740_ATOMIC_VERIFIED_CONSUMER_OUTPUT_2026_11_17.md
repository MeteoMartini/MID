# MID #740 / PR #839 · atomare Ausgabe erst NACH sämtlichen Original-Readbacks

Stand 17.11.2026 · unabhängige Security-QA, **KEIN Installer-/Release-Cutover**.
Verifizierte Ausgangsbasis: `main=mid-stable=a78465b655d25cafc9ecc0390080694cb7aca957`, v0.9.85.486, fünf aktive Rulesets. Vorgänger-PR-HEAD `bb4be23c3125fd5e5cd654bc2c09f76426cb8819`.

## Behobene Sicherheitslücke

Der bereits vorhandene `mid-740-legacy-original-consumer-qa.mjs` akzeptierte ein vom Aufrufer festgelegtes, noch nicht vorhandenes Ausgabefilename und übergab es unmittelbar an den Downloader. Ein fehlgeschlagener Download, der nach Dateianlage wirft, konnte dadurch nicht entfernte Teilbytes hinterlassen, weil das `downloaded`-Flag erst bei regulärer Rückgabe gesetzt wurde. Mehr noch: Im normalen Pfad wurde die vollständige Datei bereits vor dem zweiten originalen GitHub-REST-/Source-/Stable-Race-Readback unter dem endgültigen Ausgabepfad sichtbar. Die darunterliegende kanonische Downloaderimplementierung verwendete zwar bereits ein temporäres File mit SHA-256-Prüfung und atomarer Umbenennung, aber die unabhängige *zusammengesetzte* Verifikation war zu diesem Zeitpunkt noch nicht abgeschlossen.

## Patch: geprüfte Bytes atomar freigeben, ohne Überschreiben

1. Vor dem Download wird das vorhandene private `0700`-QA-Verzeichnis innerhalb des bestätigten Zielparents erstellt. Nur dessen `original-actions-envelope.zip` geht an den Downloader, Python-Inspector und Original-Byte-/Git-/Source-Readback.
2. Alle bisherigen Manifest-/Git-Blob-/Source-Gate-/Producer-/Installer- und zweiten GitHub-/Stable-Readbacks müssen **vollständig** erfolgreich sein, bevor ein finaler Dateiname angelegt wird.
3. Erst anschließend versucht Node `linkSync(candidate, envelope)` im selben Dateisystem. Damit existiert die beim Aufrufer sichtbare Datei atomar als geprüfter Inode; eine schon vorhandene oder während der QA neu erzeugte Zieldatei wird **nicht überschrieben** (EEXIST → fail closed).
4. Das private QA-Verzeichnis mit Original-ZIP, Receipt und erwarteten Run-Daten wird in `finally` auch nach unvollständigen oder fehlerhaften Downloads entfernt. Ein fremder Race-Gewinner am endgültigen Ausgabepfad wird ausdrücklich **nicht** gelöscht.

Gezielte adversariale Vitest-Regressionen: unterbrochener Download nach Schreiben von Teilbytes; endgültige Datei bleibt bis nach der unabhängigen Causality-Prüfung unsichtbar; konkurrierend erzeugte Ausgabedatei bleibt unangetastet, während der Konsument sperrt. Alle bisherigen positiven und negativen Producer-/Installer-/Receipt-Tests bleiben maßgeblich.

## Geltungsbereich

Dies ist reine QA auf dem bestehenden autorisierten `chatgpt/*`-Sicherheits-Draft; keine neuen GitHub-Berechtigungen, Tokens, Release-Assets, Worker-/Pages-/iOS-Änderungen. Die isolierte Ausgabe bleibt **Post-Installer-Forensik**, ausdrücklich **kein** erfolgreiches Pre-Installer-Original-Artifact-Gate. Der Source-Producer muss zuerst als vollständiger Origin-Run existieren, danach ein unabhängiger Installer den exakt geprüften Original-Envelope **vor** Entpackung und Build verarbeiten. ZIP-only- und dist-Direktwrites nach `main`, native No-Human-Review-Regeln, Recovery-/Widget-Rolling-Ablösung und Stable-Abnahme bleiben separat offen. **NO READY / NO MERGE / NO RELEASE.**
