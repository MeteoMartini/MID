import {readFile} from 'node:fs/promises';
const [panel,mathSource]=await Promise.all([
 readFile(new URL('../src/EnsemblePanel.tsx',import.meta.url),'utf8'),
 readFile(new URL('../src/scenarioMath.ts',import.meta.url),'utf8')
]);
const failures=[];
for(const token of [
 "import {apportionScenarioPercentages} from './scenarioMath';",
 'displayPercentages=apportionScenarioPercentages(visible.map(scenario=>scenario.probability))',
 '{displayPercentages[index]} %',
 'gemeinsam gerundet und ergeben deshalb stets exakt 100 %'
])if(!panel.includes(token))failures.push(`Szenarioanzeige fehlt: ${token}`);
try{
 const js=mathSource.replace('export ','').replace('probabilities:number[]','probabilities');
 const api=new Function(`${js};return{apportionScenarioPercentages}`)();
 const cases=[
  [41.6,38.6,19.8],
  [42,39,20],
  [7.1,92.9],
  [1,1,1],
  [0,0,0],
  [Number.NaN,4,6]
 ];
 for(const values of cases){
  const result=api.apportionScenarioPercentages(values);
  if(result.reduce((sum,value)=>sum+value,0)!==100)failures.push(`Anteile ergeben für ${JSON.stringify(values)} nicht 100 %: ${JSON.stringify(result)}`);
  if(result.some(value=>!Number.isInteger(value)||value<0))failures.push(`Ungültige gerundete Anteile: ${JSON.stringify(result)}`);
 }
 const screenshot=api.apportionScenarioPercentages([42,39,20]);
 if(screenshot.reduce((sum,value)=>sum+value,0)!==100)failures.push(`Screenshot-Fall 42/39/20 nicht korrigiert: ${JSON.stringify(screenshot)}`);
}catch(error){failures.push(`Funktionaler Prozenttest nicht ausführbar: ${error instanceof Error?error.message:String(error)}`)}
if(failures.length){console.error('Szenarioprozent-Prüfung fehlgeschlagen:\n- '+failures.join('\n- '));process.exit(1)}
console.log('Szenariocluster geprüft: gemeinsam gerundete Anteile ergeben in allen Fällen exakt 100 %.');
