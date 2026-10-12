# MID v0.9.85.245 · Open-Meteo Mehrfachabrufe und Rate-Limits

Basis: verifiziertes `main = mid-stable` `7cceaa0308912af52dd3e6d5145f686b17c390cd` (v0.9.85.244), regulärer `chatgpt/*`-Source-PR. Keine Direktänderungen an produktiven Branches.

## Fehler und Korrektur

Identische JSON-Abfragen waren an das Abbruchsignal des ersten Aufrufers gekoppelt. Der neue gemeinsame Transport-Controller verwaltet unabhängige Abnehmer. Einzelner Abbruch betrifft nur dessen Promise, letzter Abbruch beendet den Transport. Inkompatible HTTP-Optionen oder abweichende Retry-Limits dürfen nicht zusammengefasst werden.

Der exponentielle 429-Cooldown bleibt auf 90 Sekunden begrenzt; ein ausdrücklich längerer `Retry-After`-Wert wird gesondert bis 24 Stunden berücksichtigt und gespeichert. Die größere Sperre erzeugt sofort einen verständlichen Rate-Limit-Fehler statt einer blockierten UI-Abfrage. Timer laufen nicht ohne wartende Abfragen. Extreme Sperrwerte oberhalb 24 Stunden bleiben ein eigenständiger Policy-Fall.

## Nachweis

`scripts/test-open-meteo-multicaller-0985245.mjs` testet mit dem real transpilierten Produktionsmodul unabhängige und gemeinsame Abbrüche, erneute Requests nach Abbruch, GET-Deduplizierung, Header-Isolation und 180 Sekunden `Retry-After`. Bestehende DWD-/Open-Meteo-Quellverträge bleiben vorhanden und werden ergänzt.

Die Source-PR- und Installer-Gates, RUC-/Worker-/Pages-Prüfungen und vollständige Regressionen bleiben unverändert verpflichtend. CI-Erfolge werden erst nach tatsächlichem Gate-Ende bewertet. Keine physische iOS-/WKWebView-/VoiceOver-Abnahme durch Browser-Emulation.

Zusätzlich wird der Cooldown bei einer 429-Antwort **vor** Freigabe des Netzwerk-Slots gesetzt, damit keine wartende Anfrage zwischen Slotfreigabe und Sperreintrag startet. Der Regressionstest hält zwei gleichzeitige Fetches offen, wartet über den Startabstand hinaus und prüft einen dritten wartenden Abruf. Wird dieser abgebrochen, wird auch ein ungenutzter Cooldown-Timer entfernt.

## Zusätzliche browserbasierte Abnahme im laufenden Source-Gate

Die Source-Regression zeigte sporadisch zu früh geprüfte Einstellungen nach der zweistufigen Renderphase. Die Favoriten-Browserprüfung wartet jetzt auf die sichtbare Favoritenverwaltung und verifiziert weiterhin den aktiven Bereich „Orte & Profile“. Ein zweiter Befund wurde durch die stärkere Tastaturprüfung an der Karten-Deckkraft entdeckt: Nach einem nativen Pfeiltastenschritt ging der Fokus in mehreren Smartphone-Layouts verloren. Der gemeinsame Deckkraft-Regler hält deshalb eine Referenz auf das zuvor fokussierte Element und stellt den Fokus nach einem React-Commit nur wieder her, wenn zwischenzeitlich kein anderes Bedienelement aktiv wurde. Die Browserprüfung stellt den ursprünglichen Deckkraftwert zurück, verlangt native Wertänderung, Fokus und unveränderten Kartentermin. Es wird kein Browser-/Responsive-Test übersprungen.

Die Regression zeigte, dass der Fokus bereits vor dem React-`onChange` wechseln konnte. Die Fokusabsicht wird daher beim ursprünglichen Pfeiltastenereignis des Reglers erfasst und innerhalb des zugehörigen synchronen `useLayoutEffect`-Commits wiederhergestellt. Ein Diagnoseobjekt meldet bei einem erneuten Fehler das tatsächlich aktive Element, dessen Rolle und die Verbindungs-/Wertzustände des Reglers. Die Assertion, dass Deckkraft und nicht Kartenzeit geändert wird, bleibt verbindlich.
