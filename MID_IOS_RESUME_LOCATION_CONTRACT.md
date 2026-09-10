# MID iOS Resume & letzter Ort – verbindlicher Vertrag

## Ziel
Beim Wechsel in den Hintergrund und bei der Rückkehr in die iOS-/Capacitor-/PWA-App bleibt der zuletzt **in dieser App ausgewählte Ort** aktiv. Ein Resume darf weder auf den Standardfavoriten noch auf den ersten Favoriten umschalten.

## Standortautorität
- `mid:lastLocation` ist eine gerätelokale Nutzerentscheidung und wird nicht über den Geräteverbund ersetzt oder gelöscht.
- `mid:lastTrackedLocation` ist die physische Position des jeweiligen Geräts und ist ebenfalls gerätelokal.
- Favoriten, Gruppen und gespeicherte Standortprofile bleiben weiterhin portabel und synchronisierbar.
- `mid:lastLocation:updated-at` ist die semantische Revision des aktiven Orts. Der IndexedDB-Durability-Spiegel darf einen jüngeren nativen Standort nicht anhand eines bloßen technischen Mirror-Zeitstempels überschreiben.
- Bei älteren Installationen ohne Standortrevision hat der vorhandene native `localStorage`-Ort Vorrang, sofern dessen Spiegel nicht als unbestätigter Recovery-Schreibvorgang markiert ist.

## Resume und Geräte-Sync
- Reale und von WKWebView ergänzte `visibilitychange`-Impulse dürfen keinen parallelen portablen Vollabgleich starten.
- Der portable Resume-Abgleich ist in-flight-entdoppelt und für Sichtbarkeitsimpulse auf mindestens 15 s Abstand begrenzt; lokale Änderungen behalten ihren 3-s-Pushpfad.
- Ein zulässiger Remote-Abgleich darf die gerätelokalen Standortschlüssel nicht verändern. Ein danach notwendiger UI-Reload startet daher wieder am zuvor ausgewählten Ort.

## Startup-Preload
MID darf Prognosedaten weiterhin sofort parallel vorladen. Nach StorageSafety/Persistenz wird die Vorladung jedoch nochmals gegen den tatsächlich wiederhergestellten gerätelokalen Ort abgeglichen. Ist der Ort unverändert, wird der bestehende Promise geteilt; weicht er ab, wird der falsche Preload abgebrochen und der korrekte Ort geladen.

## Regression
`scripts/test-ios-resume-location-preservation-098425.mjs` schützt diesen Vertrag verbindlich.
