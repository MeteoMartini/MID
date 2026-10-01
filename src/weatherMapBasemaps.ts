import type {RasterTone} from './MapLibreCore';

export type WeatherMapBasemapId='light'|'osm'|'dark';
export type WeatherMapBasemap={label:string;url:string;attribution:string;tone?:RasterTone};

const OSM_TILE_URL='https://tile.openstreetmap.org/{z}/{x}/{y}.png';

export const WEATHER_MAP_BASEMAPS:Record<WeatherMapBasemapId,WeatherMapBasemap>={
 light:{label:'Schlicht hell',url:OSM_TILE_URL,attribution:'© OpenStreetMap-Mitwirkende',tone:{saturation:-.9,contrast:-.08,brightnessMin:.18,brightnessMax:1}},
 osm:{label:'OpenStreetMap',url:OSM_TILE_URL,attribution:'© OpenStreetMap-Mitwirkende'},
 dark:{label:'Schlicht dunkel',url:OSM_TILE_URL,attribution:'© OpenStreetMap-Mitwirkende',tone:{saturation:-1,contrast:.2,brightnessMin:0,brightnessMax:.48}}
};