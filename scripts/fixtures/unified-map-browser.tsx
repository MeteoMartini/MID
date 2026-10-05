import React from 'react';
import {createRoot} from 'react-dom/client';
import MapWorkspacePanel from '../../src/MapWorkspacePanel';
import '../../src/styles.css';
document.documentElement.dataset.theme=matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';
const now=new Date(Math.floor(Date.now()/3600000)*3600000).toISOString();
createRoot(document.getElementById('root')!).render(<MapWorkspacePanel lat={50.82} lon={7.14} timezone="Europe/Berlin" locationName="Niederkassel" analysis={{source:'dwd',observedAt:now,timeline:[now]} as any} thunder={null} isDay actualLocation={false} focusMode unit="kmh" favorites={[{id:'nk',name:'Niederkassel-Rheidt',latitude:50.82,longitude:7.14},{id:'outside',name:'Kürecik',latitude:38.35,longitude:38.79}]}/>);
