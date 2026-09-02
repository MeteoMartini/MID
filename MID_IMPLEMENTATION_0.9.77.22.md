# MID v0.9.77.22 – KNMI HARMONIE EPS Punktdecoder (Abschnitt 3/4)

## Umsetzung

- Dritter der vier verbleibenden KNMI-HARMONIE-EPS-Hauptabschnitte: `tools/knmi_eps_decoder/` liefert einen externen, containerfähigen GRIB1-Punktdecoder.
- Der Decoder akzeptiert ausschließlich das vom produktiven MID-Worker erzeugte Rolling-Manifest; kein eigenes KNMI-Listing, kein zweiter TAR-Index und kein Vollarchiv-Fallback.
- Striktes HTTP-206-/Multi-Range-Gate, Host-Allowlist, Größenlimit und keine Persistenz/Protokollierung kurzlebiger Signed-URLs.
- P4a-Felder: 2-m-Temperatur, Regen, 10-m-Wind und Böen; Ausgabe °C/mm/kt im bestehenden Open-Meteo-ähnlichen Member-Schema.
- Rollender akkumulativer Regen wird je 5er-Batch am ersten gemeinsamen Gültigkeitszeitpunkt baselined und danach in stündliche Differenzen umgewandelt.
- P4a-Europe-Modellmetadaten auf den offiziellen lower-resolution DINI/EU-Vertrag korrigiert: 5,5 km und stündliche Aktualisierung.
- Kein Hosting, kein neuer Cloudflare-Dienst, kein neuer GitHub-Workflow und keine kostenpflichtige Infrastruktur aktiviert.

## Weiterer Schritt

Abschnitt 4/4 ist die reale End-to-End-Aktivierung und Verifikation des Decoders an einem bereits vorhandenen kostenfreien HTTPS-Runtimepfad oder – falls nur kostenpflichtige Optionen verbleiben – erst nach ausdrücklicher Nutzerfreigabe.
