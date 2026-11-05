import './site.css';
import { BookOpen } from 'lucide-react';
export const BRAND = 'Classroom Check';
const Link = ({ href, cur, children }: { href: string; cur?: boolean; children: React.ReactNode }) => <a href={href} aria-current={cur ? 'page' : undefined}>{children}</a>;
export default function Shell({ children, active }: { children: React.ReactNode; active?: string }) {
  return <div className="sx">
    <div className="sx-w">
      <header className="sx-nav">
        <a className="sx-brand" href="/" aria-label={BRAND}><span className="sx-mark"><BookOpen size={21} aria-hidden="true" /></span>Classroom<span className="sx-brand-light">Check</span></a>
        <nav className="sx-links" aria-label="Main"><Link href="/how-it-works" cur={active === 'how'}>How it works</Link><Link href="/faq" cur={active === 'faq'}>FAQ</Link></nav>
        <div className="sx-r"><a className="sx-lnk" href="/join">Join an exam</a><a className="sx-lnk" href="/admin">Log in</a><a className="sx-btn" href="/signup">Request access</a></div>
      </header>
      <main className="sx-main">{children}</main>
      <footer className="sx-ft"><span>© {BRAND} · Built for the classroom.</span><span><a href="/how-it-works">How it works</a><a href="/faq">FAQ</a><a href="/privacy">Privacy</a><a href="/signup">Request access</a></span></footer>
    </div>
  </div>;
}
