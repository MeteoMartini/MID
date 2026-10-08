# MID-C23 · Vollständiger Navigationshorizont .205

Nach .204 wurden zusätzlich alle echten Endpunkte geprüft: ICON180, ICON-EU120, IFS360 und GFS384 bestehen die unveränderte Frontendprüfung. Beim Durchgehen der gesamten Navigationskette wurde eine ältere feste 204h-Grenze im RadarPanel gefunden: gültige IFS-/GFS-Felder würden deshalb nicht in der Terminauswahl erscheinen.

Das gemeinsame Kartenfenster leitet seine Zukunftsgrenze aus den tatsächlich veröffentlichten Modellterminen ab, behält mindestens das vorhandene Fenster und erzeugt keine neuen Termine. History, Nowcast, Validierung, Laufgrenzen, Speicher- und Release-Gates bleiben unverändert. Vier bestehende Quelltexttests werden auf den bewusst erweiterten Fenstervertrag präzisiert, ohne ihre übrigen Fachverträge zu ändern.

Neue Funktionsregression reproduziert den alten Cutoff und schützt vollständige +360/+384h-Dropdowns, unregelmäßige Verfügbarkeit und fehlende Werte. Die vorhandenen 24 Kartenfälle bieten zusätzlich vollständige IFS/GFS-Fixtures und prüfen Endpunktwahl, Zweibuchstaben-Wochentag, Begrenzung per Pfeiltaste, tatsächlichen Feldrequest und Rückwechsel auf den kürzeren D2-Horizont.

Die .204-Implementierung ist vollständig erhalten. API-Integration erfolgt erst auf dem tatsächlich freigegebenen .204-Stable-Tree; kein direkter geschützter Push oder manuelle Stable-Promotion.

Verifizierte Integrationsbasis: main = mid-stable = `fe2f97fb77fe401ae86bf8b7d2d6330c7490762b` (.204), erster Pages-Versuch und Worker erfolgreich, live version.json bestätigt. Lokaler .204-Quellstand ist vollständig blob-identisch zur freigegebenen Basis; ausschließlich das neue .205-Delta wird auf diesem Stable-Tree integriert.

Lokale Validierung: Build/Typprüfung grün, 943/943 Core-Regressionen grün, acht mobile/Tablet-Kartenfälle mit +360/+384h grün. Die vollständige unveränderte 24-Fälle-Matrix wird zusätzlich in Source- und Installer-Gates ausgeführt.
