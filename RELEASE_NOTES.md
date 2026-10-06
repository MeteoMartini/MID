# MID v0.9.85.185

- Das Same-Origin-DNS-Gate verwendet jetzt ausschließlich das separate Repository Secret `CLOUDFLARE_DNS_API_TOKEN` für den bestehenden `www.midwx.app`-CNAME.
- Worker-Upload, Worker-Promotion und die Same-Origin-Workers-Route verwenden weiterhin den bestehenden `CLOUDFLARE_API_TOKEN`; DNS- und Worker-Rechte bleiben damit strikt getrennt.
- Fehlt der separate DNS-Token oder besitzt er nicht die erforderliche zonenbegrenzte Berechtigung, stoppt der Release weiterhin vor Pages und Stable-Promotion. Es gibt keinen breiter berechtigten Fallback.
- Meteorologische Datenlogik und Darstellung bleiben unverändert.
