# MID 0.9.84.48

Der mobile Kopfbereich wurde auf Basis des gemeldeten iPhone-Screenshots korrigiert. Ursache des sichtbaren Tmin-Überlaufs war die Reihenfolge der CSS-Regeln: Der in v0.9.84.45 ergänzte Tagesbereich stand hinter älteren Mobile-Breakpoints und überschritt deshalb in schmalen Karten die verfügbare Breite. v0.9.84.48 setzt die responsiven Verträge nach dieser Regel erneut verbindlich: Hochformat einspaltig, Querformat überlauffest zweispaltig, Tmin/Tmax intern flexibel und vollständig gekapselt.
