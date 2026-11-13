import { ArrowRight, Check, CircleCheck, ClipboardCheck, Clock3, CloudOff, FileX, Lock, Save, ShieldCheck, Smartphone, Type, UsersRound, ChartColumn } from 'lucide-react';
import Shell from './site/Shell';
export const metadata = { title: 'Classroom Check — supervised exams on the phones already in the room', description: 'Run large-class exams on students’ own phones. Class-list check, auto-save, instant marking and a per-student answer sheet.' };
export default function Home() {
  return <Shell>
    <section className="sx-hero">
      <div>
        <p className="sx-eb">Made in Nigeria · for large classes</p>
        <h1 className="sx-h1">Run your exam on the phones <span>already in the room.</span></h1>
        <p className="sx-lead">Import your questions, upload your class list and share a code. Students join in their browser, answers save as they go, and every attempt is marked the moment time is up.</p>
        <div className="sx-actions"><a className="sx-btn" href="/signup">Request access <ArrowRight size={16} aria-hidden="true" /></a><a className="sx-btn o" href="/how-it-works">See how it works</a></div>
        <div className="sx-trust"><span><Check size={16} aria-hidden="true" />No app to install</span><span><Check size={16} aria-hidden="true" />No student accounts</span><span><Check size={16} aria-hidden="true" />No printed papers</span></div>
        <div className="sx-student"><span>Taking a test today?</span><a href="/join">Join with your access code <ArrowRight size={15} aria-hidden="true" /></a></div>
      </div>
      <div className="sx-phone-wrap" aria-label="Example of the student test screen" role="img">
        <div className="sx-phone"><div className="sx-screen">
          <div className="sx-sbar"><strong>CAT 1 · Anatomy<small>UG20/MDMD/1001</small></strong><span className="sx-time"><Clock3 size={14} aria-hidden="true" />42:08</span></div>
          <div className="sx-pbar"><span /></div>
          <div className="sx-sbody">
            <div className="sx-smeta"><span>7 of 50 answered</span><b><CircleCheck size={12} aria-hidden="true" />All answers saved</b></div>
            <div className="sx-q">
              <p className="sx-eb">Question 7 of 50</p>
              <h3>Which nerve supplies the diaphragm?</h3>
              <div className="sx-opt"><span>A</span>Vagus</div>
              <div className="sx-opt on"><span>B</span>Phrenic<Check size={16} aria-hidden="true" /></div>
              <div className="sx-opt"><span>C</span>Intercostal</div>
              <div className="sx-opt"><span>D</span>Accessory</div>
            </div>
            <div className="sx-snav"><span>Previous</span><span className="p">Next</span></div>
          </div>
        </div></div>
      </div>
    </section>

    <section className="sx-sec">
      <div className="sx-sec-head"><p className="sx-eb">How it works</p><h2 className="sx-h2">From question file to marked results in one sitting.</h2></div>
      <div className="sx-flow">
        <div className="sx-card"><h3 className="sx-h3">You set up the test</h3><ul><li>Type or import your questions</li><li>Upload your class list</li><li>Open entry and share the code</li></ul></div>
        <div className="sx-card"><h3 className="sx-h3">Students sit it on their phones</h3><ul><li>Reg number and name checked</li><li>Shuffled questions, one timer</li><li>Answers saved as they go</li></ul></div>
        <div className="sx-card"><h3 className="sx-h3">You review privately</h3><ul><li>Scores and statistics at once</li><li>Every student’s answer sheet</li><li>Question analysis and CSV export</li></ul></div>
      </div>
    </section>

    <section className="sx-sec">
      <div className="sx-sec-head"><p className="sx-eb">Features</p><h2 className="sx-h2">Everything a supervised exam needs, nothing it doesn’t.</h2></div>
      <div className="sx-grid">
        <div className="sx-card sx-feature"><div className="sx-feature-icon"><UsersRound size={22} aria-hidden="true" /></div><h3 className="sx-h3">Right student, right name</h3><p>Students enter their reg number and full name, checked against your class list.</p></div>
        <div className="sx-card sx-feature"><div className="sx-feature-icon"><Save size={22} aria-hidden="true" /></div><h3 className="sx-h3">Saved as they go</h3><p>Each answer is sent to the server as it is chosen, and the test submits on time.</p></div>
        <div className="sx-card sx-feature"><div className="sx-feature-icon"><ClipboardCheck size={22} aria-hidden="true" /></div><h3 className="sx-h3">Marked instantly</h3><p>Scores, how each attempt ended, and a printable answer sheet per student.</p></div>
        <div className="sx-card sx-feature"><div className="sx-feature-icon"><ChartColumn size={22} aria-hidden="true" /></div><h3 className="sx-h3">Question analysis</h3><p>See which questions most students missed, and spot a possible wrong answer key.</p></div>
        <div className="sx-card sx-feature"><div className="sx-feature-icon"><ShieldCheck size={22} aria-hidden="true" /></div><h3 className="sx-h3">Supervision support</h3><p>Leaving the test submits it, and browser events are time-stamped for you to review.</p></div>
        <div className="sx-card sx-feature"><div className="sx-feature-icon"><Lock size={22} aria-hidden="true" /></div><h3 className="sx-h3">Private by default</h3><p>Students never see scores or answer keys. Only you see results.</p></div>
      </div>
    </section>

    <section className="sx-sec">
      <div className="sx-inclusive">
        <div><p className="sx-eb">Built for real classrooms</p><h2 className="sx-h2">Designed around the phones and networks students actually have.</h2><p>Many students sit exams on older phones, on mobile data, in rooms with weak signal. Classroom Check is built to keep working for them.</p></div>
        <ul className="sx-ilist">
          <li><Smartphone size={20} aria-hidden="true" /><div><strong>Any modern phone browser</strong><span>Chrome or Safari. Nothing to download.</span></div></li>
          <li><CloudOff size={20} aria-hidden="true" /><div><strong>Clear save status</strong><span>Students see when answers are saved, and when they are offline.</span></div></li>
          <li><Type size={20} aria-hidden="true" /><div><strong>Larger text option</strong><span>One tap makes questions and options easier to read.</span></div></li>
          <li><FileX size={20} aria-hidden="true" /><div><strong>Fewer printed papers</strong><span>Questions are delivered on screen, not on paper.</span></div></li>
        </ul>
      </div>
    </section>

    <section className="sx-sec" aria-label="First real sitting">
      <div className="sx-sec-head"><p className="sx-eb">In use</p><h2 className="sx-h2">Our first real sitting.</h2></div>
      <div className="sx-band">
        <div className="sx-stat"><div className="n">101</div><p>students on their own phones</p></div>
        <div className="sx-stat"><div className="n">50</div><p>questions in one sitting</p></div>
        <div className="sx-stat"><div className="n">60</div><p>minutes, marked instantly</p></div>
      </div>
      <p className="sx-band-note">A supervised continuous assessment with 500-level medical students.</p>
    </section>

    <section className="sx-cta"><h2 className="sx-h2">Run your next CAT on Classroom Check.</h2><p>We are adding lecturers in small groups during the pilot so every exam gets proper support.</p><div className="sx-actions"><a className="sx-btn" href="/signup">Request access <ArrowRight size={16} aria-hidden="true" /></a><a className="sx-btn o" href="/faq">Read the FAQ</a></div></section>
  </Shell>;
}
