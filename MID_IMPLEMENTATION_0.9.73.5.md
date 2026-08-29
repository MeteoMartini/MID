# MID v0.9.73.5 – Release-Gate-Hotfix für RUC/Favoriten

## Anlass

Run #756 bestätigte TypeScript und Vite für v0.9.73.4, brach aber an drei Regressionen ab. Die Fachlogik der RUC-Optimierung und des Favoriten-Recovery-Fixes blieb dabei funktionsfähig; betroffen waren ausschließlich ein historischer Quelltext-Namensvergleich und die geschützte Workflow-Spiegelgrenze des Release-Installers.

## Korrekturen

- Der historische Extremwetter-Persistenztest akzeptiert den aktuellen semantischen Spiegelvergleich `localRevision > mirroredRevision` statt einen veralteten lokalen Variablennamen hart zu verlangen. Die Schutzwirkung bleibt unverändert.
- Die RUC-Workflowdateien bleiben byteidentisch zum bereits produktiven administrativen Workflow. Die beiden für die Optimierung nicht erforderlichen ENV-Zeilen wurden entfernt.
- Downloadparallelität und Fortschrittsausgabe bleiben vollständig im Fetcher gekapselt: `MID_RUC_DOWNLOAD_WORKERS` besitzt dort den Default 8 und Fortschrittsmeldungen verwenden `flush=True`. Dadurch ist keine `.github`-Änderung für die Beschleunigung nötig.
- Die eigentliche v0.9.73.4-RUC-Optimierung und der Favoriten-Recovery-Fix bleiben unverändert erhalten.

## Worker / Kosten / Apple

Keine fachliche Worker-Änderung, kein R2, keine neue Cloudflare-Ressource und keine Apple-Capability/Signierung.
