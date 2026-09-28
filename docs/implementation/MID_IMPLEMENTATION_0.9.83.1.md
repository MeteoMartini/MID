# MID v0.9.83.1 – Widget-/Klima-Darstellung

## Ausgangspunkt
Arbeitsbasis ist das in diesem Chat zuletzt erzeugte MID v0.9.83.0. Der zuletzt erfolgreich installierte `mid-stable`-Stand ist weiterhin v0.9.82.1; v0.9.83.1 führt die noch nicht installierte v0.9.83.0-Toolchain-Migration fort und enthält keine Rücknahme dieses neueren Projektstands.

## Widget
Der Hazardbereich eines Tages wird nur noch gerendert, wenn die kanonische MID-Hazardlogik tatsächlich mindestens ein warnwürdiges Ereignis liefert. Die bisherige grüne Pille „keine MID-Hinweise“ entfällt vollständig. Sind im gesamten Widget keine Hazards vorhanden, wird layoutseitig derselbe kompakte Zustand wie bei deaktivierter Hazardanzeige verwendet.

## Klima
Die Temperaturachse des Jahresverlaufs verwendet eine adaptive Nice-Scale. Aus der tatsächlichen Temperaturspanne wird ein gut lesbarer Schritt aus 1/2/5/10/20/50 °C gewählt; Unter- und Obergrenze werden auf diesen Schritt ab- bzw. aufgerundet. Dadurch entstehen beispielsweise Achsen wie −10/0/10/20/30 °C statt unruhiger Zwischenwerte.

Alle sichtbaren Wind- und Böenwerte des Klimamoduls werden auf ganze Werte gerundet. Dies umfasst Zusammenfassung, Monatskarten, Windrose, Böenmodus, stärkste Böe und die Windklassen-Legende in der gewählten Einheit. Die zugrunde liegenden Klimadaten und Berechnungen bleiben unverändert präzise.

## Worker / Daten
Keine fachliche Workeränderung und keine Änderung an Wetter- oder Klimadatenquellen. Nur Release-/Cachekennung wird synchronisiert.
