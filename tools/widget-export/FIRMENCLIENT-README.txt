MID Wetter – Widget-Export für einen restriktiven Firmenclient
==============================================================

Ziel
----
Die PowerPoint-PNGs sollen mit aktuellen MID-Daten erneuert werden, ohne auf dem Firmen-PC
Node.js, npm, winget oder zusätzliche Software installieren zu müssen.

Empfohlener Start
-----------------
1. Den Ordner "tools\widget-export" in einen beschreibbaren Benutzerordner kopieren.
2. "Update-MID-Widgets.cmd" doppelklicken.
3. Die 12 PNGs landen standardmäßig in "Bilder\MID-Widgets" des angemeldeten Benutzers.

Sicherheitsvertrag
------------------
- keine Administratorrechte
- keine Softwareinstallation
- kein winget, Node.js oder npm
- keine Änderung von ExecutionPolicy, Registry, Firewall, Proxy oder Zertifikaten
- kein --ignore-certificate-errors und kein --no-sandbox
- Microsoft Edge nutzt die normalen Vorgaben des Firmenclients
- die lokale CDP-Verbindung läuft ausschließlich über 127.0.0.1
- alle 12 neuen Bilder werden zunächst separat validiert; erst danach werden vorhandene PNGs ersetzt
- bei Fehlern bleiben die zuletzt gültigen PNGs erhalten

Wenn die Firmenrichtlinie Headless/DevTools sperrt
--------------------------------------------------
MID versucht keine Umgehung. "Update-MID-Widgets.cmd" öffnet dann "MID-Widget-Fallback.html".
Dort stehen die 12 Live-Ansichten bereit. Eine manuelle Offline-Kopie ist mit Win+Shift+S möglich.

PowerPoint: aktuell + offline
-----------------------------
Wenn die installierte Office-Version die Option anbietet, die PNGs über
"Einfügen und verknüpfen" statt nur "Verknüpfen" einfügen. Dadurch bleibt eine eingebettete
Kopie für Offline-Nutzung in der Präsentation, während die Verknüpfung beim Aktualisieren auf
denselben Dateinamen den neuesten Stand übernehmen kann. Unternehmensrichtlinien für externe
Links bleiben maßgeblich.

Dateinamen
----------
wiesbaden-kompakt-5d-light.png
wiesbaden-kompakt-7d-light.png
wiesbaden-kurve-5d-light.png
wiesbaden-kurve-7d-light.png
kuerecik-kompakt-5d-light.png
kuerecik-kompakt-7d-light.png
kuerecik-kurve-5d-light.png
kuerecik-kurve-7d-light.png
malatya-kompakt-5d-light.png
malatya-kompakt-7d-light.png
malatya-kurve-5d-light.png
malatya-kurve-7d-light.png
