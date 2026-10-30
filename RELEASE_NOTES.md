# MID v0.9.85.380 – Kryptografisch geprüfte Source-Beobachtung

- Der ausschließlich auf geschütztem GitHub-`main` ausführbare Source-Signaturpilot kontrolliert nun nach erfolgreicher Signatur in einem zweiten, unabhängig lesenden Job das echte Sigstore-Zertifikat, den Datei-SHA256 und die Herkunft.
- Die signierten Aussagen werden gegen frisch abgerufene PR-/Run-/Attempt-/Source-Gate- und Stable-Daten geprüft. Fehlende, falsche, abgelaufene oder doppelte Angaben blockieren sicher.
- Keine Wetter- oder UI-Änderung, keine neuen Dienste oder Abonnements, keine Freigabe zur Wiederverwendung von Build-/Test-Artefakten. Sämtliche bisherigen Source-/Installer-/Worker-/Pages-/Stable-Prüfungen bleiben unverändert.
- Echte manuelle Signatur- und Verifier-Ausführung nach Stable-Promotion als separate Betriebsabnahme erforderlich; synthetische Negativtests genügen nicht als kryptografischer Nachweis.

