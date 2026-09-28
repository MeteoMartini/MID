# MID – Kosten- und Beschaffungsvertrag

Dieser Vertrag gilt ab MID v0.9.53.37 verbindlich für alle weiteren Projektentscheidungen, Datenquellen, APIs, Infrastruktur-, Hosting-, App-Store-, Domain-, Build-, Monitoring- und Drittanbieter-Schritte.

## 1. Keine kostenpflichtigen Schritte ohne ausdrückliche Freigabe

MID generiert derzeit keine Einnahmen. Deshalb darf kein Projektfortschritt eigenständig einen kostenpflichtigen Dienst, Tarif, Server, API-Plan, Abonnement, Entwickleraccount oder sonstige wiederkehrende bzw. einmalige Ausgabe voraussetzen, bestellen, aktivieren oder als stillschweigend notwendige Standardlösung behandeln.

Eine kostenpflichtige Maßnahme wird erst umgesetzt, wenn der Nutzer sie nach transparenter Kosteninformation ausdrücklich freigibt.

## 2. Kosten müssen vor der Entscheidung sichtbar sein

Wird eine kostenpflichtige Option fachlich relevant, sind vor jeder Umsetzung mindestens anzugeben:

- Anbieter und konkrete Leistung,
- einmaliger und/oder laufender Preis soweit zuverlässig bestimmbar,
- Abrechnungsmodell (monatlich, nutzungsabhängig, pro Request, pro GB, pro Build usw.),
- mögliche variable Zusatzkosten oder Freikontingente,
- kostenlose bzw. bereits vorhandene Alternativen,
- fachlicher Mehrwert gegenüber der kostenlosen Lösung.

Ist der Preis nicht belastbar bekannt, muss dies ausdrücklich als Kostenschätzung/unklarer Preis gekennzeichnet werden; dann darf keine automatische Umsetzung erfolgen.

## 3. Free/Open first

Bei fachlich vergleichbarer Eignung haben in dieser Reihenfolge Vorrang:

1. bereits vorhandene MID-Infrastruktur ohne Zusatzkosten,
2. amtliche/Open-Data-Quellen und freie öffentliche APIs im zulässigen Nutzungsrahmen,
3. kostenlose Kontingente ohne hinterlegte oder automatisch auslösbare Zusatzkosten,
4. selbst gehostete Komponenten nur, wenn hierfür bereits kostenfreie Infrastruktur vorhanden ist,
5. kostenpflichtige Angebote erst nach ausdrücklicher Freigabe.

Ein kostenloses Kontingent, das bei Überschreitung automatisch Kosten erzeugt, gilt für diesen Vertrag als kostenpflichtiges Risiko und darf nicht still aktiviert werden.

## 4. Keine Funktionsregression wegen fehlender Bezahlquelle

Optionale kostenpflichtige oder extern zu hostende Quellen müssen fail-open/fallback-fähig bleiben. Ist eine solche Quelle nicht eingerichtet, darf sie keinen Modell-, Request- oder Funktionsplatz blockieren und bestehende kostenlose Datenquellen nicht verschlechtern.

Insbesondere bleiben KNMI HARMONIE-AROME EPS und ECCC REPS über den externen GRIB-Punktadapter optional. Solange keine ausdrücklich freigegebene kostenfreie Hostingmöglichkeit vorhanden ist, wird kein kostenpflichtiger VPS beschafft; MID fällt automatisch auf die bestehenden Ensemblefamilien zurück.

## 5. App-Store-/Entwicklerkosten

Auch spätere Schritte zur nativen iOS-/Android-Veröffentlichung werden nur nach vorheriger Kostenfreigabe ausgeführt. Planungen und Prototypen dürfen kostenfrei vorbereitet werden, kostenpflichtige Entwicklerprogramme, Signier-/Builddienste oder Store-Leistungen aber nicht eigenständig gebucht werden.

## 6. Nachhaltigkeit

Jede neue externe Quelle oder Infrastruktur wird zusätzlich nach laufender Wartung, Ausfallrisiko, Lizenz, Datenvolumen und Kostenrisiko bewertet. Eine marginale Modell- oder Featureverbesserung rechtfertigt keine dauerhaften Kosten ohne ausdrückliche Entscheidung.
