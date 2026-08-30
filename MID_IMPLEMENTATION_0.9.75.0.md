# MID v0.9.75.0 – 24-h-Wetterprofil Story Axis

## Ergebnis

Das überarbeitete 24-h-Wetterprofil ist im gemeinsamen Browser-/PWA-/iOS-Kern
integriert. Grundlage ist der vom Nutzer nachgereichte letzte Build-Stand
v0.9.74.10.

## Umsetzung

- Eine zentrale Funktion `profileXForEpoch` richtet Wetterband,
  Sonnenereignisse und sämtliche Parameter auf derselben Zeitgeometrie aus.
- Stundenraster und Auswahlcursor laufen vom Wetterband bis zu den Hazards.
- Bewölkung wird als vier schmale, kontinuierlich gefadete Graubänder in der
  Reihenfolge Gesamt/H/M/L dargestellt.
- Die rechte Wolken-Prozentbeschriftung wurde vollständig entfernt; exakte
  Werte bleiben in den Einzeldaten erhalten.
- Die Luftdruckbahn wurde vergrößert und die Kurve kontrastreicher ausgeführt.
- Die bestehende responsive Hochformat- und Querformat-Master-/Detailansicht
  bleibt erhalten.

## Release- und Plattformgrenze

- Funktionsrelease: `0.9.75.0`.
- Gemeinsamer React/Vite-Build für Browser, PWA und Capacitor-iOS; kein Fork.
- Worker-Fachlogik unverändert; nur Versionssynchronisierung.
- Manueller Worker-Upload ist nicht erforderlich.

## Qualitätssicherung

- Bestehende semantische Wetterprofiltests wurden auf den neuen Vertrag
  aktualisiert.
- `scripts/test-weather-profile-story-axis-09750.mjs` schützt die neue
  Zeitachsen-, Wolken-, Luftdruck- und Responsive-Semantik verbindlich.
