# MID v0.9.85.427

- PWA-Installation lädt byteidentische Markenbilder einmal; alle bisherigen URLs bleiben offline verfügbar und SHA-/Build-geprüft.
- Kontrollierte Updates aktivieren die neue Shell ohne gegenseitiges Warten zwischen Worker-Aktivierung und Navigation; Healthy-Bestätigung und Rückfall bleiben erhalten.
- Der bestehende Revisionsworkflow sichert dateigenaue Budgetberichte mit Größen, Kategorien und SHA-256, auch bei Budgetfehlern. Die unveränderte Gesamt-gzip-Grenze bleibt separat überschritten.
