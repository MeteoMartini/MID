# MID 0.9.84.88 – Implementierung

## Ziel
Fortsetzung der in MID 17.7.24 begonnenen Qualitätskorrekturen für Tagespiktogramme, Push-Mitteilungen, Synoptik und Komposit-Layerdichte.

## Umgesetzt

### Tagespiktogramme
Die Tageszusammenfassung gewichtet die tatsächliche Sonnenscheindauer stärker. Ein hoher Sonnenanteil kann damit eine „Sonne + Wolken“/überwiegend sonnige Darstellung auslösen, obwohl einzelne Stunden wolkig sind. Dichte Bewölkung bleibt über die Anteile von >=75 % bzw. >=90 % Bedeckung als harte Gegenbedingung erhalten. Niederschlagsdominanz wird weiterhin separat bewertet.

### Benachrichtigungen
Niederschlagsvorwarnungen wurden auf die entscheidenden Informationen gekürzt: Ort, Vorlauf, Dauer und Menge. Der redundante Radarsatz entfällt. Gewittertexte wurden ebenfalls verkürzt, behalten aber die wichtige Trennung von Nowcast und amtlicher Warnung.

### Synoptik
Das 17×25-Großraster ergänzt 850-hPa-Temperatur und -Feuchte. Daraus wird θe berechnet; robuste starke horizontale θe-Gradienten werden als zusammenhängende regionale Frontalzonen extrahiert, geglättet und separat gerendert. Diese Diagnose ist bewusst nicht mit einer amtlichen Frontanalyse gleichgesetzt. Die vorhandene lokale Mehrparameteranalyse kann weiterhin Kalt-/Warmfront, Okklusion, Trog und Konvergenz typisieren.

500-hPa-Isohypsen werden nur noch als MID-Vektoren dargestellt. Die native weiße DWD-WMS-Isohypsenschicht wurde als sichtbarer Fallback entfernt, da sie rasterbedingt treppenartig wirkte und die gewünschte MID-Liniengestaltung überlagerte. Haupt- und Zwischenisohypsen sind jetzt unterschiedlich gestrichelt und verwenden die Gold/Amber-Palette.

### Komposit-Layerkarten
Statuszeilen wurden fachlich gekürzt. Auf kleinen Geräten bleiben zwei Spalten möglich, die Statuszeile ist einzeilig mit Ellipse und die Touchhöhe bleibt >=54 px. Vollständige Details verbleiben im bestehenden Komposit-Infozugang.

## Wissenschaftliche Einordnung
Eine Frontalzone ist nicht allein durch einen θe-Gradienten vollständig typisiert. Deshalb zeigt MID die großräumige neue Ebene ausdrücklich als modell-diagnostische Frontalzone; klassische Fronttypen werden nur dort verwendet, wo die bestehende Mehrparameteranalyse zusätzliche Temperatur-, Feuchte-, Druck-/Konvergenz- und Niederschlagssignaturen stützt.

## Worker
Geändert. Worker-Upload erforderlich.
