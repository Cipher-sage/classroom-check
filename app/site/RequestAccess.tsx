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
  if (state === 'done') return <div className="sx-card sx-access-card" role="status"><div className="sx-card-top"><span>Request received</span><span>Thank you</span></div><h2 className="sx-h2">Thank you.</h2><p>We’ve received your request. During the pilot we add lecturers by invitation, and we’ll contact you by email.</p></div>;
  return <form className="sx-card sx-access-card" onSubmit={submit}>
    <div className="sx-card-top"><span>Lecturer access</span><span>Join the pilot</span></div>
    <h2 className="sx-h2">Request access</h2>
    <p className="sx-access-intro">Tell us a little about yourself to get started.</p>
    <label className="sx-field">Full name<input name="name" required maxLength={100} placeholder="Dr. Ada Obi" autoComplete="name" /></label>
    <label className="sx-field">University or institution<input name="institution" required maxLength={150} placeholder="Your institution" autoComplete="organization" /></label>
    <label className="sx-field">Email<input name="email" type="email" required maxLength={150} placeholder="you@university.edu.ng" autoComplete="email" /></label>
    <div className="sx-hp" aria-hidden="true"><label>Website<input name="website" tabIndex={-1} autoComplete="off" /></label></div>
    {error && <p role="alert" className="sx-form-error">{error}</p>}
    <button className="sx-btn sx-form-submit" type="submit" disabled={state === 'sending'}>{state === 'sending' ? 'Sending…' : 'Request access'}</button>
    <p className="sx-form-privacy">We use your details only to contact you about access. <a href="/privacy">Privacy</a></p>
  </form>;
}
