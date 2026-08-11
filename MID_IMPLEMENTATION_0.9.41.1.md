# MID v0.9.41.1 – CI-Kompatibilitätsfix Langfrist-Multi-Modell

## Ursache

Der Produktionsbuild von v0.9.41.0 war erfolgreich. Von 393 Regressionstests schlug ausschließlich `test-true-multimodel-snowline-09350.mjs` fehl, weil der geschützte Textvertrag die zusammenhängende Formulierung `gewichtet Modellfamilien gleich` erwartet, während v0.9.41.0 fachlich erweitert `gewichtet unabhängige Modellfamilien gleich` verwendete.

## Korrektur

Die Methodik lautet nun vertragskompatibel sinngemäß: Die Multi-Modell-Mittellinie gewichtet Modellfamilien gleich; berücksichtigt werden unabhängige Modellfamilien. Die fachliche Aussage bleibt damit erhalten, zugleich bleibt der bestehende Regressionsvertrag wirksam.

C3S/CDS, DWD GCFS2.2/EPISODES, Schneefallgrenzen-Multi-Modell, Informationsdichte und die übrigen Funktionen von v0.9.41.0 sind unverändert.

## Deployment

Frontend-Wartungsrelease. Der Worker enthält gegenüber v0.9.41.0 keine funktionale Änderung; lediglich die Versionskennung ist synchronisiert. Ein erneuter Worker-Upload ist für diesen Fix nicht erforderlich, sofern bereits der v0.9.41.0-Worker ausgerollt wurde.
