# MID Logo Asset Contract

## Verbindliche Markenvarianten

MID verwendet ab v0.9.74.8 genau zwei zusammengehörige Marken-Sets:

- `light`: helle, kühlweiße Ausführung für helle Oberflächen und Light Mode.
- `dark`: mitternachtsblaue Ausführung für dunkle Oberflächen und Dark Mode.

`Auto` löst die Variante gleichnamig zum wirksamen Theme auf. Eine manuelle Auswahl bleibt persistent in `mid:brandLogoVariant` gespeichert und überschreibt ausschließlich die automatische Logoauflösung, nicht das Farbdesign der App.

## Einsatzspezifische Assets

- App-/PWA-Icon: deckendes quadratisches Icon mit sicherem Plattformrand.
- Kompaktmarke: transparentes quadratisches Zeichen für App-Kopf, kleine UI-Flächen, Favicons und Widgets.
- Horizontale Wortmarke: transparente vollständige Wortmarke für Web-Bootscreen und breite Brandingflächen.
- Splashscreen: systemabhängige helle/dunkle Vollfläche im nativen iOS-Asset-Katalog.
- Social Card: statische 1200 × 630 px Vorschau für Open Graph, Twitter und strukturierte Metadaten.

Ein einzelnes Logo darf nicht mehr ersatzweise für alle Formate beschnitten oder verzerrt werden.

## Gemeinsamer Plattformkern

Browser, PWA und Capacitor-iOS beziehen die Markenassets aus demselben Professional-Quellstand. Es gibt keinen iOS-Branding-Fork. Der native Asset-Katalog darf systemabhängige Darstellungen ergänzen, aber keine abweichende Marke einführen.

## Offline- und Startvertrag

Beide Kompakt- und Wortmarken sowie die installierbaren Icongrößen gehören zum PWA-Shell-Cache. Bereits vor dem React-Start werden Theme, manuelle Logoauswahl, horizontale Boot-Wortmarke, Favicon und Apple-Touch-Icon konsistent aufgelöst.

## Regression

`scripts/test-logo-theme-assets-09748.mjs` schützt Assetabmessungen, Light-/Dark-Unterscheidung, Themeauflösung, Persistenz, Boot-/Metadatenpfade, PWA-Cache und native iOS-Asset-Kataloge. Ab v0.9.74.9 schützt `scripts/test-logo-png-integrity-09749.mjs` zusätzlich die vollständige PNG-Struktur der nativen Splash- und AppIcon-Dateien einschließlich Chunkgrenzen, CRC, IEND und dekomprimierbarer IDAT-Daten.
