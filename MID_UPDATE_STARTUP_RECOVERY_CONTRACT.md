# MID – Update-, Start- und Wiederanlaufvertrag

## Ziel

Ein MID-Update darf weder Browser/PWA noch WKWebView in einen Zustand bringen, in dem die Oberfläche sichtbar bleibt, aber Wetterdaten dauerhaft nicht mehr geladen werden. Ein kompletter manueller App-Neustart darf niemals der normale Wiederherstellungsweg sein.

## Verbindlicher Updateablauf

- Ein neuer **wartender Service Worker** lädt und prüft zunächst ausschließlich seinen eigenen vollständigen App-Shell-Cache. Die Shell-Dateien werden mit begrenzter Parallelität vorgeladen; die Prüfung bleibt vollständig/all-or-nothing.
- Die Oberfläche beobachtet `updatefound` und einen eventuell verzögert entstehenden installierenden Worker bis zu **45 Sekunden**. Ist die Installation danach noch nicht abgeschlossen, bleibt die laufende Version aktiv und MID versucht die kontrollierte Aktivierung erneut, statt einen Reload unter dem alten Controller zu erzwingen.
- Der Install-Schritt darf weder den gemeinsam verwendeten aktiven Cache umschalten noch `skipWaiting()` ausführen. Damit bedeutet „Später“ tatsächlich, dass die laufende Sitzung beim bisherigen Controller bleibt.
- Erst eine ausdrückliche Aktivierung (`MID_ACTIVATE_UPDATE`) markiert die neue Version als **pending** und ruft `skipWaiting()` auf. Der gemeinsam verwendete `activeCache` bleibt bis zum tatsächlichen `activate`-Schritt des neuen Workers auf der bisherigen Version; erst dort wird Cache und Controller zusammen umgeschaltet. So kann der alte Controller niemals bereits Dateien der neuen Shell ausliefern.
- Solange ein bestehender Controller aktiv ist, wird die ausführbare App-Shell (insbesondere `index.html`, JavaScript und CSS) aus **demselben aktiven Cache** bedient. Eine bereits veröffentlichte neuere Server-`index.html` darf vor dem kontrollierten Controllerwechsel nicht in den alten Cache geschrieben oder mit dessen Assets kombiniert werden.
- Cache-Buster von `version.json` und Manifest dürfen keine unbeschränkt wachsenden Cacheeinträge erzeugen; gespeichert wird jeweils nur der kanonische Ressourcenpfad.
- Nach dem Controllerwechsel navigiert primär der neue Service Worker die offenen Clients. Die alte Seite darf nicht gleichzeitig einen zweiten sofortigen Navigationssprung erzwingen. Erst **nach bestätigtem `controllerchange`** darf nach 3 Sekunden ein Sicherheits-Navigationssprung greifen, falls iOS/PWA die vom neuen Worker angeforderte Client-Navigation verschluckt hat; zu diesem Zeitpunkt wird die Navigation bereits vom neuen Controller bedient. Solange noch ein alter Service-Worker-Controller aktiv ist, erfolgt **kein** `location.replace()` als vermeintlicher Fallback. Ohne Controller bleibt die Navigation als Browser-Fallback möglich.
- Ein Timeout beim Warten auf `controllerchange` gilt ausdrücklich **nicht** als erfolgreiche Aktivierung.

## Verbindlicher Startablauf

- Eine neue Web-App-Version gilt erst dann als technisch gesund, wenn die **stabile App-Oberfläche** unter dem neuen Controller über ein kurzes Stabilitätsfenster gerendert bleibt und weder Startup-Recovery noch nativer Startfehler aktiv sind. Danach darf der Rollback-Cache freigegeben werden.
- **Release-Gesundheit und Datenquellen-Gesundheit sind getrennt.** Die Kernprognose wird weiterhin überwacht und als `ready` beziehungsweise `degraded` diagnostiziert, aber ein temporär langsamer/ausgefallener Wetterdienst darf eine funktionsfähige App-Version nicht zurückrollen. Ein Rollback ist ausschließlich für einen tatsächlich nicht stabil startenden, noch `pending` geführten Release vorgesehen. Offline-Zustand ist weder positiver Datenbeweis noch Grund für einen Rollback.
- Netzwerk-first Navigationen und Versions-/Manifestabrufe des aktiven Service Workers besitzen ein 8-s-Budget und fallen danach auf die vollständig geprüfte lokale App-Shell zurück. Ein langsamer oder halb offener HTTP-Pfad darf den Start der bereits gecachten App nicht blockieren.
- Auch der sichtbare Versionscheck besitzt ein festes Netzwerkbudget; ein festhängendes `registration.update()` blockiert die Updateoberfläche nicht unbegrenzt.

- Forecast-, Stations- und Ensemble-Vorladung besitzen harte Zeitgrenzen und echte `AbortSignal`s. Kein Splash-Promise darf einen späteren regulären Dashboard-Abruf dauerhaft festhalten.
- Auch der Core-Forecast besitzt harte Zeitgrenzen für direkten Best-Match- und Worker-/Cache-Fallback. Lokale frische beziehungsweise stale Cachepfade bleiben vollständig erhalten.
- Die globale Foreground-Netzwerkbremse wird nach dem **terminalen Erfolg oder Fehler** des aktuellen Core-Forecasts freigegeben. Ein Fehler darf Hintergrunddienste nicht bis zum nächsten Prozessneustart blockieren; ein veralteter abgebrochener Request darf die Sperre eines neueren Requests nicht lösen.
- Der kleine portable Gerätestand darf innerhalb des Startbudgets abgeglichen werden. Große Wetterzwilling-Verifikationsbestände und das verschlüsselte Langzeitarchiv beginnen erst **nach dem ersten sichtbaren Render**, bevorzugt in einer Idle-Phase.

## Performance- und Resume-Vertrag

- Gerätesynchronisationsrequests besitzen ein Gesamtbudget über alle Fallback-Endpunkte hinweg. Ein Fallback darf die erlaubte Gesamtdauer nicht pro Host erneut verbrauchen.
- Der vollständige Wetterzwilling-Archiv-Pull wird bei Visibility-/Online-Pulsen gedrosselt; der portable Einstellungs-/Favoritenstand bleibt davon unberührt.
- Service-Worker-Updateprüfungen auf `focus` und `visibilitychange` werden zusammengeführt und zeitlich gedrosselt. Der reguläre 15-Minuten-Check bleibt erhalten.
- Bestehende Funktionen, Offline-Fallbacks, Favoriten, Wetterzwilling, Update-Rollback und iOS-/Browser-Gleichlauf dürfen durch diese Schutzmaßnahmen nicht entfallen.

## Meteorologische Nebenfeststellung des Audits

Die Skybar darf keine künstliche vierte Intensitätsklasse für **Dauerregen** erzeugen. Kontinuierlicher Regen nutzt die DWD-Klassen leicht/mäßig/stark, Regenschauer dürfen die reale zusätzliche Klasse „sehr stark“ anhand der 10-Minuten-Intensität darstellen, Schnee wird nach Schneezuwachs und Sprühregen bevorzugt nach dem WMO/DWD-Wettercode eingestuft. Sonne und Niederschlag bleiben als getrennte, zentrierte Skybar-Lagen gleichzeitig darstellbar.

## Ergänzende Netzwerk- und Speicherschranken

- Direkt geladene Radar-/Rasterprodukte (DWD-Niederschlagsart, HymecNG, OPERA, RADOLAN und PX250) besitzen eigene Download-Zeitgrenzen; komponentengebundene Abrufe werden beim Unmount/Ortswechsel abgebrochen. Auch gleichursprüngliche Live-/WMS-/Worker-Requests im Service Worker und externe Beobachtungs-/Geocodingabrufe besitzen endliche Obergrenzen.
- Der HymecNG-Rastercache ist strikt begrenzt. Neue fünfminütige Produktstände dürfen bei einer langen Kartensitzung keinen unbegrenzt wachsenden HDF5-Speicherbestand erzeugen.
- Private Sensoren und der Lüftungsassistent besitzen harte Gesamtbudgets und reichen vorhandene Abort-Signale durch.
- Auch die initiale und ereignisgetriggerte `ServiceWorkerRegistration.update()`-Prüfung ist zeitlich begrenzt; ein hängender Browser-Updatecheck darf die weitere Updateüberwachung nicht deaktivieren.
