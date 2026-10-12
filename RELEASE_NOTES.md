# MID v0.9.85.241 · Sicherer Profilstart am Tag-/Nachtübergang

- Behebt den im veröffentlichten Browser reproduzierten Startabbruch bei einer Kurzfrist-Stundengruppe, die den Sonnenaufgang überschreitet.
- Das zusammengefasste Wetterpiktogramm verwendet denselben Tag-/Nachtstatus wie der sichtbare Intervallbeginn. Fehlende zivile Zeitfelder lösen keinen Startabbruch aus.
- Sonnenaufgang, Sonnenuntergang, fehlende Zeitfelder und unveränderte Niederschlagsintervalle werden mit dem echten Profilrenderer geprüft.
