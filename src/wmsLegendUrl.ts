import {WEATHER_MAP_PRODUCTS,weatherMapWmsProxy,type WeatherMapProduct} from './WeatherMapsData';

/** Provider-original map legends only; never synthesize a value/color mapping. */
export function wmsProviderLegendUrl(product:WeatherMapProduct,style:string):string{
 const provider=product.provider??'dwd';
 if(product.source||!WEATHER_MAP_PRODUCTS.some(p=>p.layer===product.layer&&(p.provider??'dwd')===provider))return '';
 if(style&&!/^[A-Za-z0-9_:.-]{1,180}$/.test(style))return '';
 const base=weatherMapWmsProxy(provider);
 if(!base)return '';
 try{
  const url=new URL(base);
  url.searchParams.set('service','WMS');
  url.searchParams.set('request','GetLegendGraphic');
  url.searchParams.set('version','1.3.0');
  url.searchParams.set('layers',product.layer);
  url.searchParams.set('styles',style);
  url.searchParams.set('format','image/png');
  return url.toString();
 }catch{return ''}
}
