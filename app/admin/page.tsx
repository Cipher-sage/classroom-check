import Classroom from '../classroom';
import {getAdminUser,authConfigured} from '../auth';
import {isAdmin} from '../admin-auth';
import AdminSession from './session';
export const dynamic='force-dynamic';
export default async function AdminPage(){
 const user=await getAdminUser();
 if(!user||!isAdmin(user))return <main className="admin-login"><section className="card"><p className="eyebrow">CAT 500 LEVEL TEST · PRIVATE ADMIN</p><h1 className="smalltitle">Administrator sign in</h1>{authConfigured()?<><p>Sign in with your authorized GitHub account to manage tests and view private results.</p><a className="primary authlink" href="/api/auth/github">Sign in with GitHub</a></>:<p>Administrator sign-in is being configured. Please contact the site owner.</p>}<p className="muted">Student access codes cannot open this dashboard.</p><a href="/">Student test entry</a></section></main>;
 return <AdminSession expiresAt={user.expiresAt}><Classroom adminMode/></AdminSession>;
}
