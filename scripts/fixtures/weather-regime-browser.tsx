import {useState} from 'react';
import {createRoot} from 'react-dom/client';
import WeatherRegimePanel from '../../src/WeatherRegimePanel';
import '../../src/styles.css';
import '../../src/midPresentation.css';
const places={DE:{id:1,name:'Berlin',latitude:52.5,longitude:13.4,country_code:'DE',timezone:'Europe/Berlin'},FR:{id:2,name:'Paris',latitude:48.8,longitude:2.3,country_code:'FR',timezone:'Europe/Paris'},JP:{id:3,name:'Tokyo',latitude:35.7,longitude:139.7,country_code:'JP',timezone:'Asia/Tokyo'}};
document.documentElement.dataset.theme=matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';
function Fixture(){const[advanced,setAdvanced]=useState(false),[place,setPlace]=useState<keyof typeof places>('DE');return <main><button type="button" aria-pressed={advanced} onClick={()=>setAdvanced(value=>!value)}>Erweiterte Ansicht</button><label>Testregion<select value={place} onChange={event=>setPlace(event.target.value as keyof typeof places)}><option value="DE">Deutschland</option><option value="FR">Frankreich</option><option value="JP">Japan</option></select></label>{advanced&&<WeatherRegimePanel location={places[place]}/>}</main>}
createRoot(document.getElementById('root')!).render(<Fixture/>);
