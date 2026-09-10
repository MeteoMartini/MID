# MID v0.9.84.38 – Implementierungsnotiz

## Anlass
Screenshot 1 zeigte für Münster einen auffälligen Verlauf mit Abfall, Wiederanstieg und erneutem Abfall der Temperaturkurve. Die Nachprüfung hat zwischen meteorologisch möglichen Stundenänderungen und künstlichen Übergängen der MID-Fusion unterschieden. Screenshot 2 zeigte parallel eine übergroße klassische Wetterregime-Pille durch Vererbung der globalen Primary-Buttonklasse.

## Temperatur-/Druckpfad
- Das 24-h-Profil verwendet für Temperatur, gefühlte Temperatur, Taupunkt und Luftdruck dieselbe vollständige stündliche Zustandsreihe; der 3-h-Modus verdichtet nur die Darstellung und akkumuliert ausschließlich echte Intervallgrößen wie Niederschlag.
- Die bisher datumsweise angewendete Tageskonsens-Transformation konnte am Tageswechsel einen künstlichen Temperatursprung erzeugen. Sie wurde durch eine kontinuierliche Interpolation der affinen Tageskorrektur zwischen lokalen Tagesmitten ersetzt.
- DWD ICON-D2-RUC verwendet eine stetige Lead-Time-Gewichtung und läuft vor dem realen +14-h-Ende weich auf null aus. MOSMIX-Stundenbeiträge besitzen ebenfalls geglättete Lead-Time-Übergänge.
- Es findet keine pauschale Kurvenglättung statt. Synoptisch echte Wendungen der stündlichen Leitprognose bleiben sichtbar.
- Luftdruckskala und 6-h-Drucktrend verwenden die stündliche Reihe und bleiben unabhängig vom 1-h-/3-h-Anzeigemodus.

## Klassische Wetterregime-Pillen
- Die Hauptpille verwendet `main` statt der globalen CSS-Klasse `primary`.
- Schrift, Padding und Regimefarben entsprechen dem gemeinsamen Vertrag der übrigen 7-/14-Tage-Ansichten.

## Worker
Die RUC-Lead-Time-Gewichtung ist fachlich verändert. Deshalb ist für v0.9.84.38 ein Worker-Upload erforderlich. Der Worker wird ausschließlich aus `worker-src/*` über `build-maintenance-aggregates.mjs` erzeugt.
