/** Real MID ModuleLoadingState with synthetic, deliberately non-weather layout labels. */
import React from 'react';
import {createRoot} from 'react-dom/client';
import {ModuleLoadingState} from '../../src/ModuleLoadingState';
const long='NiederkasselUndSeineUntrennbarenKartennamenMitZusatzInformationen'.repeat(4);
const text='Wetterkartenmodul für '+long+' wird geladen …';
document.documentElement.dataset.theme=new URLSearchParams(location.search).get('theme')==='dark'?'dark':'light';
createRoot(document.getElementById('root')!).render(<div className="qa-layout">
 <div className="qa-panel" data-kind="map"><ModuleLoadingState label={text} kind="map" className="lazy-placeholder map-workspace-loading"/></div>
 <div className="qa-panel" data-kind="chart"><ModuleLoadingState label={text} kind="chart"/></div>
</div>);
