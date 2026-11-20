import {describe,expect,it} from 'vitest';
import {choosePrimaryMapOwner,type PrimaryMapOwner} from '../../src/primaryMapOwner';

const cases:Array<[string|null|undefined,boolean,boolean,PrimaryMapOwner]>=[
 ['current',true,true,'compact'],['composite',true,true,'workspace'],
 ['weather-maps',true,true,'workspace'],['place',true,true,'compact'],
 ['',true,true,'compact'],[undefined,true,true,'compact'],
 [null,true,true,'compact'],['forecast',true,true,'none'],
 ['warnings',true,true,'none'],['favorites',true,true,'none'],
 ['composite',true,false,'none'],['current',false,true,'none'],
 ['composite',false,true,'workspace'],['current',true,false,'compact'],
 ['composite',false,false,'none'],['current',false,false,'none']
];

describe('MID Karten 1.14 · bidirektionale MapLibre GPU Owner-Regel (pure)',()=>{
 it.each(cases)('owner(%s, current=%s, workspace=%s) -> %s',(section,currentEnabled,workspaceEnabled,expected)=>{
  expect(choosePrimaryMapOwner(section,currentEnabled,workspaceEnabled)).toBe(expected);
 });
 it('never grants both GPU owners, including repeated navigation and back/forward',()=>{
  for(let i=0;i<40;i++)for(const section of ['current','composite','current','warnings','composite','forecast','place'] ){
   const owner=choosePrimaryMapOwner(section,true,true);
   expect(Number(owner==='compact')+Number(owner==='workspace')).toBeLessThanOrEqual(1);
  }
 });
 it('does not choose an unsupported map when module disabled',()=>{
  for(const section of ['current','composite','weather-maps',null,'place',undefined])
   expect(choosePrimaryMapOwner(section,false,false)).toBe('none');
 });
});
