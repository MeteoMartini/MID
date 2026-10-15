# MID v0.9.85.260 · RUC-Betriebsnachweis und Open-Meteo-Prüfstand

- Die laufgebundene RUC-Betriebsprüfung protokolliert jetzt ausdrücklich, ob der begrenzte verlustfreie Pilot vom Worker verifiziert gelesen wurde. Ein erfolgreicher Rohdatenabruf wird dabei nicht als Codec-Erfolg ausgegeben; Abschaltung und Rohfallback bleiben möglich.
- Die bisherigen Open-Meteo-Prüfungen sind mit verifizierten Originalquellen konsolidiert: Tagesaggregate, GEM-Strahlung, HRRR/NAM-Windrichtung, ICON-Umstellung und weiterhin offene Böen-/RUC-Themen. Es erfolgen keine spekulativen Datenkorrekturen oder Modellwechsel.
- Alle RUC-Rohdaten bleiben erhalten. Der Pilot bedeutet weiterhin keine vollständige Speicherkompression oder Freigabe einer Rohdatenablösung.
