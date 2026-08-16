import {useState,type ReactNode} from 'react';

type MidDisclosureProps={
 className?:string;
 summary:ReactNode;
 children:ReactNode;
 defaultOpen?:boolean;
};

export function MidDisclosure({className='',summary,children,defaultOpen=false}:MidDisclosureProps){
 const[open,setOpen]=useState(defaultOpen);
 return <details className={className} open={open} onToggle={event=>setOpen(event.currentTarget.open)} data-mid-ui="disclosure"><summary>{summary}</summary>{children}</details>;
}
