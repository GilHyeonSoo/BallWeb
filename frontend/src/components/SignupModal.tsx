import { useState } from 'react';

interface SignupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSwitchToLogin: () => void;
}

export default function SignupModal({ isOpen, onClose, onSwitchToLogin }: SignupModalProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('http://localhost:5001/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || '회원가입에 실패했습니다.');
      }

      alert('회원가입 성공! 로그인해주세요.');
      onSwitchToLogin();
      setUsername('');
      setPassword('');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <div 
        className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 w-[90%] max-w-md border border-white/20 shadow-2xl relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 닫기 버튼 */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-white/60 hover:text-white text-2xl"
        >
          ✕
        </button>

        <h2 className="text-3xl font-bold text-white mb-6 text-center drop-shadow-lg">
          회원가입
        </h2>

        {error && (
          <p className="text-red-300 text-sm mb-3 bg-red-500/20 p-2 rounded">
            {error}
          </p>
        )}

        <form onSubmit={handleSignup} className="space-y-4">
          <input
            type="text"
            placeholder="아이디"
            className="bg-white/20 border border-white/30 rounded-lg w-full p-3 text-white placeholder-white/60 focus:ring-2 focus:ring-white/50 outline-none"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />

          <input
            type="password"
            placeholder="비밀번호 (6자 이상)"
            className="bg-white/20 border border-white/30 rounded-lg w-full p-3 text-white placeholder-white/60 focus:ring-2 focus:ring-white/50 outline-none"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
          />

          <button
            type="submit"
            disabled={loading}
            className="bg-white/20 hover:bg-white/30 text-white font-semibold w-full py-3 rounded-lg transition border border-white/30 disabled:opacity-50"
          >
            {loading ? '가입 중...' : '회원가입'}
          </button>
        </form>

        <p className="text-sm text-center mt-4 text-white/80">
          이미 계정이 있으신가요?{' '}
          <button
            onClick={onSwitchToLogin}
            className="text-white font-semibold hover:underline"
          >
            로그인
          </button>
        </p>
      </div>
    </div>
  );
}
