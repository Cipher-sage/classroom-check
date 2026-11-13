'use client';
import {useEffect,useRef,useState} from 'react';
import {BookOpen,ShieldCheck,ArrowRight,Plus,Check,Clock,Download,Lock,Users,ChevronLeft,ChevronRight,TriangleAlert,CloudOff,LoaderCircle,Copy,FileUp,Inbox,Search,Printer,RefreshCw,BellOff,BatteryCharging,Globe,Info,ListChecks,Mail,CircleCheck,ClipboardList,DoorOpen,LayoutGrid,Smartphone,Trash2,Upload} from 'lucide-react';
const BLUR_LIMIT=2;
const blank=()=>({text:'',options:['','','',''],correct:-1});
const L4=(k:number)=>String.fromCharCode(65+k);
async function api(body:any){const r=await fetch('/api/test',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});const d:any=await r.json();if(!r.ok)throw Error(d.error||'Please try again.');return d}
const endedTone=(e:string)=>e==='Submitted by student'?'ok':e==='Time ran out'?'':e==='In progress'?'info':String(e).startsWith('Auto-submitted')?'warn':'';
export default function Classroom({adminMode=false}:{adminMode?:boolean}){
 const [view,V]=useState(adminMode?'admin':'home'),[error,E]=useState(''),[busy,B]=useState(false),[list,L]=useState<any[]>([]),[selected,S]=useState<any>(null),[results,R]=useState<any[]>([]);
 const [questions,Q]=useState<any[]>([blank()]),[attempt,A]=useState<any>(null),[index,I]=useState(0),[answers,ANS]=useState<any>({}),[now,N]=useState(Date.now()),[saved,SV]=useState('All answers saved'),[notice,NOTICE]=useState(''),[rosterText,RT]=useState(''),[rosterMsg,RM]=useState(''),[detail,DET]=useState<any>(null),[summary,SUM]=useState<any>({absent:[],qstats:[]}),[q,SQ]=useState(''),[fil,FIL]=useState('all'),[srt,SRT]=useState('matric'),[exAuto,EXA]=useState(false);
 const [big,BIG]=useState(false),[online,ONLINE]=useState(true),[copied,COPIED]=useState(''),[requests,REQ]=useState<any[]|null>(null);
 const importInput=useRef<HTMLInputElement>(null);
 const token=useRef(''),current=useRef<any>({}),offset=useRef(0),queue=useRef(Promise.resolve()),exitBody=useRef<any>(null),exitSending=useRef(false),finished=useRef(false),blurs=useRef(0),dialog=useRef(false),signalAt=useRef<any>({});
 async function loadResults(id:string){const d=await api({action:'results',id});R(d.results);SUM({absent:d.absent||[],qstats:d.qstats||[]})}
 async function run(fn:()=>Promise<any>){E('');B(true);try{await fn()}catch(e:any){E(e.message)}finally{B(false)}}
 function accept(d:any){if(d.submitted){finished.current=true;exitBody.current=null;localStorage.removeItem('classroom-pending-exit');A(d);V('done');localStorage.removeItem('classroom-attempt');return}offset.current=d.serverTime-Date.now();A(d);ANS(d.answers);current.current=d.answers;V('test')}
 async function admin(){await run(async()=>{const d=await api({action:'list'});L(d.exams);V('admin')})}
 async function loadRequests(){await run(async()=>{const d=await api({action:'accessrequests'});REQ(d.requests||[]);V('requests')})}
 useEffect(()=>{if(adminMode){admin();return}const t=localStorage.getItem('classroom-attempt');if(t){token.current=t;const pending=localStorage.getItem('classroom-pending-exit');if(pending){try{const body=JSON.parse(pending);if(body.token===t){exitBody.current=body;V('exit');sendExit();return}}catch{}}run(async()=>accept(await api({action:'resume',token:t}))) }},[]);
 useEffect(()=>{const t=setInterval(()=>N(Date.now()+offset.current),1000);return()=>clearInterval(t)},[]);
 // Display-only preferences: larger text, and an offline indicator. Neither changes saving or submission.
 useEffect(()=>{try{BIG(localStorage.getItem('classroom-text')==='lg')}catch{}ONLINE(navigator.onLine);const on=()=>ONLINE(true),off=()=>ONLINE(false);window.addEventListener('online',on);window.addEventListener('offline',off);return()=>{window.removeEventListener('online',on);window.removeEventListener('offline',off)}},[]);
 useEffect(()=>{window.scrollTo(0,0)},[view]);
 function toggleText(){const next=!big;BIG(next);try{localStorage.setItem('classroom-text',next?'lg':'')}catch{}}
 function persist(next:any,submit=false){
 if(exitBody.current||finished.current)return Promise.resolve();
 SV(submit?'Submitting…':'Saving…');
 queue.current=queue.current.catch(()=>{}).then(async()=>{if(exitBody.current||finished.current)return;try{const d=await api({action:submit?'submit':'save',token:token.current,answers:next});SV('All answers saved');if(d.submitted)accept(d)}catch(e:any){SV('Not saved — check connection');E(e.message);throw e}});
 return queue.current;
 }
 async function sendExit(){
 if(!exitBody.current||exitSending.current||finished.current)return;
 exitSending.current=true;
 try{
 const r=await fetch('/api/test',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(exitBody.current),keepalive:true});
 const d:any=await r.json();if(!r.ok||!d.submitted)throw Error('Submission pending.');
 E('');accept(d);
 }catch{E('Submission pending. Your test is locked. Keep this page open and reconnect to send it.')}
 finally{exitSending.current=false}
 }
 function signal(type:string){const t=Date.now();if(t-(signalAt.current[type]||0)<5000)return;signalAt.current[type]=t;api({action:'signal',token:token.current,type}).catch(()=>{})}
 function exitTest(type:string){
 if(finished.current)return;
 if(!exitBody.current){
 exitBody.current={action:'exit',token:token.current,answers:{...current.current},type};
 try{localStorage.setItem('classroom-pending-exit',JSON.stringify(exitBody.current))}catch{}
 V('exit');
 }
 if(navigator.sendBeacon)navigator.sendBeacon('/api/test',new Blob([JSON.stringify(exitBody.current)],{type:'application/json'}));
 sendExit();
 }
 useEffect(()=>{
 if(view!=='exit')return;
 const retry=setInterval(sendExit,3000);window.addEventListener('online',sendExit);
 return()=>{clearInterval(retry);window.removeEventListener('online',sendExit)}
 },[view]);
 useEffect(()=>{if(view!=='test')return;
 const retry=setInterval(()=>{persist(current.current,Date.now()+offset.current>=attempt.deadline).catch(()=>{})},10000);
 const visibility=()=>{if(document.hidden)exitTest('hidden')};
 const fullscreen=()=>{if(!document.fullscreenElement)exitTest('fullscreen')};
 const pagehide=()=>exitTest('pagehide');
 let blurTimer:any,baseTimer:any,base:any=null;
 const setBase=()=>{base=null;clearTimeout(baseTimer);baseTimer=setTimeout(()=>{base={h:window.innerHeight,w:window.innerWidth}},2500)};
 const blur=()=>{clearTimeout(blurTimer);blurTimer=setTimeout(()=>{if(dialog.current||document.hidden||document.hasFocus()||exitBody.current||finished.current)return;blurs.current++;if(blurs.current>=BLUR_LIMIT){exitTest('blur')}else{signal('blur');NOTICE('Warning: this test window lost focus. If it happens again, your test will be submitted automatically.')}},400)};
 const resize=()=>{if(!base||exitBody.current||finished.current)return;if(Math.abs(window.innerHeight-base.h)/base.h>0.2||Math.abs(window.innerWidth-base.w)/base.w>0.2)signal('resize')};
 const fsChange=()=>{fullscreen();setBase()};
 setBase();
 let lock:any=null;const wake=async()=>{try{if(!lock&&document.visibilityState==='visible'&&(navigator as any).wakeLock){lock=await (navigator as any).wakeLock.request('screen');lock.addEventListener?.('release',()=>{lock=null})}}catch{lock=null}};
 const rewake=()=>{if(document.visibilityState==='visible')wake()};
 wake();document.addEventListener('visibilitychange',rewake);
 document.addEventListener('visibilitychange',visibility);document.addEventListener('fullscreenchange',fsChange);window.addEventListener('pagehide',pagehide);window.addEventListener('blur',blur);window.addEventListener('resize',resize);
 return()=>{try{lock?.release()}catch{}document.removeEventListener('visibilitychange',rewake);clearInterval(retry);clearTimeout(blurTimer);clearTimeout(baseTimer);document.removeEventListener('visibilitychange',visibility);document.removeEventListener('fullscreenchange',fsChange);window.removeEventListener('pagehide',pagehide);window.removeEventListener('blur',blur);window.removeEventListener('resize',resize)}
 },[view,attempt?.deadline]);
 useEffect(()=>{if(view==='test'&&now>=attempt.deadline)persist(current.current,true).catch(()=>{})},[view,attempt?.deadline,now>=attempt?.deadline]);
 async function join(e:any){e.preventDefault();const f=Object.fromEntries(new FormData(e.target));await run(async()=>{const d=await api({action:'join',...f});token.current=d.token;localStorage.setItem('classroom-attempt',d.token);accept(await api({action:'resume',token:d.token}));if(document.documentElement.requestFullscreen)document.documentElement.requestFullscreen().catch(()=>{})})}
 async function create(e:any){e.preventDefault();const f=Object.fromEntries(new FormData(e.target));await run(async()=>{await api({action:'create',...f,minutes:Number(f.minutes),questions});Q([blank()]);await admin()})}
 function csv(){const cells=(x:any)=>'"'+String(x??'').replace(/^[=+@-]/,"'").replaceAll('"','""')+'"';const n=summary.qstats.length,head=['Matriculation number','Name','Score','Total','Status','Submitted at','Review flags','Answered','Avg seconds per answer','Answers under 4s','Answer changes','Fast-answer pattern','Flag details','Percent','How it ended',...Array.from({length:n},(_,i)=>'Q'+(i+1))];const rows=[head,...results.map(r=>[r.matric,r.name||'',r.score??'',r.total,r.submitted?'Submitted':'In progress',r.submitted?new Date(r.submitted).toISOString():'',JSON.parse(r.flags).length,r.timing?.answered??0,r.timing?.avg??'',r.timing?.quick??0,r.timing?.changes??0,r.timing?.fast?'FAST':'',JSON.parse(r.flags).map((f:any)=>f.type+' @ '+new Date(f.at).toLocaleTimeString()).join('; '),r.total?Math.round((r.score??0)/r.total*1000)/10:'',r.ended||'',...Array.from({length:n},(_,i)=>r.marks?.[i]==='C'?1:r.marks?.[i]==='W'?0:'')]),...summary.absent.map((x:any)=>{const row:any[]=head.map(()=>'');row[0]=x.matric;row[1]=x.name;row[4]='Did not join';row[14]='Did not join';return row})];const url=URL.createObjectURL(new Blob([rows.map(r=>r.map(cells).join(',')).join('\r\n')],{type:'text/csv;charset=utf-8;'}));const a=document.createElement('a');a.href=url;a.download='classroom-results.csv';a.click();URL.revokeObjectURL(url)}
 function copyCode(code:string){navigator.clipboard?.writeText(code).then(()=>{COPIED(code);setTimeout(()=>COPIED(''),1800)}).catch(()=>{})}
 const isAuto=(r:any)=>String(r.ended||'').startsWith('Auto-submitted'),endedCount=(l:string)=>results.filter(r=>r.ended===l).length;
 const statRows=results.filter(r=>r.submitted&&!(exAuto&&isAuto(r))),scores=statRows.map(r=>r.score??0).sort((x,y)=>x-y),outOf=results[0]?.total||0;
 const mean=scores.length?scores.reduce((x,y)=>x+y,0)/scores.length:0,median=scores.length?(scores.length%2?scores[(scores.length-1)/2]:(scores[scores.length/2-1]+scores[scores.length/2])/2):0;
 const bands=[['Under 40%',0,40],['40–49%',40,50],['50–59%',50,60],['60–69%',60,70],['70% and above',70,101]].map(([l,lo,hi]:any)=>[l,statRows.filter(r=>{const p=r.total?(r.score??0)/r.total*100:0;return p>=lo&&p<hi}).length]);
 const shown=results.filter(r=>{if(q&&!(r.matric+' '+(r.name||'')).toLowerCase().includes(q.toLowerCase()))return false;if(fil==='student')return r.ended==='Submitted by student';if(fil==='time')return r.ended==='Time ran out';if(fil==='auto')return isAuto(r);if(fil==='progress')return !r.submitted;if(fil==='warn')return JSON.parse(r.flags).some((f:any)=>String(f.type).startsWith('Warning'));return true}).sort((x:any,y:any)=>srt==='name'?String(x.name||'').localeCompare(String(y.name||'')):srt==='high'?(y.score??-1)-(x.score??-1):srt==='low'?(x.score??999)-(y.score??999):srt==='time'?(x.submitted??0)-(y.submitted??0):String(x.matric).localeCompare(String(y.matric)));
 const remaining=attempt?.deadline?Math.max(0,Math.ceil((attempt.deadline-now)/1000)):0;
 const saveKind=saved.startsWith('Not')?'err':saved.endsWith('…')?'busy':'ok';
 const bandMax=Math.max(1,...bands.map(([,n]:any)=>n));
 const errorBox=error&&<div role="alert" className="alert danger"><TriangleAlert size={18}/><div>{error}{error.includes('sign in')&&<> <a href="/api/auth/github" target="_top">Sign in</a></>}</div></div>;

 /* ───────── Exam screen: its own full-height layout ───────── */
 if(view==='test'&&attempt&&!attempt.submitted){
 const total=attempt.paper.length,done=Object.keys(answers).length,cur=attempt.paper[index];
 const submit=()=>{dialog.current=true;const ok=confirm('Submit your test? '+(total-done)+' questions are unanswered. You cannot change answers after submitting.');setTimeout(()=>{dialog.current=false},800);if(ok)run(()=>persist(current.current,true))};
 return <div className={'app exam-shell'+(big?' lg':'')}>
 <div className="exam-bar"><div className="exam-bar-in">
 <div className="exam-id"><strong>{attempt.title}</strong><span>{attempt.matric}</span></div>
 <button type="button" className="icon-btn" aria-pressed={big} aria-label="Larger text" title="Larger text" onClick={toggleText}>Aa</button>
 <div className={'timer'+(remaining<60?' urgent':remaining<300?' soon':'')} role="timer" aria-label="Time remaining"><Clock size={18}/>{Math.floor(remaining/60)}:{String(remaining%60).padStart(2,'0')}</div>
 </div><div className="exam-progress" aria-hidden="true"><span style={{width:(done/total*100)+'%'}}/></div></div>
 <main className="exam-main">
 {errorBox}
 {notice&&<div role="status" className="alert"><TriangleAlert size={18}/><div>{notice}</div></div>}
 {!online&&<div className="offline" role="status"><CloudOff size={18}/><span><strong>You are offline.</strong> Stay on this screen. Your answers will be sent again when the connection returns.</span></div>}
 <div className="exam-meta"><span><strong>{done}</strong> of {total} answered</span><span className={'save '+saveKind} aria-live="polite">{saveKind==='ok'?<CircleCheck size={16}/>:saveKind==='busy'?<LoaderCircle size={16} className="spin"/>:<CloudOff size={16}/>}{saved}</span></div>
 <div className="card q-card raised">
 <div className="q-num"><span className="eyebrow">Question {index+1} of {total}</span>{answers[cur.id]?<span className="badge ok">Answered</span>:<span className="badge">Not answered</span>}</div>
 <h2 className="q-text">{cur.text}</h2>
 <div className="options" role="group" aria-label={'Options for question '+(index+1)}>{cur.options.map((o:any,k:number)=>{const on=answers[cur.id]===o.id;return <button type="button" disabled={!remaining} aria-pressed={on} className={'option'+(on?' chosen':'')} key={o.id} onClick={()=>{const next={...current.current,[cur.id]:o.id};current.current=next;ANS(next);persist(next).catch(()=>{})}}><span className="letter">{L4(k)}</span><span className="otext">{o.text}</span>{on&&<Check size={20} className="tick"/>}</button>})}</div>
 </div>
 <div className="exam-nav">
 <button type="button" className="btn lg" disabled={index===0} onClick={()=>I(index-1)}><ChevronLeft size={18}/> Previous</button>
 {index<total-1?<button type="button" className="btn primary lg" onClick={()=>I(index+1)}>Next <ChevronRight size={18}/></button>:<button type="button" className="btn primary lg" disabled={busy} onClick={submit}>Submit test <Check size={18}/></button>}
 </div>
 <section className="palette card" aria-label="All questions">
 <div className="palette-head"><h2><LayoutGrid size={16} style={{verticalAlign:-3,marginRight:8}}/>All questions</h2><div className="legend"><span><i className="a"/>Answered</span><span><i/>Not yet</span><span><i className="c"/>Current</span></div></div>
 <div className="palette-grid">{attempt.paper.map((qq:any,k:number)=><button type="button" aria-label={'Go to question '+(k+1)+(answers[qq.id]?', answered':', not answered')} aria-current={k===index?'step':undefined} key={qq.id} className={(answers[qq.id]?'answered':'')+(k===index?' current':'')} onClick={()=>I(k)}>{k+1}</button>)}</div>
 {index<total-1&&<div className="row" style={{marginTop:16,justifyContent:'flex-end'}}><button type="button" className="btn sm" disabled={busy} onClick={submit}>Submit test now</button></div>}
 </section>
 <p className="exam-foot"><Lock size={16}/><span>Stay on this screen. Leaving it, switching apps or exiting full screen submits your test automatically. If your connection drops, keep this page open.</span></p>
 </main></div>;
 }

 return <div className={'app'+(big?' lg':'')}>
 <header className="app-bar"><div className="app-bar-in">
 <a className="brand" href={adminMode?'/admin':'/'}><span className="logo"><BookOpen size={19}/></span>Classroom <b>Check</b></a>
 {adminMode&&<nav className="app-nav" aria-label="Admin"><button aria-current={['admin','create','roster','results','review'].includes(view)?'page':undefined} onClick={admin}>Tests</button><button aria-current={view==='requests'?'page':undefined} onClick={loadRequests}>Access requests</button></nav>}
 {!adminMode&&<div className="app-bar-r"><a className="btn ghost sm" href="/how-it-works">Help</a></div>}
 </div></header>
 <main className="app-main">
 {errorBox}

 {/* ───────── Student: join ───────── */}
 {view==='home'&&<div className="join-grid">
 <form className="card join-card raised" onSubmit={join}>
 <span className="eyebrow">Student entry</span>
 <h1>Join your test</h1>
 <p className="lead">Use the access code your supervisor gives you in the room. <a href="#prep" className="prep-jump">Check your phone first ↓</a></p>
 <div className="join-fields">
 <label className="field">Matriculation number<input name="matric" required maxLength={150} placeholder="e.g. UG20/MDMD/1001" autoComplete="off" autoCapitalize="characters"/></label>
 <label className="field">Full name<span className="hint">All your names, as they appear on the class list</span><input name="name" required maxLength={150} placeholder="e.g. Fatima Ardo Abubakar" autoComplete="off"/></label>
 <label className="field">Access code<input name="code" required maxLength={10} placeholder="A7B2C9D4E1" className="code-input" autoComplete="off" autoCapitalize="characters" spellCheck={false}/></label>
 </div>
 <div className="rules">
 <h2><ShieldCheck size={18}/>Test rules</h2>
 <ul>
 <li><TriangleAlert size={16}/><span>Leaving this page, switching apps or tabs, or exiting full screen <strong>submits your test automatically</strong>.</span></li>
 <li><TriangleAlert size={16}/><span>Opening an assistant, overlay or another app on top of the test is recorded. The second time, your test is submitted.</span></li>
 <li><TriangleAlert size={16}/><span>Calls and screen-lock interruptions can also end your attempt. You cannot continue afterwards.</span></li>
 </ul>
 </div>
 <label className="check"><input type="checkbox" required/><span>I have read the test rules and understand that my test can be submitted automatically and that I cannot continue afterwards.</span></label>
 <button disabled={busy} className="btn primary lg block" style={{marginTop:20}}>{busy?<><LoaderCircle size={18} className="spin"/> Joining…</>:<>Start test <ArrowRight size={18}/></>}</button>
 <p className="join-privacy"><Lock size={14}/><span>Your name, registration number and score are shared only with your lecturer for this test. <a href="/privacy">Privacy</a></span></p>
 </form>
 <aside className="prep" id="prep">
 <span className="eyebrow">Before you start</span>
 <h2>Get your phone ready</h2>
 <p>Two minutes now prevents your test ending early.</p>
 <ul className="prep-list">
 <li><span className="prep-ico"><BellOff size={20}/></span><div><strong>Turn on Do Not Disturb</strong><span>Calls and pop-ups can end your attempt.</span></div></li>
 <li><span className="prep-ico"><Smartphone size={20}/></span><div><strong>Longest screen timeout</strong><span>Stop the screen locking while you think.</span></div></li>
 <li><span className="prep-ico"><BatteryCharging size={20}/></span><div><strong>Charge your phone</strong><span>And close all other apps.</span></div></li>
 <li><span className="prep-ico"><Globe size={20}/></span><div><strong>Use Chrome or Safari</strong><span>Not inside WhatsApp or another app.</span></div></li>
 </ul>
 <div className="steps3"><div><b>1. Join</b>Enter your details and code.</div><div><b>2. Answer</b>One question at a time. Answers save as you go.</div><div><b>3. Submit</b>You will see a confirmation.</div></div>
 </aside>
 </div>}

 {/* ───────── Admin: tests ───────── */}
 {view==='admin'&&<section>
 <div className="page-head"><div><span className="eyebrow">Your workspace</span><h1>Tests</h1><p>Create a test, open entry in the room, and review private results.</p></div>
 <div className="row">
 <input ref={importInput} type="file" accept=".json,application/json" aria-label="Import test JSON file" hidden onChange={e=>{const file=e.target.files?.[0];e.target.value='';if(file)run(async()=>{const data=JSON.parse(await file.text());await api({...data,action:'create'});await admin()})}}/>
 <a className="btn" href="/api/admin-backup"><Download size={17}/> Backup</a>
 <button className="btn" disabled={busy} onClick={()=>importInput.current?.click()}><Upload size={17}/> Import</button>
 <button className="btn primary" onClick={()=>V('create')}><Plus size={18}/> Create test</button>
 </div></div>
 <div className="stats">
 <div className="stat"><span className="stat-ico"><ClipboardList size={20}/></span><div><strong>{list.length}</strong><span>Tests</span></div></div>
 <div className="stat"><span className="stat-ico"><DoorOpen size={20}/></span><div><strong>{list.filter(e=>e.open).length}</strong><span>Open for entry</span></div></div>
 <div className="stat"><span className="stat-ico"><Users size={20}/></span><div><strong>{list.reduce((s,e)=>s+(e.roster||0),0)}</strong><span>On class lists</span></div></div>
 <div className="stat"><span className="stat-ico"><ShieldCheck size={20}/></span><div><strong style={{fontSize:16,lineHeight:1.3}}>Private</strong><span>Results visible only to you</span></div></div>
 </div>
 <h2 className="section-title">All tests</h2>
 {!list.length?<div className="empty card"><span className="stat-ico"><BookOpen size={30}/></span><h2>Your first test starts here</h2><p>Add your questions and correct answers, or import a JSON file. Then open entry when the class is ready.</p><div className="row" style={{justifyContent:'center'}}><button className="btn primary" onClick={()=>V('create')}><Plus size={18}/> Create your first test</button><button className="btn" onClick={()=>importInput.current?.click()}><Upload size={17}/> Import</button></div></div>
 :<div className="tests">{[...list].sort((a,b)=>(b.open-a.open)||((b.created||0)-(a.created||0))).map(e=><article className="card test" key={e.id}>
 <div><div className="test-top"><span className="badge plain">{e.course}</span><span className={'badge '+(e.open?'ok':'')}>{e.open?'Entry open':'Entry closed'}</span></div>
 <h3>{e.title}</h3>
 <div className="test-meta"><span><ListChecks size={15}/>{JSON.parse(e.questions).length} questions</span><span><Clock size={15}/>{e.minutes} minutes</span><span><Users size={15}/>{e.roster?e.roster+' on class list':'No class list'}</span></div></div>
 <div className="code-chip"><div><small>Access code</small><strong>{e.code}</strong></div><button className="btn ghost sm" aria-label={'Copy access code '+e.code} onClick={()=>copyCode(e.code)}>{copied===e.code?<><Check size={16}/> Copied</>:<Copy size={16}/>}</button></div>
 <div className="test-actions">
 <button className={'btn sm'+(e.open?'':' primary')} disabled={busy} onClick={()=>run(async()=>{await api({action:'toggle',id:e.id,open:!e.open});await admin()})}>{e.open?'Close entry':'Open entry'}</button>
 <button className="btn sm" onClick={()=>run(async()=>{S(e);await loadResults(e.id);V('results')})}>View results <ArrowRight size={15}/></button>
 <button className="btn sm" disabled={busy} onClick={()=>run(async()=>{S(e);RM('');RT((await api({action:'getroster',id:e.id})).text);V('roster')})}><Users size={15}/> Class list ({e.roster||0})</button>
 <button className="btn sm danger" disabled={busy} onClick={()=>{if(confirm("Delete "+e.title+" and its saved attempts/results? This cannot be undone. Close entry first; tests with active attempts cannot be deleted."))run(async()=>{await api({action:"delete",id:e.id});await admin()})}}><Trash2 size={15}/> Delete</button>
 </div>
 </article>)}</div>}
 <p className="footnote"><Info size={16}/>Closing entry stops new students joining. Students already writing keep their full time.</p>
 </section>}

 {/* ───────── Admin: access requests ───────── */}
 {view==='requests'&&<section>
 <div className="page-head"><div><span className="eyebrow">Pilot</span><h1>Access requests</h1><p>Lecturers who asked to join from the public website.</p></div><button className="btn" disabled={busy} onClick={loadRequests}><RefreshCw size={16}/> Refresh</button></div>
 {!requests?.length?<div className="empty card"><span className="stat-ico"><Inbox size={30}/></span><h2>No requests yet</h2><p>When a lecturer fills in the Request access form, they will appear here.</p></div>
 :<div className="card table-wrap"><table><thead><tr><th>Name</th><th>Institution</th><th>Email</th><th>Received</th></tr></thead><tbody>{requests.map(r=><tr key={r.id}><td><strong>{r.name}</strong></td><td>{r.institution}</td><td><a href={'mailto:'+r.email}><Mail size={14} style={{verticalAlign:-2,marginRight:6}}/>{r.email}</a></td><td className="nowrap muted">{new Date(r.created).toLocaleDateString(undefined,{day:'numeric',month:'short',year:'numeric'})}</td></tr>)}</tbody></table></div>}
 </section>}

 {/* ───────── Admin: class list ───────── */}
 {view==='roster'&&selected&&<section className="narrow">
 <button className="link-btn back" onClick={admin}><ChevronLeft size={16}/> Back to tests</button>
 <div className="page-head"><div><span className="eyebrow">Class list</span><h1>{selected.title}</h1><p>Only students on this list can join, and each must enter a matching name.</p></div></div>
 <div className="card roster-box stack">
 <label className="field">One student per line: REG NUMBER, Full Name<textarea rows={14} value={rosterText} onChange={e=>RT(e.target.value)} placeholder={'UG20/MDMD/1001, FATIMA Ardo Abubakar'} spellCheck={false}/></label>
 <div className="row" style={{justifyContent:'space-between'}}>
 <span className="muted small">{rosterText.split('\n').filter(x=>x.trim()).length} lines</span>
 <div className="row"><label className="btn file-pick"><FileUp size={17}/> Load CSV or text file<input type="file" accept=".csv,.txt,text/csv,text/plain" aria-label="Load class list file" onChange={e=>{const file=e.target.files?.[0];e.target.value='';if(file)file.text().then(RT)}}/></label>
 <button className="btn primary" disabled={busy} onClick={()=>run(async()=>{const d=await api({action:'setroster',id:selected.id,text:rosterText});RM(d.count?('Saved '+d.count+' students.'+(d.skipped?(' '+d.skipped+' unreadable line(s) were skipped.'):'')):'Class list cleared. Anyone with the code can join.')})}><Check size={17}/> Save class list</button></div>
 </div>
 {rosterMsg&&<div role="status" className="alert ok" style={{margin:0}}><CircleCheck size={18}/><div><strong>{rosterMsg}</strong></div></div>}
 </div>
 <p className="footnote"><Info size={16}/>Names are matched loosely (any order, capital letters ignored, small spelling slips allowed), but at least two names must match. Save an empty list to switch the check off. Student names are private; never put this list in GitHub.</p>
 </section>}

 {/* ───────── Admin: create test ───────── */}
 {view==='create'&&<section className="narrow">
 <button className="link-btn back" onClick={admin}><ChevronLeft size={16}/> Back to tests</button>
 <div className="page-head"><div><span className="eyebrow">New test</span><h1>Create a test</h1><p>Four options per question, one correct answer, one mark each.</p></div></div>
 <form onSubmit={create}>
 <div className="card editor-meta">
 <label className="field">Test title<input name="title" required maxLength={150} placeholder="e.g. CAT 1: Cardiovascular physiology"/></label>
 <label className="field">Course code<input required name="course" placeholder="e.g. PHY 501"/></label>
 <label className="field">Minutes<input required name="minutes" type="number" min={1} max={180} defaultValue={20}/></label>
 </div>
 {questions.map((qq,i)=><div className="card q-edit" key={i}>
 <div className="q-edit-head"><h3><span className="q-badge">{i+1}</span>Question {i+1}</h3>{questions.length>1&&<button type="button" className="btn ghost sm" onClick={()=>Q(questions.filter((_,j)=>i!==j))}><Trash2 size={15}/> Remove</button>}</div>
 <label className="field">Question<textarea required maxLength={2000} value={qq.text} onChange={e=>Q(questions.map((x,j)=>i===j?{...x,text:e.target.value}:x))} placeholder="What would you like to ask?"/></label>
 <div className="opt-edit">{qq.options.map((o:string,k:number)=><label key={k} className={qq.correct===k?'is-correct':''}><span className="letter">{L4(k)}</span><input aria-label={'Option '+L4(k)} required maxLength={500} value={o} placeholder={'Option '+L4(k)} onChange={e=>Q(questions.map((x,j)=>i===j?{...x,options:x.options.map((v:string,n:number)=>n===k?e.target.value:v)}:x))}/></label>)}</div>
 <label className="answerselect">Correct answer<select aria-label={"Correct answer for question "+(i+1)} required value={qq.correct<0?"":String(qq.correct)} onChange={e=>Q(questions.map((x,j)=>i===j?{...x,correct:Number(e.target.value)}:x))}><option value="" disabled>Choose the correct option</option>{qq.options.map((o:string,k:number)=><option key={k} value={k}>{L4(k)} — {o||"Option "+L4(k)}</option>)}</select></label>
 </div>)}
 <div className="sticky-save"><button type="button" className="btn" disabled={questions.length>=100} onClick={()=>Q([...questions,blank()])}><Plus size={16}/> Add question</button><span className="muted small">{questions.length} question{questions.length===1?'':'s'}</span><button className="btn primary" disabled={busy}>Save test <Check size={17}/></button></div>
 </form>
 </section>}

 {/* ───────── Student: ended / done ───────── */}
 {view==='exit'&&<section className="card receipt raised"><span className="receipt-ico warn"><Lock size={32}/></span><span className="eyebrow">Test locked</span><h1>Your test has ended</h1><p>You left the test screen, so your answers are being submitted automatically. They can no longer be changed.</p><p><strong>Keep this page open</strong> until the completion message appears.</p><button className="btn primary lg" onClick={sendExit}><RefreshCw size={17}/> Retry submission</button></section>}
 {view==='done'&&<section className="card receipt raised"><span className="receipt-ico ok"><Check size={36}/></span><span className="eyebrow">All done</span><h1>Test submitted</h1><p>Your answers were received. Your lecturer will share your result separately.</p><p className="receipt-note muted">You can now close this page.</p></section>}

 {/* ───────── Admin: answer sheet ───────── */}
 {view==='review'&&detail&&<section className="narrow">
 <button className="link-btn back" onClick={()=>V('results')}><ChevronLeft size={16}/> Back to results</button>
 <div className="page-head"><div><span className="eyebrow">Student answer sheet</span><h1>{detail.name||detail.matric}</h1><p><span className="mono">{detail.matric}</span> · {selected?.title}</p></div><button className="btn no-print" onClick={()=>window.print()}><Printer size={17}/> Print</button></div>
 <div className="card sheet-summary">
 <div className="sheet-score">{detail.score??'—'}<small> / {detail.total}</small></div>
 <div className="stack" style={{gap:8}}>
 <div className="sheet-counts"><span className="badge ok">{detail.sheet.filter((x:any)=>x.status==='correct').length} correct</span><span className="badge danger">{detail.sheet.filter((x:any)=>x.status==='wrong').length} wrong</span><span className="badge warn">{detail.sheet.filter((x:any)=>x.status==='blank').length} not answered</span></div>
 <p className="muted small"><span className={'badge plain '+endedTone(detail.ended)}>{detail.ended}</span>{detail.submitted?' · '+new Date(detail.submitted).toLocaleString():''}</p>
 </div>
 </div>
 {detail.sheet.map((x:any)=><div className={'card ans '+x.status} key={x.n}>
 <div className="ans-head"><p><strong>Q{x.n}.</strong> {x.text}</p>{x.status==='blank'&&<span className="badge warn">Not answered</span>}</div>
 <p className="shown">Shown to this student as question {x.shownAs??'—'}</p>
 {x.options.map((o:any)=>{const isC=o.id===x.correct,isCh=o.id===x.chosen;return <div key={o.id} className={'ans-opt'+(isC?' correct':isCh?' chosen-wrong':'')}><span aria-hidden="true">{isCh?'●':'○'}</span><span>{o.text}</span>{isC&&<em>{isCh?'✓ Correct · chosen':'✓ Correct answer'}</em>}{isCh&&!isC&&<em>✗ Chosen by student</em>}</div>})}
 </div>)}
 <details className="card disclosure"><summary>Recorded events ({detail.flags.length})</summary><div className="disclosure-body">{detail.flags.length?detail.flags.map((f:any,i:number)=><p key={i} className="small">{new Date(f.at).toLocaleTimeString()} · {f.type}</p>):<p className="muted">None.</p>}<p className="muted small" style={{marginTop:10}}>Events are what the browser reported. They are not proof of cheating.</p></div></details>
 </section>}

 {/* ───────── Admin: results ───────── */}
 {view==='results'&&selected&&<section>
 <button className="link-btn back" onClick={admin}><ChevronLeft size={16}/> Back to tests</button>
 <div className="page-head"><div><span className="eyebrow">Private results</span><h1>{selected.title}</h1><p>{selected.course} · {results.length} joined{summary.absent.length?' · '+summary.absent.length+' did not join':''}</p></div>
 <div className="row"><button className="btn" disabled={busy} onClick={()=>run(()=>loadResults(selected.id))}><RefreshCw size={16} className={busy?'spin':''}/> Refresh</button><button className="btn primary" onClick={csv}><Download size={17}/> Export CSV</button></div></div>
 <div className="kpis">
 <div className="kpi lead"><span>Mean score</span><strong>{statRows.length?mean.toFixed(1):'—'}<small className="muted" style={{fontSize:15}}> / {outOf}</small></strong></div>
 <div className="kpi"><span>Median</span><strong>{statRows.length?median:'—'}</strong></div>
 <div className="kpi"><span>Highest</span><strong>{statRows.length?scores[scores.length-1]:'—'}</strong></div>
 <div className="kpi"><span>Lowest</span><strong>{statRows.length?scores[0]:'—'}</strong></div>
 </div>
 <div className="results-split">
 <div className="card panel"><h2>Score distribution</h2><div className="bars">{bands.map(([label,n]:any)=><div className="bar" key={label}><span>{label}</span><span className="bar-track"><span style={{width:(n/bandMax*100)+'%'}}/></span><b>{n}</b></div>)}</div>
 <label className="check" style={{marginTop:18}}><input type="checkbox" checked={exAuto} onChange={e=>EXA(e.target.checked)}/><span>Leave auto-submitted attempts out of the statistics</span></label>
 <p className="muted tiny" style={{marginTop:6}}>Statistics use {statRows.length} submitted attempt{statRows.length===1?'':'s'}.</p></div>
 <div className="card panel"><h2>How attempts ended</h2><div className="ended-list">
 <div><span className="badge ok">Submitted by student</span><b>{endedCount('Submitted by student')}</b></div>
 <div><span className="badge">Time ran out</span><b>{endedCount('Time ran out')}</b></div>
 <div><span className="badge warn">Auto-submitted</span><b>{results.filter(isAuto).length}</b></div>
 <div><span className="badge info">In progress</span><b>{results.filter(r=>!r.submitted).length}</b></div>
 {summary.absent.length>0&&<div><span className="badge danger">Did not join</span><b>{summary.absent.length}</b></div>}
 </div><p className="muted tiny" style={{marginTop:14}}>Auto-submissions are not proof of cheating: calls, notifications and phone settings can also trigger them.</p></div>
 </div>
 <div className="toolbar">
 <label className="search"><Search size={17}/><input value={q} onChange={e=>SQ(e.target.value)} placeholder="Search name or reg number" aria-label="Search"/></label>
 <select value={fil} onChange={e=>FIL(e.target.value)} aria-label="Filter"><option value="all">All students</option><option value="student">Submitted by student</option><option value="time">Time ran out</option><option value="auto">Auto-submitted</option><option value="progress">In progress</option><option value="warn">Has warnings</option></select>
 <select value={srt} onChange={e=>SRT(e.target.value)} aria-label="Sort"><option value="matric">Sort: reg number</option><option value="name">Sort: name</option><option value="high">Sort: score, high to low</option><option value="low">Sort: score, low to high</option><option value="time">Sort: submitted time</option></select>
 </div>
 <div className="card table-wrap"><table><thead><tr><th>Reg number</th><th>Name</th><th>Score</th><th>How it ended</th><th>Submitted</th><th>Events</th><th><span className="sr-only">Actions</span></th></tr></thead><tbody>{shown.map((r:any)=>{const fl=JSON.parse(r.flags);return <tr key={r.id}>
 <td className="nowrap"><span className="mono">{r.matric}</span></td><td>{r.name||'—'}</td>
 <td className="nowrap"><span className="score">{r.score??'—'}<small> / {r.total}</small></span></td>
 <td><span className={'badge '+endedTone(r.ended)} title={r.ended==='Auto-submitted: exited full screen'?'On some Android phones the Submit pop-up also exits full screen. Check the score and answer sheet before treating this as a problem.':''}>{r.ended}</span></td>
 <td className="nowrap muted">{r.submitted?new Date(r.submitted).toLocaleTimeString():'—'}</td>
 <td>{fl.length?<details className="events"><summary>{fl.length} event{fl.length===1?'':'s'}</summary>{fl.map((f:any,i:number)=><p key={i}>{new Date(f.at).toLocaleTimeString()} · {f.type}</p>)}</details>:<span className="muted">—</span>}</td>
 <td className="nowrap"><button className="link-btn" disabled={busy} onClick={()=>run(async()=>{const d=await api({action:'attemptdetail',id:selected.id,attempt:r.id});DET(d.detail);V('review')})}>Answers <ChevronRight size={15}/></button>{!r.submitted&&<button className="link-btn" style={{marginLeft:12}} disabled={busy} onClick={()=>{if(confirm('Allow '+r.matric+' to rejoin and continue with their saved answers? They must enter their details again; their old phone will stop working. Only do this if the student is physically here.'))run(async()=>{await api({action:'allowrejoin',id:selected.id,attempt:r.id});await loadResults(selected.id)})}}>Allow rejoin</button>}</td>
 </tr>})}</tbody></table>{!shown.length&&<p className="center muted" style={{padding:32}}>{results.length?'No students match this search or filter.':'No students have joined this test yet.'}</p>}</div>
 {summary.absent.length>0&&<details className="card disclosure"><summary>Did not join ({summary.absent.length})</summary><div className="disclosure-body">{summary.absent.map((x:any)=><p key={x.matric} className="small" style={{margin:'6px 0'}}><span className="mono">{x.matric}</span> · {x.name}</p>)}</div></details>}
 {summary.qstats.length>0&&<details className="card disclosure"><summary>Question analysis: how many got each question right</summary><div className="disclosure-body"><div className="table-wrap"><table><thead><tr><th>#</th><th>Question</th><th>Correct</th><th>Answered</th><th>Most chosen option</th></tr></thead><tbody>{summary.qstats.map((x:any)=>{const p=x.answered?Math.round(x.correct/x.answered*100):0;return <tr key={x.n}><td>{x.n}</td><td>{String(x.text).slice(0,90)}</td><td className="nowrap"><span className="pct"><i style={{['--w' as any]:p+'%'}}/><strong>{p}%</strong></span>{x.answered>0&&x.correct/x.answered<0.3&&<span className="badge warn" style={{marginLeft:8}}>Check key</span>}</td><td>{x.answered}</td><td>{x.top?<>{String(x.top.text).slice(0,50)} {x.top.correct?<span className="badge ok plain">✓ key</span>:<span className="badge danger plain">✗ not the key</span>}</>:'—'}</td></tr>})}</tbody></table></div><p className="muted small" style={{marginTop:12}}>"Check key" appears when under 30% of students got a question right. It can mean a hard question or a wrong answer key, so look at it. Counts include every attempt, even ones that ended early.</p></div></details>}
 <p className="footnote"><Info size={16}/>"How it ended" comes from what the browser reported. Auto-submissions are not proof of cheating: calls, notifications and phone settings can also trigger them.</p>
 </section>}
 </main>
 <footer className="app-foot"><div><span>© Classroom Check by NextKind</span><span><a href="/privacy">Privacy</a> · <a href="/faq">FAQ</a></span><span><ShieldCheck size={14}/> Supervised by people. Supported by technology.</span></div></footer>
 </div>;
}
