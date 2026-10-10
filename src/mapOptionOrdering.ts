const mapLabelCollator=new Intl.Collator('de-DE',{usage:'sort',sensitivity:'base',numeric:true});

/** Sort visible labels without changing source priority, defaults or stored IDs. */
export function alphabeticalMapOptions<T extends {label:string;id?:string}>(options:readonly T[]):T[]{
 return [...options].sort((left,right)=>mapLabelCollator.compare(left.label,right.label)||mapLabelCollator.compare(left.id??'',right.id??''));
}
