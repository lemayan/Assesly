import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Button, Card, Input, Label } from '../components/UI';
import { useNavigate } from 'react-router-dom';
import http from '../lib/http';

export default function LoginPage() {
  const { login, } = useAuth();
  // We'll read the stored user after login to route by role
  const nav = useNavigate();
  const [email, setEmail] = useState('admin@examina.local');
  const [password, setPassword] = useState('password123');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [apiStatus, setApiStatus] = useState<'checking' | 'ok' | 'down'>('checking');

  const checkApi = useCallback(async () => {
    setApiStatus('checking');
    try {
      await http.get('/health');
      setApiStatus('ok');
    } catch {
      setApiStatus('down');
    }
  }, []);

  useEffect(() => {
    checkApi();
  }, [checkApi]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError(null);
    try {
  const u = await login(email, password);
  if (u?.role === 'admin') nav('/admin/dashboard'); else nav('/student/dashboard');
    } catch (e: any) {
      setError(e.response?.data?.error || e.message);
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-hero">
      <Card className="w-full max-w-sm glass">
        <h1 className="text-2xl font-semibold mb-1">Sign in</h1>
        <p className="text-sm text-gray-500 mb-4">Choose Admin or Student or use the form below</p>
        <div className="mb-2 text-sm flex items-center gap-2">
          <span>API:</span>
          {apiStatus === 'checking' && <span className="text-gray-500">checking…</span>}
          {apiStatus === 'ok' && <span className="text-green-600">online</span>}
          {apiStatus === 'down' && (
            <>
              <span className="text-red-600">offline</span>
              <button type="button" className="underline text-xs" onClick={checkApi}>retry</button>
            </>
          )}
        </div>
        <div className="grid grid-cols-2 gap-2 mb-3">
          <Button onClick={() => { setEmail('admin@examina.local'); setPassword('password123'); }}>
            Admin
          </Button>
          <Button onClick={() => { setEmail('student@examina.local'); setPassword('password123'); }}>
            Student
          </Button>
        </div>
        <form onSubmit={onSubmit} className="space-y-3">
          {error && <div className="text-red-500 text-sm">{error}</div>}
          <div>
            <Label>Email</Label>
            <Input value={email} onChange={(e) => setEmail(e.target.value)} type="email" required />
          </div>
          <div>
            <Label>Password</Label>
            <Input value={password} onChange={(e) => setPassword(e.target.value)} type="password" required />
          </div>
          <Button disabled={loading}>{loading ? 'Signing in…' : 'Sign In'}</Button>
        </form>
      </Card>
    </div>
  );
}
