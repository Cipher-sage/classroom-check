import './site.css';
import { BookOpen, Menu } from 'lucide-react';
export const BRAND = 'Classroom Check';
const Link = ({ href, cur, children }: { href: string; cur?: boolean; children: React.ReactNode }) => <a href={href} aria-current={cur ? 'page' : undefined}>{children}</a>;
export default function Shell({ children, active }: { children: React.ReactNode; active?: string }) {
  return <div className="sx">
    <header className="sx-top">
      <div className="sx-w sx-nav">
        <a className="sx-brand" href="/" aria-label={BRAND}><span className="sx-mark"><BookOpen size={19} aria-hidden="true" /></span>Classroom <b>Check</b></a>
        <nav className="sx-links" aria-label="Main"><Link href="/how-it-works" cur={active === 'how'}>How it works</Link><Link href="/faq" cur={active === 'faq'}>FAQ</Link><Link href="/privacy" cur={active === 'privacy'}>Privacy</Link></nav>
        <div className="sx-r"><a className="sx-lnk" href="/join">Join a test</a><a className="sx-lnk" href="/admin">Log in</a><a className="sx-btn sm" href="/signup">Request access</a></div>
        <details className="sx-menu">
          <summary aria-label="Open menu"><Menu size={20} aria-hidden="true" /></summary>
          <nav className="sx-menu-panel" aria-label="Mobile">
            <a href="/join">Join a test</a><a href="/how-it-works">How it works</a><a href="/faq">FAQ</a><a href="/privacy">Privacy</a><a href="/admin">Lecturer log in</a>
            <a className="sx-btn" href="/signup">Request access</a>
          </nav>
        </details>
      </div>
    </header>
    <main className="sx-w">{children}</main>
    <footer className="sx-ft"><div className="sx-w sx-ft-in"><span>© {BRAND} by NextKind · Built for supervised classrooms in Nigeria.</span><nav aria-label="Footer"><a href="/join">Join a test</a><a href="/how-it-works">How it works</a><a href="/faq">FAQ</a><a href="/privacy">Privacy</a><a href="/signup">Request access</a></nav></div></footer>
  </div>;
}
