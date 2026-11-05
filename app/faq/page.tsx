import Shell from '../site/Shell';
export const metadata = { title: 'FAQ — Classroom Check' };
const QA: [string, string][] = [
  ['Do we need a computer lab?', 'No. Students join on their own smartphones in a supervised room, using a web browser. Nothing to install.'],
  ['What do students need?', 'A smartphone with a modern browser (Chrome or Safari), a charged battery and mobile data. They enter their registration number, full name and your access code.'],
  ['Can it stop cheating?', 'Not completely, and no website can. Classroom Check is built for supervised rooms: leaving the exam page can auto-submit the attempt, events are time-stamped for you to review, and invigilators stay in charge.'],
  ['What if a student’s phone dies or loses signal?', 'Answers are saved as the student goes. If an attempt is still in progress, a supervisor can let the student rejoin on another phone and continue with the saved answers.'],
  ['How does the class-list check work?', 'You upload your class list. A student can only join if their registration number and full name match it.'],
  ['Does it work for large classes?', 'It has run a real exam with 101 students at once, and has been load-tested with 102 simulated students.'],
  ['Which question types are supported?', 'Multiple choice, with four options per question, at the moment.'],
  ['Who can see the results and class lists?', 'Only the lecturer who runs the exam. See our privacy page for what we store.'],
  ['Can students see their answers afterwards?', 'Not yet. A review page that you can release after the exam is planned.'],
];
export default function Faq() {
  return <Shell active="faq">
    <section className="sx-pagehead"><p className="sx-eb">FAQ</p><h1 className="sx-h1">Questions lecturers ask us.</h1><p className="sx-lead">Straight answers, including what Classroom Check can’t do.</p></section>
    <section className="sx-faq">{QA.map(([q, a]) => <div className="sx-card sx-faq-item" key={q}><h3 className="sx-h3">{q}</h3><p>{a}</p></div>)}</section>
    <section className="sx-cta"><a className="sx-btn" href="/signup">Request access</a></section>
  </Shell>;
}
