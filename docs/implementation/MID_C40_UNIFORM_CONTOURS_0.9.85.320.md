# Gleichmäßige Konturen

Basis: 4c092751208c437a152eb8fcdf87fd8301a537cb.

Ursache: featurelokale spacingKm-Auswahl mischte 1/2/5-hPa-Niveaus im gleichen Zoom. Nun wählen alle Features derselben Zoomstufe dasselbe Niveau-Modulo. Labelkollisionen bleiben Kartenlayout; Linien werden nicht nach lokaler Gradientendichte entfernt. Skalare native Flächen und Exporte aktivieren vorhandene numerische Isolinien. WMS-Produkte ohne numerischen Rasterzugang werden nicht mit erfundenen Konturen ergänzt.

Gezielte Konturregression einschließlich ungleichmäßiger spacingKm und Export erfolgreich. Weitere Release-/Browser-Gates sind vor Veröffentlichung erforderlich.
