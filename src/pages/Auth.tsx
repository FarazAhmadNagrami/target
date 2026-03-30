import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { loadFromSupabase } from '../lib/sync';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { useNavigate } from 'react-router-dom';

export default function Auth() {
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [isLogin, setIsLogin]   = useState(true);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');
  const [message, setMessage]   = useState('');
  const navigate                = useNavigate();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!supabase) return;
    setLoading(true);
    setError('');
    setMessage('');

    if (isLogin) {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        setError(error.message);
      } else {
        await loadFromSupabase();
        navigate('/');
      }
    } else {
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) {
        setError(error.message);
      } else {
        setMessage('Account created! Check your email to confirm, then log in.');
        setIsLogin(true);
      }
    }
    setLoading(false);
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
      <div className="w-full max-w-sm space-y-4">
        <div className="text-center">
          <span className="text-4xl">🎯</span>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mt-2">Target</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm">₹3 Crore House Tracker</p>
        </div>

        <Card>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            {isLogin ? 'Sign In' : 'Create Account'}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
            />
            <Input
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
            {error && <p className="text-sm text-red-500">{error}</p>}
            {message && <p className="text-sm text-emerald-600 dark:text-emerald-400">{message}</p>}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-medium rounded-lg transition-colors"
            >
              {loading ? 'Please wait…' : isLogin ? 'Sign In' : 'Create Account'}
            </button>
          </form>
          <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-4">
            {isLogin ? "Don't have an account?" : 'Already have an account?'}{' '}
            <button
              onClick={() => { setIsLogin(!isLogin); setError(''); setMessage(''); }}
              className="text-blue-600 dark:text-blue-400 hover:underline font-medium"
            >
              {isLogin ? 'Sign Up' : 'Sign In'}
            </button>
          </p>
        </Card>

        <p className="text-center text-xs text-gray-400 dark:text-gray-500">
          Your data syncs across all devices after sign in.
        </p>
      </div>
    </div>
  );
}
