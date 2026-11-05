import Shell from '../site/Shell';
import RequestAccess from '../site/RequestAccess';
export const metadata = { title: 'Request access — Classroom Check' };
export default function Signup() {
  return <Shell>
    <section style={{ display: 'flex', flexWrap: 'wrap', gap: 32, alignItems: 'stretch', padding: '32px 0' }}>
      <div style={{ flex: '1 1 420px', background: 'var(--g)', color: '#fff', borderRadius: 28, padding: '48px 40px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: 32 }}>
        <div><p className="sx-eb" style={{ marginBottom: 14, color: 'var(--gold)' }}>Invite-only pilot</p><h1 className="sx-h1" style={{ fontSize: 'clamp(30px,5vw,46px)', marginBottom: 18, color: '#fff' }}>Your first exam is a few minutes away.</h1><p style={{ fontSize: 18, opacity: 0.92 }}>We’re adding lecturers in small groups so every exam gets proper support. Tell us who you are and we’ll be in touch.</p></div>
        <ol style={{ margin: 0, paddingLeft: 22, display: 'grid', gap: 10, fontSize: 17 }}><li>Request access</li><li>We confirm your account</li><li>Import questions and your class list</li><li>Open entry and share the code</li></ol>
      </div>
      <div style={{ flex: '1 1 380px' }}><RequestAccess /></div>
    </section>
  </Shell>;
}
