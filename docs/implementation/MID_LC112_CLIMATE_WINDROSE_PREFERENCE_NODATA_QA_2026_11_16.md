# MID LC 1.12 · Issue #508 – Klima-Windrose / NoData / Anzeigepräferenz

**QA DRAFT – keine Release-, Browser- oder iOS-Abnahme.** Eingangs-Source: `main=mid-stable=a78465b655d25cafc9ecc0390080694cb7aca957`, freigegebene Version `v0.9.85.486`. Änderungen sind strikt isoliert; andere derzeitige PRs (LC #858, Karten #861, Design #859/#860, Release-Sicherheit #839) werden weder übernommen noch geändert.

## Reproduzierbarer Codebefund
In `src/ClimatePanel.tsx` überschreibt ein Effect eine ausdrücklich gespeicherte Ansicht `ClimatePanel.mode=gust` dauerhaft mit `wind`, sobald zeitweise keine Böenwerte vorhanden sind. Bei später wieder verfügbaren Böendaten kommt die Nutzerwahl dadurch nicht zurück. Außerdem interpretierte `Number(null)` einen fehlenden Wert als `0`, u. a. bei richtungsbezogenen Klima-/Wind-/Böenwerten. Eine fehlende Windrichtung konnte dadurch zu einem Nord-Sektor werden. Das verletzt die Pflicht, Missing/NoData nicht als 0 zu interpretieren.

## Scope
- Gespeicherten Modus niemals aus Verfügbarkeits-Effekten ändern; der angezeigte Modus ist ein fachlich begründeter, nur temporärer Fallback. Beim Wiedereintritt gültiger Böen-Richtungsdaten erscheint die gespeicherte Böenansicht wieder.
- Windrosensektoren basieren ausschließlich auf originalen, endlichen Windrichtung-/Geschwindigkeits-Paaren. Richtung muss innerhalb 0–360° liegen; gültige Nullen bleiben echt, ungültige/fehlende Daten werden nicht als windstill oder Nord behandelt.
- Mittelwert nur aus tatsächlich darstellbaren Paaren; beim Klima-Datensatz optionale Böenwerte ohne null-zu-null-Coercion. Bewölkungs-Anteile interpretieren fehlende Werte ebenfalls nicht als 0%.
- Bei unerfüllter Böenpräferenz erscheint eine beschreibende, sichtbare Statusmeldung; vorhandene Auswahlkeys, Legendenfarben, Varianten, meteorologische Datenabrufe und amtliche Warnungen bleiben unverändert.
- Neue Vitest-Unit-Prüfungen für die temporäre Auswahl, Null/NaN/Infinity, echte 0, die Richtungsgrenzen und valide Wind-Max-Fallbacks.

## Ausstehende Gates
Keine lokale Full-Source-/Core-/Heavy-Abnahme und keine tatsächliche Browsermatrix 320/390/430/834/1024/1440, Light/Dark, Touch-/Keyboard-/VoiceOver-Verifikation auf diesem isolierten QA-Branch behauptet. Erst nach unabhängigen Checks, selektiver SHA-/Hunk-Integration in den finalen Leit-Chat-Kandidaten sowie bestehenden vollständigen Release-/Security-Gates kann eine Veröffentlichung geprüft werden. Release-Sicherheitsarbeit #740 bleibt beim Spezialchat.
