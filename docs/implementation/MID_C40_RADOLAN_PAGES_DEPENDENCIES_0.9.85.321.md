# RADOLAN Pages-Abhängigkeiten

Beleg: RUC-Run 40078282491, Job 120826278775, ModuleNotFoundError h5py in test_observed_precipitation_odim. Der rohe 07Z-Lauf war vorher vollständig aufbereitet. Lean requirements-pages.txt wird im Preprocessor und Installer benutzt; es fehlten h5py und pyproj, während die volle requirements.txt sie enthält. Beide werden CI-only ergänzt. Keine Datenlücke wird als Null behandelt; keine Tests entfernt. Vorherige Konturkorrektur bleibt unverändert. Source-/Installer-/Pages-/Stable-Gates und echte neue RADOLAN-Veröffentlichung müssen bestätigt werden.
