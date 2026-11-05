import Shell from '../site/Shell';
export const metadata = { title: 'How it works — Classroom Check' };
const Step = ({ n, t, items }: { n: string; t: string; items: string[] }) => <div className="sx-card"><div className="sx-eb" style={{ marginBottom: 12 }}>{n}</div><h3 className="sx-h3" style={{ fontSize: 26, marginBottom: 14 }}>{t}</h3><ul style={{ margin: 0, paddingLeft: 20, color: 'var(--mut)', display: 'grid', gap: 8 }}>{items.map(i => <li key={i}>{i}</li>)}</ul></div>;
export default function How() {
  return <Shell active="how">
    <section style={{ padding: '48px 0 8px', maxWidth: 700 }}><p className="sx-eb" style={{ marginBottom: 14 }}>How it works</p><h1 className="sx-h1" style={{ marginBottom: 18 }}>Three steps, one exam hall.</h1><p className="sx-lead">From question file to marked results in a single sitting.</p></section>
    <section className="sx-grid" style={{ marginTop: 40 }}>
      <Step n="1 · Set up" t="You prepare the exam" items={['Import your questions', 'Upload your class list', 'Open entry and share the access code']} />
      <Step n="2 · Sit" t="Students join on phones" items={['Reg number and name verified', 'Shuffled questions, personal timer', 'Answers saved as they go']} />
      <Step n="3 · Review" t="You see what happened" items={['Scores and statistics at once', 'How each attempt ended', 'Every student’s answer sheet']} />
    </section>
    <section className="sx-card" style={{ marginTop: 28, background: 'var(--soft)', borderColor: 'var(--soft)', padding: 40 }}>
      <h2 className="sx-h2" style={{ marginBottom: 14 }}>Honest about security</h2>
      <p style={{ marginBottom: 18, maxWidth: 720, fontSize: 18 }}>No website can make phone exams cheat-proof. Classroom Check is built for supervised rooms: it discourages leaving the exam, records what the browser reports, and gives you the evidence to decide.</p>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}><span className="sx-chip">Leave-the-page detection</span><span className="sx-chip">Time-stamped event log</span><span className="sx-chip">Supervisor-friendly</span></div>
    </section>
    <section className="sx-sec" style={{ textAlign: 'center' }}><a className="sx-btn" href="/signup">Request access</a></section>
  </Shell>;
}
