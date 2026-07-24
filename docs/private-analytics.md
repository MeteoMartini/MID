# Private Zugriffsauswertung in MID

MID lädt Cloudflare Web Analytics ausschließlich im Produktionsbetrieb. Die
öffentliche Site-Kennung wird aus `public/analytics-config.json` gelesen. Fehlt
dort ein gültiger Token, wird keine Verbindung zum Analytics-Beacon aufgebaut.

## Cloudflare vorbereiten

1. In Cloudflare **Web Analytics** öffnen und die öffentliche MID-Adresse als
   Website hinzufügen.
2. Bei einer über Cloudflare geleiteten Domain die **automatische
   Cloudflare-Einfügung deaktivieren** und die manuelle JS-Snippet-Installation
   wählen. Andernfalls könnte Cloudflare den Beacon schon vor der lokalen
   MID-Ausnahme einfügen.
3. Aus dem angezeigten Snippet nur den Wert hinter `"token"` kopieren.
4. In GitHub unter **Repository → Settings → Secrets and variables → Actions →
   Variables** die Repository-Variable
   `VITE_CLOUDFLARE_ANALYTICS_TOKEN` anlegen.
5. Den einmaligen Installationsworkflow starten. Er schreibt die Site-Kennung
   als `public/analytics-config.json` in das MID-Release.

Der Site-Token ist keine geheime Zugangsberechtigung. Er ist Bestandteil des
öffentlich ausgelieferten Cloudflare-Beacon-Snippets. Die Auswertung selbst
bleibt ausschließlich im geschützten Cloudflare-Konto.

## Eigene Geräte ausschließen

Auf jedem eigenen Browser beziehungsweise jeder installierten MID-PWA einmal
folgende Adresse aufrufen:

```text
https://DEINE-MID-ADRESSE/?mid-analytics=internal
```

MID speichert die Ausnahme lokal für diesen Browser und entfernt den
Steuerparameter sofort wieder aus der sichtbaren Adresse. Von diesem Browser
wird der Cloudflare-Beacon anschließend nicht mehr geladen.

Die Zählung lässt sich auf einem Gerät wieder aktivieren mit:

```text
https://DEINE-MID-ADRESSE/?mid-analytics=external
```

Die Kennzeichnung ist geräte- und browserbezogen. Sie muss auf iPhone, iPad,
Desktop-Browser und einer installierten PWA jeweils separat gesetzt werden.

## Datenschutz und Grenzen

- MID setzt für diese Funktion selbst keine Cookies.
- In lokaler Entwicklung wird der Beacon grundsätzlich nicht geladen.
- Fehlt der Token oder ist er formal ungültig, bleibt Analytics vollständig aus.
- Inhaltsblocker können JavaScript-basierte Besuche aus der Statistik entfernen.
- Es gibt in MID keine öffentliche Statistikseite und keinen Besucherzähler.