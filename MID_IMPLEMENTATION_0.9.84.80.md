# MID Implementation 0.9.84.80

## Ziel

Fortsetzung des appweiten Darstellungs- und Interaktionsaudits aus MID 17.7.23/17.7.24. Dieser Releaseblock konzentriert sich auf überlagernde UI-Flächen, die trotz korrekter Basistypografie an Viewporträndern, bei dynamischen iOS-Browserleisten oder auf Touchgeräten abgeschnitten bzw. ungünstig positioniert werden konnten.

## Umgesetzt

### Trend 14d+

- Punktdetails werden nicht mehr innerhalb der Diagrammfläche absolut positioniert.
- Beide Trenddiagrammtypen verankern die Punktdetails nun über `AppPortalPopover` am auslösenden Datenpunkt.
- Positionierung wird anhand des tatsächlich sichtbaren `visualViewport` berechnet und an allen vier Viewporträndern begrenzt.
- Lange Inhalte scrollen innerhalb des Popovers; Außenklick, Escape und Touch-Dismiss bleiben zentral vereinheitlicht.
- P25–P75, P10–P90, Klimamittel und Modell-/Parameterinformationen bleiben fachlich unverändert.

### Kompositbild

- Ebenenauswahl und Daten-/Quelleninformation wurden von lokal absolut positionierten Popovern auf das zentrale Body-Portal umgestellt.
- Dadurch bleiben die Inhalte auch bei randnahen Bedienelementen und in schmalen Querformaten vollständig innerhalb des sichtbaren Bereichs.
- Popover sind intern scrollbar und verwenden die bereits etablierte zentrale Dismiss-Logik.

### Langfrist-/Witterungstrend

- Sichtbare Bedien-, Status-, Modell- und Erläuterungstexte verwenden mindestens die gemeinsame MID-Mikrotypografie.
- Historische 6–9-px-UI-Texte wurden in diesen sichtbaren Bereichen beseitigt.
- Wissenschaftliche Achsen-/Skalenbeschriftungen bleiben bewusst von der pauschalen Mindestschriftgröße ausgenommen.

### iOS / dynamische Viewports

- Favoriten-, Einstellungs-, Update- und PWA-Installationsdialoge verwenden `dvh` statt rein statischer `vh`-Grenzen.
- Vollbilddialoge beziehen Safe Areas innerhalb der 100dvh-Fläche ein; dadurch wird die Dialoghöhe nicht durch zusätzliches Backdrop-Padding über den sichtbaren iPhone-Viewport hinaus vergrößert.
- Kompakte Update-/Installationsdialoge werden mit Notch-/Home-Indicator-Abstand innerhalb des sichtbaren Viewports gehalten.
- Grobe Zeigegeräte erhalten in den neu geprüften Portalflächen weiterhin mindestens 44-px-Touchziele.

## Nicht geändert

- Wetterdaten und Quellenpriorisierung
- Modellfusion und Best-Match-Logik
- Warnschwellen und Gefahrenlogik
- Niederschlags-/Skybar-Logik
- Wetterpiktogramme
- Parameterfarben
- Worker-Fachlogik

Die Workerdateien werden ausschließlich durch die zentrale Versionssynchronisation auf denselben Releasebezeichner gebracht.
