# Designaudit A3 – Anbieterlegenden im WMS-Kartenbereich (gesicherter Draft)

Basis: vollständig veröffentlichte v0.9.85.389 `6e449be3baf13e9c33ec206864189dd4b580d482`. Die v0.9.85.390-Source-Prüfung #41244176018 ist grün; ihr Release-Installer läuft separat. Diese Änderung ist **kein .391-Release** und besitzt bewusst keine vorweggenommene Versionsnummer in den Spiegeln. Vor der Integration auf dann aktuelle Stable erneut sämtliche SHAs und parallelen PRs überprüfen.

## Quellbefund
`ModelMapScaleLegend` und `mapScaleSvg` teilen für native Karten bereits dieselbe Farbskala, WMO-Symbole/Cloud-Produkte besitzen gesonderte Fachlegenden. Für externe DWD-/ECCC-WMS-Produkte zeigt `UnifiedWeatherMap` bisher keine Original-Farblegende. Die Nutzer können providerdefinierte Farbklassen nicht transparent nachvollziehen.

## Umsetzung (nicht produktiv freigegeben)
Ein erlaubter, aus der WMS-Produktliste entnommener Layer und ein syntaktisch erlaubter bereits ausgewählter Style erzeugen per bestehendem `weatherMapWmsProxy` einen `GetLegendGraphic`-Aufruf; kein neu freizugebender Host, keine ungeprüfte synthetische Skala, keine Warnfarben. Der Worker hat einen allowlist-gebundenen GetLegendGraphic-Proxy und strikte Bild-Content-Type-Kontrolle. Die UI bietet ein 44px-Disclosure mit Lade- und Fehlerzustand, native und WMS-Legenden bleiben getrennt und es wird keine Anbieterlegende vor erfolgreich dargestellten WMS-Kacheln eingeblendet. Der gewählte Produkt-/Stil-Key erzwingt eine neue Bildidentität bei Wechsel.

## Fachliche Grenzen und QA
GetLegendGraphic ist bei WMS optional und kann für einzelne Produkte/Styles fehlen; Fehler werden ausdrücklich als nicht verfügbare Legende kommuniziert. Anbieter-PNG ist noch keine vollständige WCAG-2.2-AA-Texttabelle; alternative barrierefreie Klassengrenzen müssen aus verifizierten Original-Metadaten stammen und sind nicht frei zu schätzen. Kein Export einer externen WMS-Karte behauptet. Adversarielle URL-/Allowlist-/Provider-/Style-Tests in bestehender Pflichtregression `scripts/test-unified-map-layers-0985167.mjs`, beide Inventare unverändert 1059. Vor Release: reale WMS-Readbacks, Light/Dark/320–1920px, Tastatur/Touch/Browser-, iOS-/VoiceOver- und Worker-/Pages-Gates belegen. Keine Änderung an RUC, amtlichen Warnungen oder Datenwerten.
