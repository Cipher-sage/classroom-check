import Classroom from '../classroom';
import {getAdminUser,authConfigured} from '../auth';
import {isAdmin} from '../admin-auth';
import AdminSession from './session';
import {BookOpen,Lock} from 'lucide-react';
export const dynamic='force-dynamic';
export const metadata={title:'Admin — Classroom Check'};
export default async function AdminPage(){
 const user=await getAdminUser();
 if(!user||!isAdmin(user))return <div className="app"><main className="admin-login"><section className="card">
 <a className="brand" href="/"><span className="logo"><BookOpen size={19}/></span>Classroom <b>Check</b></a>
 <span className="eyebrow" style={{marginTop:28}}>Private admin</span>
 <h1>Administrator sign in</h1>
 {authConfigured()?<><p>Sign in with your authorised GitHub account to manage tests and view private results.</p><a className="btn primary lg block" href="/api/auth/github">Sign in with GitHub</a></>:<p>Administrator sign-in is being configured. Please contact the site owner.</p>}
 <p className="tiny" style={{display:'flex',gap:8,alignItems:'center'}}><Lock size={14}/>Student access codes cannot open this dashboard.</p>
 <div className="alt"><a href="/join">Student test entry</a><a href="/">Website</a></div>
 </section></main></div>;
 return <AdminSession expiresAt={user.expiresAt}><Classroom adminMode/></AdminSession>;
}
