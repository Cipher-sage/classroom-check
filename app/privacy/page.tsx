import Shell from '../site/Shell';
export const metadata = { title: 'Privacy — Classroom Check' };
export default function Privacy() {
  return <Shell>
    <section className="sx-pagehead">
      <p className="sx-eb">Privacy</p>
      <h1 className="sx-h1">What Classroom Check stores, in plain words.</h1>
      <p className="sx-lead">Classroom Check is in a pilot. This page describes what the service does today. It will be updated as the service grows. Last updated: November 2026.</p>
    </section>
    <section className="sx-prose">
      <h2 className="sx-h2">Students</h2>
      <p>When you take a test, we store your registration number, your full name, your answers, your score, the times you joined and submitted, and events the browser reports during the test (for example, leaving the test page, losing focus or a change in screen size).</p>
      <p>We use this only so your lecturer can run and mark the test and review how it went. It is shown to the lecturer who ran your test, and not to other lecturers or students.</p>
      <h2 className="sx-h2">Lecturers</h2>
      <p>If you request access we store your name, institution and email so we can contact you about the pilot. Tests, class lists and results you create are private to your account.</p>
      <h2 className="sx-h2">Where it is kept</h2>
      <p>Data is stored with our hosting provider, Cloudflare. We do not sell personal data and we do not use it for advertising.</p>
      <h2 className="sx-h2">Keeping and deleting data</h2>
      <p>A lecturer can delete a test, which removes its student attempts. Lecturers can also download a backup of their own tests; those files are then in the lecturer’s hands. If you want data about you removed, ask the lecturer who ran your test, or <a href="/signup">contact us</a>.</p>
      <h2 className="sx-h2">Questions</h2>
      <p>Use the <a href="/signup">request access</a> page to get in touch while we set up a dedicated contact address.</p>
    </section>
  </Shell>;
}
