# MID v0.9.85.275 · Parallele Extremwetter-Direktabrufe zuverlässig abbrechen

- Überlappen zwei Auswertungen des Extremwetter-Ausblicks, sind ihre Abbruchsignale jetzt voneinander isoliert. Ein Standort- oder Ansichtswechsel beendet nur den zugehörigen Direktabruf und bricht keine unabhängigen Auswertungen versehentlich ab.
- Die Optimierung betrifft ausschließlich den Browser-Direktfallback, wenn der bevorzugte MID-Worker nicht verfügbar ist. Erfolgreich zwischengespeicherte Daten, meteorologische Schwellenwerte, Farben, Warnungsabgrenzung und Datenverarbeitung bleiben erhalten.
- Ein zusätzlicher deterministischer Parallelitätsnachweis schützt das Verhalten bei verzögerten Folgeabrufen und stellt sicher, dass ein abgebrochener Abruf nach der Verarbeitung nicht als neuer vollständiger Live-Stand angezeigt wird.
