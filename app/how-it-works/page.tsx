import Shell from '../site/Shell';
import { ShieldCheck } from 'lucide-react';
export const metadata = { title: 'How it works — Classroom Check' };
const Step = ({ n, t, items }: { n: string; t: string; items: string[] }) => <div className="sx-card"><p className="sx-eb" style={{ marginBottom: 8 }}>{n}</p><h3 className="sx-h3">{t}</h3><ul>{items.map(i => <li key={i}>{i}</li>)}</ul></div>;
export default function How() {
  return <Shell active="how">
    <section className="sx-pagehead"><p className="sx-eb">How it works</p><h1 className="sx-h1">Three steps, one exam hall.</h1><p className="sx-lead">From question file to marked results in a single sitting.</p></section>
    <section className="sx-flow sx-steps">
      <Step n="Set up" t="You prepare the exam" items={['Import your questions', 'Upload your class list', 'Open entry and share the access code']} />
      <Step n="Sit" t="Students join on phones" items={['Reg number and name verified', 'Shuffled questions, personal timer', 'Answers saved as they go']} />
      <Step n="Review" t="You see what happened" items={['Scores and statistics at once', 'How each attempt ended', 'Every student’s answer sheet']} />
    </section>
    <section className="sx-note-panel">
      <ShieldCheck size={28} aria-hidden="true" />
      <div>
        <h2 className="sx-h2">Honest about security</h2>
        <p>No website can make phone exams cheat-proof. Classroom Check is built for supervised rooms: it discourages leaving the exam, records what the browser reports, and gives you the evidence to decide.</p>
        <div className="sx-chips"><span className="sx-chip">Leave-the-page detection</span><span className="sx-chip">Time-stamped event log</span><span className="sx-chip">Supervisor-friendly</span></div>
      </div>
    </section>
    <section className="sx-cta"><h2 className="sx-h2">Ready for your next CAT?</h2><p>Join the pilot and we will help you set up your first test.</p><div className="sx-actions"><a className="sx-btn" href="/signup">Request access</a><a className="sx-btn o" href="/faq">Read the FAQ</a></div></section>
  </Shell>;
}
