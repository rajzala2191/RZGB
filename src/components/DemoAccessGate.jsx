import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { checkDemoToken, DEMO_ACCESS_KEY } from '@/services/demoRequestService';

/**
 * Wraps demo routes. Only allows access if the user has a valid demo token
 * (from the approval email link). Token can be in URL (?token=...) or in sessionStorage.
 * Resets demo data on refresh; access is kept for the same tab via sessionStorage.
 */
export default function DemoAccessGate({ children }) {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [status, setStatus] = useState('checking'); // 'checking' | 'allowed' | 'denied'

  useEffect(() => {
    let cancelled = false;

    const tokenFromUrl = searchParams.get('token');
    const tokenFromStorage = (() => {
      try {
        return sessionStorage.getItem(DEMO_ACCESS_KEY);
      } catch {
        return null;
      }
    })();

    const token = tokenFromUrl || tokenFromStorage;

    if (!token) {
      if (!cancelled) setStatus('denied');
      return;
    }

    checkDemoToken(token).then((valid) => {
      if (cancelled) return;
      if (valid) {
        try {
          sessionStorage.setItem(DEMO_ACCESS_KEY, token);
        } catch (_) {}
        if (tokenFromUrl) {
          const next = new URLSearchParams(searchParams);
          next.delete('token');
          setSearchParams(next, { replace: true });
        }
        setStatus('allowed');
      } else {
        setStatus('denied');
      }
    }).catch(() => {
      if (!cancelled) setStatus('denied');
    });

    return () => { cancelled = true; };
  }, [searchParams, setSearchParams]);

  useEffect(() => {
    if (status === 'denied') {
      navigate('/request-demo', { replace: true });
    }
  }, [status, navigate]);

  if (status === 'checking') {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--app-bg)' }}>
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 animate-spin" style={{ color: 'var(--brand, #FF6B35)' }} />
          <p className="text-sm" style={{ color: 'var(--body)' }}>Verifying demo access…</p>
        </div>
      </div>
    );
  }

  if (status === 'allowed') {
    return children;
  }

  return null;
}
