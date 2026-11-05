import { ArrowRight, Check, CheckCircle2, ClipboardCheck, Clock3, Save, UsersRound } from 'lucide-react';
import Shell from './site/Shell';
export const metadata = { title: 'Classroom Check — supervised exams on the phones already in the room', description: 'Run large-class exams on students’ own phones. Class-list check, auto-save, instant marking and a per-student answer sheet.' };
export default function Home() {
  return <Shell>
    <section className="sx-hero">
      <div className="sx-hero-copy">
        <p className="sx-eb">Phone-based exams for large classes</p>
        <h1 className="sx-h1">Run your exam on the phones <span>already in the room.</span></h1>
        <p className="sx-lead">Import your questions, upload your class list, share a code. Students join on their own phones, and every attempt is marked and recorded the moment time is up.</p>
        <div className="sx-actions"><a className="sx-btn" href="/signup">Request access <ArrowRight size={16} aria-hidden="true" /></a><a className="sx-btn o" href="/how-it-works">See how it works</a></div>
        <p className="sx-hero-note">First real sitting: 101 students, 50 questions, 60 minutes.</p>
        <p className="sx-student-link">Taking an exam today? <a href="/join">Join with your access code <ArrowRight size={14} aria-hidden="true" /></a></p>
      </div>
      <div className="sx-card sx-preview" aria-label="Example student test preview">
        <div className="sx-card-top"><span>Student experience</span><span>Example preview</span></div>
        <div className="sx-preview-meta"><span>Question 7 of 50</span><span className="sx-preview-time"><Clock3 size={17} aria-hidden="true" />42:08</span></div>
        <div className="sx-progress" aria-hidden="true"><span /></div>
        <h2>Which nerve supplies the diaphragm?</h2>
        <div className="sx-options">
          <div className="sx-opt"><span>A</span>Vagus</div>
          <div className="sx-opt on"><span>B</span>Phrenic<CheckCircle2 size={18} aria-label="Selected answer" /></div>
          <div className="sx-opt"><span>C</span>Intercostal</div>
          <div className="sx-opt"><span>D</span>Accessory</div>
        </div>
        <div className="sx-save-status"><Check size={14} aria-hidden="true" />All answers saved</div>
      </div>
    </section>
    <section className="sx-sec">
      <h2 className="sx-h2 sx-section-title">Everything a supervised exam needs, nothing it doesn’t.</h2>
      <div className="sx-grid">
        <div className="sx-card sx-feature"><div className="sx-feature-icon"><UsersRound size={21} aria-hidden="true" /></div><h3 className="sx-h3">Right student, right name</h3><p>Students enter their reg number and full name, checked against your uploaded class list.</p></div>
        <div className="sx-card sx-feature"><div className="sx-feature-icon"><Save size={21} aria-hidden="true" /></div><h3 className="sx-h3">Saved as they go</h3><p>Answers save continuously and the exam submits on time, so a flat battery isn’t a disaster.</p></div>
        <div className="sx-card sx-feature"><div className="sx-feature-icon"><ClipboardCheck size={21} aria-hidden="true" /></div><h3 className="sx-h3">Marked and explained</h3><p>Scores, how each attempt ended, and a per-student answer sheet, the moment it’s over.</p></div>
      </div>
    </section>
    <section className="sx-band" aria-label="First real sitting">
      <div className="sx-stat"><div className="n">101</div><p>students on their own phones</p></div>
      <div className="sx-stat"><div className="n">50</div><p>questions in one sitting</p></div>
      <div className="sx-stat"><div className="n">60</div><p>minutes, marked instantly</p></div>
    </section>
    <section className="sx-cta"><h2 className="sx-h2">Run your next CAT on Classroom Check.</h2><a className="sx-btn" href="/signup">Request access <ArrowRight size={16} aria-hidden="true" /></a></section>
  </Shell>;
}
