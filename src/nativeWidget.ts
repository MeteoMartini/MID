import type {Location,WindUnit} from './weather';
import {buildWorkerUrl,configuredWorkerBase,fetchWorkerJson} from './workerClient';

export const NATIVE_WIDGET_SCHEMA='mid.native.widget.v1';
export const APPLE_WIDGET_FAMILIES=[
 'systemSmall','systemMedium','systemLarge',
 'accessoryInline','accessoryCircular','accessoryRectangular','accessoryCorner'
] as const;

export type NativeWidgetFeed={
 error?:string;
 schema:string;
 version:string;
 generatedAt:string;
 expiresAt:string;
 location:{name:string;latitude:number;longitude:number;elevation?:number;timezone:string};
 units:{temperature:'°C';precipitation:'mm';wind:string};
 current:{time:string;temperature:number;apparentTemperature:number;precipitation:number;weatherCode:number;condition:string;symbolName:string;windSpeed:number;windGust:number;windDirection:number;isDay:boolean};
 hourly:Array<{time:string;temperature:number;precipitationProbability:number;weatherCode:number;condition:string;symbolName:string;windSpeed:number;windGust:number;windDirection:number;isDay:boolean}>;
 daily:Array<{date:string;temperatureMax:number;temperatureMin:number;precipitationSum:number;precipitationProbabilityMax:number;weatherCode:number;condition:string;symbolName:string;windGustMax:number;sunrise?:string;sunset?:string}>;
 source:{provider:string;model:string;license:string};
};

function widgetParams(location:Location,unit:WindUnit){return{
 lat:location.latitude,
 lon:location.longitude,
 elevation:Number.isFinite(location.elevation)?Math.round(Number(location.elevation)):undefined,
 name:location.name||'MID-Standort',
 timezone:location.timezone||undefined,
 unit
}}

export function nativeWidgetFeedUrl(location:Location|null|undefined,unit:WindUnit){
 if(!location)return'';
 const base=configuredWorkerBase('general');
 return base?buildWorkerUrl(base,'native-widget-feed',widgetParams(location,unit)).toString():'';
}

export async function verifyNativeWidgetFeed(location:Location,unit:WindUnit,signal?:AbortSignal){
 return fetchWorkerJson<NativeWidgetFeed>('native-widget-feed',widgetParams(location,unit),{purpose:'general',signal,timeoutMs:14000,cache:'no-store'});
}
