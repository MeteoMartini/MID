# MID 0.9.67.1

## iOS-Safe-Area für beide Kopfzeilen

`viewport-fit=cover` ließ die Browser-/PWA-Oberfläche bis unter die iOS-
Statusleiste reichen. Der in 0.9.67.0 ergänzte Abstand galt jedoch nur für den
nativen Capacitor-Laufzeitmarker. Dadurch lagen sowohl die Hauptkopfzeile am
Seitenanfang als auch die beim Scrollen haftende Sektionsnavigation unter Uhr,
Mobilfunk- und Batteriesymbolen und waren teilweise nicht bedienbar.

Die vier Safe-Area-Werte sind nun appweit definiert. Browser, installierte PWA
und native Container erhalten den oberen Abstand bereits am App-Rahmen. Die
mobile Schnellnavigation verwendet denselben oberen Inset als Sticky-Abstand.
Auch Sektionsdrawer und mobile Vollbild-Einstellungen schützen alle vier
Geräteränder. Die nichttransparente iOS-PWA-Statusleiste verhindert zusätzlich,
dass Webinhalte absichtlich unter die Systemleiste gelegt werden.

Die Browser-/PWA-App und das Capacitor-iOS-Projekt bleiben derselbe Produktkern;
Wetter-, Worker-, Persistenz- und Modelllogik ändern sich nicht.

## Regression

`scripts/test-ios-safe-area-header-096671.mjs` schützt Hauptkopfzeile, haftende
Sektionsnavigation, Drawer, Einstellungsdialog, Statusleistenmodus, gekoppelte
Versionen und den synchronen kanonischen CSS-Build.
