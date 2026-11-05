# MID v0.9.85.433

- Die bereits integrierte freiwillige MID-Systemdiagnose für Web/PWA wird mit der nachträglich eingerichteten europäischen PostHog-Projektkonfiguration neu gebaut. Im zuvor veröffentlichten Build fehlten die Projektvariablen noch.
- Die Funktion bleibt standardmäßig ausgeschaltet und wird ausschließlich nach aktiver Zustimmung unter Einstellungen → Systemstatus verwendet. Ohne Projektkonfiguration oder Einwilligung werden keine PostHog-Ereignisse gesendet.
- Es werden nur festgelegte technische Start-, Navigations- und Fehlerkategorien verarbeitet; keine Orts- oder Favoritendaten, Texteingaben, Sitzungsaufzeichnungen oder dauerhaften Nutzerkennungen.
- Keine fachlichen Änderungen an Prognosen, amtlichen Warnungen, RUC, Karten, iOS oder vorhandenen Datendiensten.
