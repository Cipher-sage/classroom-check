import {isAdmin} from '../../admin-auth';
import {getDb} from '../../../db';
import {exams,attempts,roster} from '../../../db/schema';
import {rosterKey,nameMatches,parseRoster} from '../../roster';
import {eq,and,isNull,gt,lte,exists,notExists,sql} from 'drizzle-orm';
import {getAdminUser,getAuthConfig} from '../../auth';
import {validMutationOrigin} from '../../auth-core';
export const dynamic='force-dynamic';
const reply=(data:any,status=200)=>Response.json(data,{status,headers:{'Cache-Control':'no-store'}});
function shuffle(a:any[]){return a.map(x=>({x,r:crypto.getRandomValues(new Uint32Array(1))[0]})).sort((a,b)=>a.r-b.r).map(x=>x.x)}
function timing(a:any){
 let fl:any[]=[];try{fl=JSON.parse(a.flags)}catch{}
 const ans=fl.filter(f=>f.type==='answer'),other=fl.filter(f=>f.type!=='answer');
 const first=new Map<string,number>();for(const f of ans)if(!first.has(f.q))first.set(f.q,f.at);
 const times=[...first.values()].sort((x,y)=>x-y);
 const gaps=times.map((t,i)=>(t-(i?times[i-1]:a.start))/1000);
 const answered=gaps.length,avg=answered?gaps.reduce((s,x)=>s+x,0)/answered:null,quick=gaps.filter(g=>g<4).length;
 const fast=answered>=5&&avg!==null&&(avg<6||quick/answered>0.5);
 return {other,timing:{answered,avg:avg===null?null:Math.round(avg*10)/10,quick,changes:ans.length-first.size,fast}};
}
async function finish(initial:any,exam?:any){
 const db=getDb();
 for(let tries=0;tries<5;tries++){
 const a=(await db.select().from(attempts).where(eq(attempts.id,initial.id)).get())!;
 if(a.submitted)return a;
 const e=exam||(await db.select().from(exams).where(eq(exams.id,a.exam)).get())!;
 const answers=JSON.parse(a.answers);
 const score=JSON.parse(e.questions).reduce((s:number,q:any)=>s+(answers[q.id]===q.correct?1:0),0);
 const updated=await db.update(attempts).set({score,submitted:Math.min(Date.now(),a.deadline)}).where(and(eq(attempts.id,a.id),eq(attempts.answers,a.answers),isNull(attempts.submitted))).returning();
 if(updated.length)return updated[0];
 }
 throw Error('Please retry submission.');
}
export async function POST(req:Request){
try{
 if(req.headers.get('origin') && req.headers.get('origin')!==new URL(req.url).origin)return reply({error:'Invalid origin'},403);
 const b:any=await req.json(); const db=getDb(); const action=b.action==='flag'?'exit':b.action;
 if(['list','create','toggle','results','delete','getroster','setroster'].includes(action)){
 const user=await getAdminUser();if(!user)return reply({error:'Please sign in to manage your tests.'},401);if(!isAdmin(user))return reply({error:'Administrator access only.'},403);
 if(!validMutationOrigin(req,getAuthConfig()))return reply({error:'Invalid origin'},403);
 if(action==='list'){const all=await db.select().from(exams).where(eq(exams.owner,user.userId));const rc=await db.select({exam:roster.exam,n:sql<number>`count(*)`}).from(roster).groupBy(roster.exam);const counts=new Map(rc.map(r=>[r.exam,Number(r.n)]));return reply({exams:all.map(x=>({...x,roster:counts.get(x.id)||0}))})}
 if(action==='create'){
 if(typeof b.title!=='string'||!b.title.trim()||b.title.length>150||typeof b.course!=='string'||!b.course.trim()||!Number.isInteger(b.minutes)||b.minutes<1||b.minutes>180||!Array.isArray(b.questions)||!b.questions.length||b.questions.length>100) return reply({error:'Enter a title, course, 1–180 minutes and 1–100 questions.'},400);
 const questions=b.questions.map((q:any)=>{if(typeof q.text!=='string'||!q.text.trim()||q.text.length>2000||!Array.isArray(q.options)||q.options.length!==4||q.options.some((o:any)=>typeof o!=='string'||!o.trim()||o.length>500)||!Number.isInteger(q.correct)||q.correct<0||q.correct>3)throw Error('Each question needs four options and a correct answer.');const options=q.options.map((text:string)=>({id:crypto.randomUUID(),text}));return {id:crypto.randomUUID(),text:q.text,options,correct:options[q.correct].id}});
 const id=crypto.randomUUID();const code=crypto.randomUUID().replaceAll('-','').slice(0,10).toUpperCase();
 await db.insert(exams).values({id,owner:user.userId,title:b.title.trim(),course:b.course.trim(),minutes:b.minutes,code,questions:JSON.stringify(questions),created:Date.now()});return reply({ok:true,id,code});
 }
 const e=await db.select().from(exams).where(and(eq(exams.id,b.id),eq(exams.owner,user.userId))).get();if(!e)return reply({error:'Test not found'},404);
 if(action==='toggle'){await db.update(exams).set({open:b.open?1:0}).where(eq(exams.id,e.id));return reply({ok:true})}
 if(action==='getroster'){const rows=await db.select().from(roster).where(eq(roster.exam,e.id));return reply({text:rows.map(r=>r.matric+', '+r.name).sort().join('\n'),count:rows.length})}
 if(action==='setroster'){
 if(typeof b.text!=='string'||b.text.length>200000)return reply({error:'Class list is missing or too large.'},400);
 const p=parseRoster(b.text);
 if(p.duplicate)return reply({error:'Registration number '+p.duplicate+' appears more than once. Fix it and save again.'},400);
 if(p.rows.length>1000)return reply({error:'A class list can have at most 1000 students.'},400);
 if(!p.rows.length&&b.text.trim())return reply({error:'No valid lines found. Use one student per line: REG NUMBER, Full Name.'},400);
 const writes:any[]=[db.delete(roster).where(eq(roster.exam,e.id))];
 for(let i=0;i<p.rows.length;i+=20)writes.push(db.insert(roster).values(p.rows.slice(i,i+20).map(r=>({exam:e.id,key:r.key,matric:r.matric,name:r.name}))));
 await db.batch(writes as any);
 return reply({ok:true,count:p.rows.length,skipped:p.skipped});
 }
 if(action==='delete'){
 if(e.open)return reply({error:'Close entry to this test before deleting it.'},409);
 const now=Date.now();
 const active=db.select({id:attempts.id}).from(attempts).where(and(eq(attempts.exam,e.id),isNull(attempts.submitted),gt(attempts.deadline,now)));
 if((await active.limit(1)).length)return reply({error:'A student is still taking this test. Wait until all attempts have finished before deleting it.'},409);
 const closed=db.select({id:exams.id}).from(exams).where(and(eq(exams.id,e.id),eq(exams.owner,user.userId),eq(exams.open,0)));
 const removed=await db.batch([
 db.delete(attempts).where(and(eq(attempts.exam,e.id),exists(closed),notExists(active))),
 db.delete(exams).where(and(eq(exams.id,e.id),eq(exams.owner,user.userId),eq(exams.open,0),notExists(active))).returning({id:exams.id})
 ]);
 if(!removed[1].length)return reply({error:'This test changed while deletion was being checked. Close entry and wait for active attempts to finish, then retry.'},409);
 await db.delete(roster).where(eq(roster.exam,e.id));
 return reply({ok:true});
 }
 // Finalize expired attempts atomically, without a query loop that grows with class size.
 await db.update(attempts).set({score:sql<number>`(SELECT count(*) FROM json_each(${e.questions}) AS question JOIN json_each(${attempts.answers}) AS answer ON answer.key = json_extract(question.value, '$.id') AND answer.value = json_extract(question.value, '$.correct'))`,submitted:attempts.deadline}).where(and(eq(attempts.exam,e.id),isNull(attempts.submitted),lte(attempts.deadline,Date.now())));
 const rows=await db.select().from(attempts).where(eq(attempts.exam,e.id));
 const results=rows.map(a=>{const {paper,answers,flags:_f,...safe}=a;const t=timing(a);return {...safe,flags:JSON.stringify(t.other),timing:t.timing}});return reply({results});
 }
 if(action==='checkCode'){
 if(typeof b.code!=='string'||b.code.length>20)return reply({error:'Enter your class code.'},400);
 const e=await db.select().from(exams).where(eq(exams.code,b.code.trim().toUpperCase())).get();
 if(!e||!e.open)return reply({error:'This code is invalid or entry is closed. Ask your supervisor.'},400);
 return reply({title:e.title,course:e.course,minutes:e.minutes});
 }
 if(action==='join'){
 if(typeof b.code!=='string'||!b.code.trim()||b.code.length>20||typeof b.matric!=='string'||!b.matric.trim()||b.matric.length>150||typeof b.name!=='string'||!b.name.trim()||b.name.length>150)return reply({error:'Enter your matriculation number, full name and access code.'},400);
 const e=await db.select().from(exams).where(eq(exams.code,b.code.trim().toUpperCase())).get();if(!e||!e.open)return reply({error:'This code is invalid or entry is closed. Ask your supervisor.'},400);
  let matric=b.matric.trim().toUpperCase(),fullName=b.name.trim().replace(/\s+/g,' ');
 const hasRoster=(await db.select({k:roster.key}).from(roster).where(eq(roster.exam,e.id)).limit(1)).length>0;
 if(hasRoster){
 const row=await db.select().from(roster).where(and(eq(roster.exam,e.id),eq(roster.key,rosterKey(b.matric)))).get();
 if(!row||!nameMatches(fullName,row.name))return reply({error:'Your registration number and name do not match the class list. Check what you typed, or ask your supervisor.'},403);
 matric=row.matric;fullName=row.name;
 }
 const qs=JSON.parse(e.questions); const paper=shuffle(qs).map(({correct,...q}:any)=>({...q,options:shuffle(q.options)}));const id=crypto.randomUUID();const start=Date.now();
 try{await db.insert(attempts).values({id,exam:e.id,name:fullName,matric,department:'',paper:JSON.stringify(paper),start,deadline:start+e.minutes*60000,total:qs.length})}catch{return reply({error:'This matriculation number already has an attempt. Resume on the original browser or contact your supervisor.'},409)}
 return reply({token:id});
 }
 if(!['resume','save','submit','exit','signal'].includes(action)||typeof b.token!=='string')return reply({error:'Invalid request'},400);
 let a=await db.select().from(attempts).where(eq(attempts.id,b.token)).get();if(!a)return reply({error:'Attempt not found'},404);
 if(!a.submitted&&Date.now()>=a.deadline)a=await finish(a);
 if(a.submitted)return reply({submitted:true});
 if(action==='signal'){
 const label:any={blur:'Test window lost focus (possible overlay, assistant or app switch)',resize:'Screen size changed (possible overlay or split screen)'}[b.type as string];
 if(!label)return reply({error:'Invalid request'},400);
 const flags=JSON.parse(a.flags);if(flags.length<600)flags.push({at:Date.now(),type:'Warning: '+label});
 await db.update(attempts).set({flags:JSON.stringify(flags)}).where(and(eq(attempts.id,a.id),isNull(attempts.submitted)));
 return reply({ok:true});
 }
 if(action==='exit'){
 const paper=JSON.parse(a.paper);const answers:any={...JSON.parse(a.answers)};
 const supplied=b.answers&&typeof b.answers==='object'?b.answers:{};
 for(const q of paper){if(q.options.some((o:any)=>o.id===supplied[q.id]))answers[q.id]=supplied[q.id]}
 const e=(await db.select().from(exams).where(eq(exams.id,a.exam)).get())!;
 const score=JSON.parse(e.questions).reduce((sum:number,q:any)=>sum+(answers[q.id]===q.correct?1:0),0);
 const flags=JSON.parse(a.flags);flags.push({at:Date.now(),type:'Auto-submitted: '+(b.type==='fullscreen'?'exited full screen':b.type==='pagehide'?'left page':b.type==='blur'?'test window lost focus repeatedly':'left test screen')});
 const now=Date.now();
 await db.update(attempts).set({answers:JSON.stringify(answers),score,submitted:now,flags:JSON.stringify(flags)}).where(and(eq(attempts.id,a.id),isNull(attempts.submitted),gt(attempts.deadline,now)));
 await finish(a);
 return reply({submitted:true});
 }
 if(action==='save'||action==='submit'){
 const prev=JSON.parse(a.answers);const paper=JSON.parse(a.paper);const answers:any={...prev};for(const q of paper){const choice=b.answers?.[q.id];if(q.options.some((o:any)=>o.id===choice))answers[q.id]=choice}
 const flags=JSON.parse(a.flags),at=Date.now();for(const q of paper){if(answers[q.id]&&answers[q.id]!==prev[q.id]&&flags.length<600)flags.push({at,type:'answer',q:q.id})}
 await db.update(attempts).set({answers:JSON.stringify(answers),flags:JSON.stringify(flags)}).where(and(eq(attempts.id,a.id),isNull(attempts.submitted),gt(attempts.deadline,Date.now())));a=(await db.select().from(attempts).where(eq(attempts.id,a.id)).get())!;
 if(action==='submit'){await finish(a);return reply({submitted:true})}
 }
 const e=await db.select().from(exams).where(eq(exams.id,a.exam)).get();
 return reply({paper:JSON.parse(a.paper),answers:JSON.parse(a.answers),deadline:a.deadline,serverTime:Date.now(),title:e!.title,matric:a.matric});
}catch(e){console.error('api/test failed',e);return reply({error:e instanceof Error&&e.message.startsWith('Each question')?e.message:'Could not complete the request. Please retry.'},400)}
}




