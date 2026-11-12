import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Loader2, Lock, User, ChevronDown } from 'lucide-react';

const RIG_OPTIONS = [
  { value: 'HR', label: 'HR (الموارد البشرية)' },
  { value: 'B2', label: 'B2' },
  { value: 'B3', label: 'B3' },
  { value: 'B4', label: 'B4' },
  { value: 'B5', label: 'B5' },
  { value: 'B6', label: 'B6' },
  { value: 'B7', label: 'B7' },
  { value: 'B8', label: 'B8' },
  { value: 'B9', label: 'B9' },
  { value: 'B10', label: 'B10' },
  { value: 'B11', label: 'B11' },
];

export default function AuthPanel({ onClose }: { onClose: () => void }) {
  const [username, setUsername] = useState('HR');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    let email = '';
    if (username === 'HR') email = 'hr@alloush.local';
    else email = username.toLowerCase() + '@alloush.local';

    const { error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      setError(authError.message + ' (' + email + ')');
      setLoading(false);
    } else {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
      <form onSubmit={handleLogin} className="bg-zinc-900 p-6 rounded-xl border border-zinc-800 w-full max-w-sm space-y-4">
        <h2 className="text-xl font-bold text-white text-center mb-6">تسجيل الدخول</h2>
        
        {error && <div className="text-red-400 text-sm text-center bg-red-900/20 p-2 rounded">{error}</div>}

        <div className="relative">
          <User className="absolute right-3 top-3 text-zinc-500" size={18} />
          <select
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full bg-zinc-800 border border-zinc-700 rounded-lg py-2 pr-10 pl-10 text-white focus:outline-none focus:border-emerald-500 text-right appearance-none cursor-pointer"
            dir="rtl"
          >
            {RIG_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute left-3 top-3 text-zinc-500 pointer-events-none" size={18} />
        </div>

        <div className="relative">
          <Lock className="absolute right-3 top-3 text-zinc-500" size={18} />
          <input
            type="password"
            placeholder="كلمة المرور"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full bg-zinc-800 border border-zinc-700 rounded-lg py-2 pr-10 pl-3 text-white focus:outline-none focus:border-emerald-500 text-right"
            dir="rtl"
            required
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-medium py-2 rounded-lg transition-colors flex justify-center items-center gap-2"
        >
          {loading ? <Loader2 className="animate-spin" size={18} /> : 'دخول'}
        </button>
      </form>
    </div>
  );
}
