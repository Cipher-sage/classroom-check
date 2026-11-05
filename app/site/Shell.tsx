import './site.css';
export const BRAND = 'Classroom Check';
const Link = ({ href, cur, children }: { href: string; cur?: boolean; children: React.ReactNode }) => <a href={href} aria-current={cur ? 'page' : undefined}>{children}</a>;
export default function Shell({ children, active }: { children: React.ReactNode; active?: string }) {
  return <div className="sx">
    <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:wght@600;800&family=DM+Sans:wght@400;500;700&display=swap" />
    <div className="sx-w">
      <header className="sx-nav">
        <a className="sx-brand" href="/"><span className="sx-mark" />{BRAND}</a>
        <nav className="sx-links" aria-label="Main"><Link href="/how-it-works" cur={active === 'how'}>How it works</Link><Link href="/faq" cur={active === 'faq'}>FAQ</Link></nav>
        <div className="sx-r"><a className="sx-lnk" href="/join">Join an exam</a><a className="sx-lnk" href="/admin">Log in</a><a className="sx-btn" href="/signup">Request access</a></div>
      </header>
      {children}
      <footer className="sx-ft"><span>© {BRAND} · Supervised exams on the phones already in the room</span><span><a href="/privacy">Privacy</a> · <a href="/signup">Request access</a></span></footer>
    </div>
  </div>;
}
