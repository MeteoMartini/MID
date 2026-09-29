import {useMemo} from 'react';
import {Thermometer} from 'lucide-react';
import {utciFromHour} from './utci';

/** Compact UTCI badge for the current weather view */
export function UtciBadge({
  temperatureC,
  windMs,
  humidityPercent,
  cloudOktas,
  uvIndex,
  isDay,
  elevationM,
  apparentTemperatureC,
}: {
  temperatureC: number;
  windMs: number;
  humidityPercent: number;
  cloudOktas: number;
  uvIndex: number;
  isDay: boolean;
  elevationM?: number;
  apparentTemperatureC?: number;
}) {
  const result = useMemo(
    () => utciFromHour(temperatureC, windMs, humidityPercent, cloudOktas, uvIndex, isDay, elevationM ?? 0),
    [temperatureC, windMs, humidityPercent, cloudOktas, uvIndex, isDay, elevationM]
  );

  if (!result) return null;

  const { utci, category, tmrt } = result;
  const delta = Math.round(utci - temperatureC);
  const deltaLabel = delta > 0 ? `+${delta}` : `${delta}`;

  return (
    <section className="card utci-badge-card" data-mid-view="utci">
      <header className="forecast-entry-head forecast-entry-head-utci">
        <span>
          <Thermometer size={16} style={{ color: category.color }} />
          <small>Gefühlte Temperatur</small>
          <strong>UTCI</strong>
        </span>
        <em title={`Tmrt: ${Math.round(tmrt)} °C`}>{category.shortLabel}</em>
      </header>
      <div className="utci-display">
        <div className="utci-value-row">
          <span className="utci-value" style={{ color: category.color }}>
            {Math.round(utci)}°
          </span>
          <span className="utci-unit">UTCI</span>
        </div>
        <div className="utci-detail-row">
          <span className="utci-category-label">{category.label}</span>
          {apparentTemperatureC !== undefined && Number.isFinite(apparentTemperatureC) && (
            <span className="utci-comparison" title="Vergleich: Apparent Temperature (Open-Meteo) vs. UTCI">
              AT: {Math.round(apparentTemperatureC)}° · Δ{deltaLabel}
            </span>
          )}
        </div>
      </div>
      {category.description && (
        <footer className="utci-description">
          <small>{category.description}</small>
        </footer>
      )}
    </section>
  );
}
