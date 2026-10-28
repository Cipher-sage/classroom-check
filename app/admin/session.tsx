'use client';
import {useEffect,useRef,useState} from 'react';
import {flushSync} from 'react-dom';

const IDLE_MS=10*60*1000;
export default function AdminSession({children,expiresAt}:{children:React.ReactNode;expiresAt:number}){
 const [locked,setLocked]=useState(false);
 const signOut=useRef<HTMLFormElement>(null);
 useEffect(()=>{
  let lastActivity=Date.now(),ending=false;
  const check=()=>{
   if(!ending&&(Date.now()-lastActivity>=IDLE_MS||Date.now()>=expiresAt)){ending=true;signOut.current?.requestSubmit();}
  };
  const activity=(event:Event)=>{
   check();
   if(!ending&&event.isTrusted)lastActivity=Date.now();
  };
  const events=['pointerdown','keydown','touchstart','scroll'];
  events.forEach(name=>window.addEventListener(name,activity,{passive:true}));
  window.addEventListener('pageshow',check);
  window.addEventListener('focus',check);
  document.addEventListener('visibilitychange',check);
  const timer=window.setInterval(check,1000);
  return()=>{
   clearInterval(timer);
   events.forEach(name=>window.removeEventListener(name,activity));
   window.removeEventListener('pageshow',check);
   window.removeEventListener('focus',check);
   document.removeEventListener('visibilitychange',check);
  };
 },[expiresAt]);
 return <><div className="admin-security"><span>Private administrator session · signs out after 10 minutes of inactivity</span><form ref={signOut} action="/api/auth/logout" method="post" onSubmit={()=>flushSync(()=>setLocked(true))}><button type="submit">Sign out</button></form></div>{locked?<main className="admin-login"><section className="card"><h1 className="smalltitle">Signing out securely…</h1><p>Your dashboard is hidden. If this page does not redirect, use Sign out above.</p></section></main>:children}</>;
}
