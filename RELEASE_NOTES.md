# MID v0.9.85.460

## Änderungen
- RUC: Für die sichere Produktivverarbeitung werden die native Vierstunden-Frischeprüfung, nachvollziehbarer Rollback/Health-Status und identische geschützte main-/mid-stable-SHAs vor einer Veröffentlichung geprüft.
- Der offizielle Python-ecCodes-Decoder wird in beiden RUC-Jobs über seinen nativen Selbsttest verifiziert. Der bisherige zusätzliche Ubuntu-apt-Netzabruf entfällt; die Meteorologiedaten bleiben unverändert.
- Die rein diagnostische GitHub-Laufzeitmessung fängt vorübergehende HTTP 502/503/504 mit höchstens zwei begrenzten Wiederholungen ab. Fehlende Daten sowie Berechtigungs- und andere HTTP-Fehler bleiben Fehler.
- Der historisch belegte Veröffentlichungsstand v0.9.85.459 ist in der Source-of-Truth-Dokumentation nachgetragen.

- Die verpflichtende Karten-Browsermatrix wird nach realem GitHub-Source-Laufzeitnachweis ohne Testverlust von 10/6/8 auf 10/7/7 Fälle umverteilt. Alle 24 Geräte-/Theme-/Designfälle sowie die separaten 20 Speicherzyklen bleiben unter unveränderten Limits erforderlich.

## Unverändert
Keine zusätzliche kostenpflichtige Infrastruktur, keine Änderung an den amtlichen Wetterwarnungen, NoData, Zeit-/Einheiten-/Akkumulationssemantik, erlaubten Lizenzen oder bestehenden Source-/Bot-/Installer-/Worker-/Pages-/Stable-Gates.

## Freigabe und noch offene Punkte
Aus den SHA-verifizierten QA-Drafts #750 (RUC P4) und #771 (Release-Diagnostik) auf Basis der veröffentlichten .459 zusammengestellt. Vollständig native ICON-D2-Vollgebietsdaten erfordern weiterhin einen echten geschützten DWD-SLSA-Signer-Lauf, 73 SHA-geprüfte Dateien, öffentliche Pages-/Kartenabnahme und Sölden/Köln/NoData-Verifikation. Keine reale iOS-/VoiceOver-Abnahme behauptet. Veröffentlichung erst nach sämtlichen Release-Gates.
