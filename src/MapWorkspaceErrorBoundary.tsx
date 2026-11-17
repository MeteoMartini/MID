import {Component,type ErrorInfo,type ReactNode} from 'react';

/**
 * Scope synchronous React render/commit errors to the weather map workspace.
 * The root StartupGuard remains the last resort for errors OUTSIDE this subtree.
 * Native GPU-process termination and JavaScript errors outside React are not
 * catchable by an ErrorBoundary and require separate Safari/device diagnosis.
 */
type Props={children:ReactNode;onRetry:()=>void};
type State={error:boolean};
export class MapWorkspaceErrorBoundary extends Component<Props,State>{
 state:State={error:false};
 static getDerivedStateFromError(){return{error:true}}
 componentDidCatch(error:Error,info:ErrorInfo){
  // Local only, bounded diagnostics. Never send user data, request URLs or
  // device coordinates to external analytics during error handling.
  try{
   sessionStorage.setItem('mid:map:last-render-error',JSON.stringify({
    at:new Date().toISOString(),
    name:String(error?.name||'Error').slice(0,80),
    message:String(error?.message||'Unbekannter Kartenfehler').slice(0,280),
    component:String(info.componentStack||'').slice(0,1200)
   }));
  }catch{/* storage restrictions must not cause a second crash */}
 }
 render(){
  if(!this.state.error)return this.props.children;
  return <section className="mid-map-workspace-error" role="alert" aria-label="Kartenansicht konnte nicht dargestellt werden">
   <strong>Kartenansicht vorübergehend nicht verfügbar</strong>
   <p>Der Kartenrenderer hat einen Fehler gemeldet. Die übrigen Wetteransichten bleiben verfügbar.</p>
   <button type="button" onClick={this.props.onRetry}>Karte erneut versuchen</button>
  </section>;
 }
}
