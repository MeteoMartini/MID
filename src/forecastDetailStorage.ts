/** Keep the legacy 0/1 daily disclosure choice without crashing if browser storage is denied. */
export function initialForecastDetailsOpen(hourlyDetailOnly:boolean,read:()=>string|null=()=>localStorage.getItem('mid:forecastDetailsOpen')):boolean{
 if(hourlyDetailOnly)return true;
 try{return read()==='1'}catch{return false}
}
