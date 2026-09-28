# MID v0.8.30.2

## Fehlerursache
Der Synchronisations-Worker akzeptierte standardmäßig nur die frühere GitHub-Pages-Domain. Nach dem Wechsel auf `midwx.app` wurden Geräte-Sync-Anfragen deshalb mit „Nicht freigegebener Ursprung“ abgewiesen. Eine vorhandene Cloudflare-Variable `MID_ALLOWED_ORIGINS` konnte außerdem die eingebaute Standardliste vollständig ersetzen.

## Korrektur
- `https://midwx.app` und `https://www.midwx.app` sind fest in der MID-Standard-Originliste enthalten.
- Cloudflare-Variablen ergänzen die Standardliste nur noch.
- Origins werden per `new URL(...).origin` normalisiert.
- Das Frontend nennt bei einem alten Worker ausdrücklich den erforderlichen Worker-Upload.

## Deployment
Diese Änderung ist funktional im Cloudflare Worker. `worker.js` muss aktualisiert werden. Eine Anpassung der Cloudflare-Variablen ist nicht erforderlich.
