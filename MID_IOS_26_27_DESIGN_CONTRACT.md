# MID – iOS 26/27 Designvertrag

Stand: v0.9.84.34

## Ziel

MID nähert die Web-/PWA- und Capacitor-Oberfläche dem aktuellen Apple-Designsystem an, ohne meteorologische Informationsdichte, Parameterfarben oder Plattformkonsistenz zu opfern. Die Umsetzung bleibt funktional und zugänglich; dekorative Effekte dürfen die Wetterinformation nicht dominieren.

## Verbindliche Grundsätze

- Liquid-Glass-artige Materialien gehören primär in die **Funktions- und Navigationsebene**: Bottom Tabs, kompakte Toolbars, Drawer-/Popover-Köpfe und ausgewählte schwebende Controls. Wetterkarten, Prognosekarten und Messwertflächen bleiben Inhaltsebene und verwenden ruhige Standardmaterialien.
- Auf Mobilgeräten wird die untere Hauptnavigation als inset, safe-area-fähige schwebende Steuerleiste ausgeführt. Im Querformat wird sie flacher; Tablet/Desktop dürfen weiterhin die besser geeignete Sidebar-/Desktopnavigation verwenden.
- MID-Parameterfarben behalten ihre fachliche Bedeutung. In Navigations- und Glass-Flächen wird Farbe sparsam eingesetzt; primär erhält der aktive Zustand den MID-Akzent. Status- und Gefahrenfarben bleiben semantisch getrennt.
- Light/Dark Mode, erhöhte Kontraste und reduzierte Transparenz müssen ohne Informationsverlust funktionieren. Bei `prefers-reduced-transparency` wird das Material ausreichend opak; bei `prefers-contrast: more` werden Konturen und Auswahlzustände verstärkt.
- Touchziele, Safe Areas, Dynamic-Type-/Textskalierungsverträglichkeit und Reduced Motion bleiben gegenüber rein optischen Effekten vorrangig.
- Glas-/Blur-Effekte dürfen weder Karten-/Radarperformance noch Scrollen oder Akkuverbrauch merklich verschlechtern. Auf große Inhaltsflächen werden sie deshalb nicht appweit ausgedehnt.

## Native Weiterentwicklung

Bei einer späteren stärkeren nativen iOS-Ausprägung sollen systemeigene Tab-/Toolbar-Komponenten und die jeweils aktuellen Apple-Icon-Werkzeuge bevorzugt werden. Die PWA/Capacitor-CSS-Schicht imitiert keine privaten Apple-Effekte pixelgenau, sondern überträgt die öffentlich dokumentierten Hierarchie-, Material-, Farb- und Accessibility-Prinzipien auf die bestehende MID-Architektur.
