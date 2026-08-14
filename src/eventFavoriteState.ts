type EventFavoriteLike={isFavorite?:unknown;favoriteUpdatedAt?:unknown;createdAt?:unknown};

function finiteTimestamp(value:unknown){const numeric=Number(value);return Number.isFinite(numeric)&&numeric>0?numeric:0}

/** Event-Favoriten besitzen einen eigenen Konfliktzeitstempel und sind von Ortsfavoriten sowie Wetterplan-Frische unabhängig. */
export function eventFavoriteRevision(value:unknown){if(!value||typeof value!=='object')return 0;const record=value as EventFavoriteLike,explicit=finiteTimestamp(record.favoriteUpdatedAt);if(explicit>0)return explicit;return Boolean(record.isFavorite)?finiteTimestamp(record.createdAt):0}

export function mergeEventFavoritePreference(existing:EventFavoriteLike,incoming:EventFavoriteLike){const a=eventFavoriteRevision(existing),b=eventFavoriteRevision(incoming);if(a>b||(a===b&&Boolean(existing.isFavorite)&&!Boolean(incoming.isFavorite)))return{isFavorite:Boolean(existing.isFavorite),favoriteUpdatedAt:a};return{isFavorite:Boolean(incoming.isFavorite),favoriteUpdatedAt:b}}
