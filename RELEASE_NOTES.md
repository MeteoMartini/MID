# MID v0.9.85.384 – Nachvollziehbare Releasekette und CI-Laufzeit

- MID kann veröffentlichte Releaseketten zusätzlich als eine einzige, schreibgeschützte Prüfung aus Source-PR, kontrolliertem Merge, ausschließlich serverseitigem Release-ZIP, Installer, Worker/Pages und Stable-Commit untersuchen.
- Pflichtjobs, vollständige Commit-SHAs, Run-Versuche, Versionsform, zulässige Branches, fehlende und doppelte Jobs sowie ungültige Zeitstempel werden fail-closed beurteilt. Gleichzeitige Bot-/Installer-Phasen werden in der Gesamtlaufzeit nicht doppelt gezählt.
- Umfangreiche Negativtests sind in die bestehende verpflichtende CI-Timing-Regression integriert. Der Prüfer verändert weder Wetterdaten noch die Benutzeroberfläche oder die bestehende Releasepipeline.
- Die Auswertung ist eine zusätzliche Diagnose und KEINE Signatur, Build-/Testartefakt-Wiederverwendung oder Releasefreigabe. Sämtliche Source-, Installer-, Worker-, Pages- und Stable-Gates bleiben zwingend erforderlich. Issue #526 bleibt für tatsächliche Sigstore-/Artefakt- und A/B-Gleichwertigkeit offen.
