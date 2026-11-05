'use client';
import { useState } from 'react';

export default function RequestAccess() {
  const [state, setState] = useState<'idle' | 'sending' | 'done'>('idle');
  const [error, setError] = useState('');
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    setState('sending'); setError('');
    try {
      const r = await fetch('/api/test', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'requestaccess', name: f.get('name'), institution: f.get('institution'), email: f.get('email'), website: f.get('website') }) });
      const d: any = await r.json().catch(() => ({}));
      if (!r.ok) { setError(d.error || 'Something went wrong. Please try again.'); setState('idle'); return; }
      setState('done');
    } catch { setError('Could not reach the server. Check your connection and try again.'); setState('idle'); }
  }
  if (state === 'done') return <div className="sx-card" role="status"><h2 className="sx-h2" style={{ fontSize: 30, marginBottom: 12 }}>Thank you.</h2><p style={{ color: 'var(--mut)' }}>We’ve received your request. During the pilot we add lecturers by invitation, and we’ll contact you by email.</p></div>;
  return <form className="sx-card" onSubmit={submit} style={{ display: 'grid', gap: 16 }}>
    <h2 className="sx-h2" style={{ fontSize: 30 }}>Request access</h2>
    <label className="sx-field">Full name<input name="name" required maxLength={100} placeholder="Dr. Ada Obi" autoComplete="name" /></label>
    <label className="sx-field">University or institution<input name="institution" required maxLength={150} placeholder="Your institution" autoComplete="organization" /></label>
    <label className="sx-field">Email<input name="email" type="email" required maxLength={150} placeholder="you@university.edu.ng" autoComplete="email" /></label>
    <div className="sx-hp" aria-hidden="true"><label>Website<input name="website" tabIndex={-1} autoComplete="off" /></label></div>
    {error && <p role="alert" style={{ color: '#b3392f', fontWeight: 700 }}>{error}</p>}
    <button className="sx-btn" type="submit" disabled={state === 'sending'}>{state === 'sending' ? 'Sending…' : 'Request access'}</button>
    <p style={{ fontSize: 13, color: 'var(--mut)' }}>We use your details only to contact you about access. <a href="/privacy" style={{ color: 'var(--g)' }}>Privacy</a></p>
  </form>;
}
