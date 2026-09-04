# MID Warning Hybrid Contract

Stand: v0.9.78.49

## 1. Autorität und Reihenfolge
- Amtliche Warnungen (z. B. DWD/CAP) sind autoritativ und werden immer vor MID-Prognosehinweisen dargestellt.
- MID-Hinweise ersetzen, imitieren oder relativieren keine amtliche Warnung.
- Überlappen beide fachlich und zeitlich, wird der MID-Eintrag als `MID · ERGÄNZUNG` gekennzeichnet.

## 2. Farben
- Amtliche Warnstufenfarben Gelb/Orange/Rot/Violett sind ausschließlich amtlichen Warnungen vorbehalten.
- MID-Hinweise verwenden die appweit festgelegte Parameterfarbe (Wind, Niederschlag, Temperatur usw.).
- Die interne DWD-nahe Schwellenlogik bleibt für die fachliche Einstufung erhalten, steuert bei MID-Hinweisen aber nicht die amtliche Warnoptik.

## 3. Einheiten
- Kompakte MID-Zusammenfassungen verwenden die vom Nutzer gewählte Einheit.
- Bei amtlichen Windwarnungen wird die kompakte Zusammenfassung soweit aus dem Originaltext belastbar extrahierbar in die gewählte Windeinheit umgerechnet.
- Der aufgeklappte amtliche Originaltext bleibt unverändert, einschließlich aller von der Quelle gelieferten Einheiten.

## 4. Keine trügerische Genauigkeit
- Automatische MID-Hinweise zeigen keine punktgenauen Modellspitzen als scheinbar sichere Realität.
- Wind, Regen, Schnee, Wärme und Frost werden in sinnvoll gerundeten Prognosebereichen dargestellt. Diese Bereiche sind Darstellungs-/Depräzisionsbänder, keine statistischen Konfidenzintervalle.
- Nebel wird als Schwellen-/Sichtkategorie, Glätte als punktuell/kleinräumig und Gewitter als räumlich begrenztes Ereignis beschrieben.
- Bei schauer-/gewittergebundenem Wind oder Starkregen steht ausdrücklich `örtlich` bzw. `Ortstreffer unsicher`.
- Das zugrunde liegende Modellzeitfenster bleibt sichtbar; bei konvektiven Ereignissen wird es als `Schwerpunkt` bezeichnet, nicht als garantierter Ereigniszeitpunkt.

## 5. Fachliche Typen
- **Wind:** Grundwind/Böen als Bereich; bei Schauerkontext bedingt und örtlich.
- **Gewitter:** kein WMO-Code als Nutzerwert; Hinweis auf räumlich begrenzte Zelltreffer.
- **Stark-/Dauerregen:** Mengen als gerundete Bereiche; bei konvektivem Starkregen örtliche Variabilität, bei Dauerregen gebietsweise Summen.
- **Schnee/Schneeverwehung:** gerundete Mengen-/Böenbereiche; Höhen-/Untergrundabhängigkeit transparent.
- **Nebel:** Sichtschwelle statt scheinbar metergenauer Vorhersage.
- **Glätte/Glatteis:** qualitative, kleinräumige Aussage statt ungeeigneter Punktzahl.
- **Hitze/Frost:** Temperaturbereich statt einzelner scheinpräziser Modellspitze; lokale Lage/Exposition wird genannt.

## 6. Originaldaten
- Intern bleiben Schwellen, exakte Modellwerte, Gültigkeitsintervalle und amtliche Originaltexte vollständig erhalten.
- Die unsicherheitsbewusste Darstellung verändert nur die Nutzerpräsentation, nicht die meteorologische Kernberechnung.
