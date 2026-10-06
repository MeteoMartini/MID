# MID v0.9.85.184

- Der bestehende Webhost `www.midwx.app` wird im Release-Gate jetzt kontrolliert über Cloudflare proxied, damit der Same-Origin-Datenpfad `/api/mid-worker` tatsächlich erreichbar ist.
- Dabei bleibt der vorhandene DNS-Zielwert unverändert; MID legt keinen neuen DNS-Record an und verändert weder TLS noch andere DNS-Einträge oder Worker-Routen.
- Warnungen, ICON-D2-RUC, Radar, Satellit und die moderne Kartenbasis können damit auch in restriktiven Unternehmensnetzen über dieselbe bereits erreichbare MID-Domain geladen werden.
- Fehlen die eng begrenzten Cloudflare-DNS-Rechte oder ist der bestehende `www`-Record nicht eindeutig, stoppt die Veröffentlichung weiterhin fail-closed.
