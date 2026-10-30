# MID v0.9.85.379

## Überprüfbare Herkunft von MID-Quellprüfungen

- Ein neuer, ausschließlich manuell auf dem geschützten GitHub-`main` ausführbarer Signatur-Pilot kann die Herkunft erfolgreich abgeschlossener Quellprüfungen unabhängig über GitHub nachweisen.
- Er prüft den ursprünglichen Pull Request, das Quellcommit, alle Pflichtjobs und deren Status sowie die Übereinstimmung von `main` und `mid-stable`. Fehlende, widersprüchliche oder veraltete Belege werden abgewiesen.
- Ein signierter Beobachtungsbericht ersetzt ausdrücklich **keine** Tests, keinen Produktivbuild, kein Worker-/Pages-Gate und keine Stable-Promotion. Alle bisherigen Sicherheits- und Releaseprüfungen bleiben vollständig bestehen.
- Die bereits bekannten Wetterfunktionen und Darstellungen sind unverändert. Der zusätzliche Pilot hat keine automatischen Auslöser und verursacht keine zusätzlichen regulären Releases.

