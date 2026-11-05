import Shell from './site/Shell';
export const metadata = { title: 'Classroom Check — supervised exams on the phones already in the room', description: 'Run large-class exams on students’ own phones. Class-list check, auto-save, instant marking and a per-student answer sheet.' };
export default function Home() {
  return <Shell>
    <section className="sx-hero">
      <div style={{ flex: '1 1 460px' }}>
        <p className="sx-eb" style={{ marginBottom: 16 }}>Phone-based exams for large classes</p>
        <h1 className="sx-h1" style={{ marginBottom: 22 }}>Run your exam on the phones already in the room.</h1>
        <p className="sx-lead" style={{ marginBottom: 30 }}>Import your questions, upload your class list, share a code. Students join on their own phones, and every attempt is marked and recorded the moment time is up.</p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14 }}><a className="sx-btn" href="/signup">Request access</a><a className="sx-btn o" href="/how-it-works">See how it works</a></div>
        <p style={{ fontSize: 14, color: 'var(--mut)', marginTop: 22 }}>First real sitting: 101 students, 50 questions, 60 minutes.</p>
        <p style={{ fontSize: 15, marginTop: 14 }}>Taking an exam today? <a href="/join" style={{ color: 'var(--g)', fontWeight: 700 }}>Join with your access code →</a></p>
      </div>
      <div style={{ flex: '1 1 340px', display: 'flex', justifyContent: 'center', padding: 16 }} aria-hidden="true">
        <div className="sx-phone">
          <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: 13 }}><span style={{ color: 'var(--mut)' }}>Question 7 of 50</span><span style={{ color: 'var(--g)' }}>42:08</span></div>
          <div style={{ fontWeight: 700 }}>Which nerve supplies the diaphragm?</div>
          <div className="sx-opt">A · Vagus</div><div className="sx-opt on">B · Phrenic</div><div className="sx-opt">C · Intercostal</div>
          <div style={{ fontSize: 13, color: 'var(--g)', fontWeight: 700, marginTop: 6 }}>All answers saved</div>
        </div>
      </div>
    </section>
    <section className="sx-sec">
      <h2 className="sx-h2" style={{ marginBottom: 28, maxWidth: 640 }}>Everything a supervised exam needs, nothing it doesn’t.</h2>
      <div className="sx-grid">
        <div className="sx-card"><h3 className="sx-h3" style={{ marginBottom: 10 }}>Right student, right name</h3><p style={{ color: 'var(--mut)' }}>Students enter their reg number and full name, checked against your uploaded class list.</p></div>
        <div className="sx-card"><h3 className="sx-h3" style={{ marginBottom: 10 }}>Saved as they go</h3><p style={{ color: 'var(--mut)' }}>Answers save continuously and the exam submits on time, so a flat battery isn’t a disaster.</p></div>
        <div className="sx-card"><h3 className="sx-h3" style={{ marginBottom: 10 }}>Marked and explained</h3><p style={{ color: 'var(--mut)' }}>Scores, how each attempt ended, and a per-student answer sheet, the moment it’s over.</p></div>
      </div>
    </section>
    <section className="sx-band"><div className="sx-grid" style={{ textAlign: 'center' }}>
      <div><div className="n">101</div><div>students on their own phones</div></div>
      <div><div className="n">50</div><div>questions in one sitting</div></div>
      <div><div className="n">60</div><div>minutes, marked instantly</div></div>
    </div></section>
    <section className="sx-sec" style={{ textAlign: 'center' }}><h2 className="sx-h2" style={{ marginBottom: 22 }}>Run your next CAT on Classroom Check.</h2><a className="sx-btn" href="/signup">Request access</a></section>
  </Shell>;
}
