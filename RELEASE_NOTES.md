# MID v0.9.85.223

- Updatehinweise unterscheiden verfügbare, noch vorbereitete und aktivierte Versionen. „Update laden und aktivieren“ benennt die tatsächliche Wirkung; „Für diese Sitzung ausblenden“ unterdrückt weitere Versuche dieser Version in der laufenden Seite.
- Automatische Aktivierung beachtet die gespeicherte Auswahl. Einschalten startet den aktuellen Versuch; nach Wiederverbindung kann MID erneut prüfen. Gleichzeitige Versuche werden zusammengeführt und das Ende eines Retry-Budgets ausdrücklich angezeigt.
- Eine bereits geladene neue Version lässt sich aus dem Rückfallcache gezielt neu starten. Auch ein verpasster Neustart unter einem bereits neuen Controller wird erkannt.
- Der Rückfallknopf wird bei fehlender oder verspäteter Antwort spätestens nach zehn Sekunden wieder bedienbar. Fehlermeldungen und Zielversion sind sichtbar; späte Antworten nach Timeout lösen keinen überraschenden Neustart aus.
- HTML, Versionsdatei und Service Worker müssen beim Vorbereiten denselben Release tragen. Unvollständige Caches und Aktivierungsanfragen für einen anderen Release werden abgewiesen.
- Updateknöpfe und Automatik-Auswahl erhalten größere Touchflächen, umbrechende Bezeichnungen und zugängliche Statusbeschreibungen. Eine neue Browsermatrix prüft sieben Bildschirmgrößen in hellem und dunklem Design; echte VoiceOver-/WKWebView-Abnahme bleibt separat erforderlich.
