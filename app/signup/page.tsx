import Shell from '../site/Shell';
import RequestAccess from '../site/RequestAccess';
export const metadata = { title: 'Request access — Classroom Check' };
export default function Signup() {
  return <Shell>
    <section className="sx-signup">
      <div className="sx-signup-copy">
        <div><p className="sx-eb">Invite-only pilot</p><h1 className="sx-h1">Your first exam is a few minutes away.</h1><p className="sx-lead">We’re adding lecturers in small groups so every exam gets proper support. Tell us who you are and we’ll be in touch.</p></div>
        <ol className="sx-onboarding"><li>Request access</li><li>We confirm your account</li><li>Import questions and your class list</li><li>Open entry and share the code</li></ol>
      </div>
      <div className="sx-form-wrap"><RequestAccess /></div>
    </section>
  </Shell>;
}
