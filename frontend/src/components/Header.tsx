import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import LoginModal from './LoginModal';
import SignupModal from './SignupModal';

export default function Header() {
  const { isLoggedIn, logout, token } = useAuth();
  const navigate = useNavigate();
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showSignupModal, setShowSignupModal] = useState(false);
  const [nickname, setNickname] = useState<string>('');

  // 로그인 시 사용자 정보 가져오기 (nickname 사용)
  useEffect(() => {
    const fetchUserInfo = async () => {
      if (!isLoggedIn || !token) {
        setNickname('');
        return;
      }

      try {
        const response = await fetch('http://localhost:5001/api/profile', {
          headers: { 'Authorization': `Bearer ${token}` },
        });

        if (response.ok) {
          const data = await response.json();
          // nickname 우선, 없으면 username
          setNickname(data.nickname || data.username);
        }
      } catch (error) {
        console.error('사용자 정보 로드 실패:', error);
      }
    };

    fetchUserInfo();
  }, [isLoggedIn, token]);

  const handleLogout = () => {
    logout();
    setNickname('');
  };

  const switchToSignup = () => {
    setShowLoginModal(false);
    setShowSignupModal(true);
  };

  const switchToLogin = () => {
    setShowSignupModal(false);
    setShowLoginModal(true);
  };

  return (
    <>
      <header className="bg-transparent sticky shadow-sm top-0 z-50">
        <div className="max-w-7xl mx-auto flex justify-between items-center px-4 sm:px-6 py-3">
          {/* 로고 */}
          <div 
            onClick={() => navigate('/')}
            className="text-lg sm:text-xl md:text-2xl font-bold text-black flex items-center gap-1 sm:gap-2 hover:text-gray-800 transition cursor-pointer drop-shadow-lg"
          >
            <span className="text-2xl sm:text-3xl">🐾</span>
            <span className="hidden xs:inline">Animalloo</span>
            <span className="xs:hidden">Animalloo</span>
          </div>

          {/* 네비게이션 */}
          <nav className="flex items-center gap-2 sm:gap-3 md:gap-5">
            {isLoggedIn ? (
              <>
                {/* nickname 표시 */}
                <span className="hidden md:block text-black font-medium drop-shadow-lg text-sm">
                  <span className="font-bold">{nickname}</span>님 환영합니다!
                </span>
                
                <button 
                  onClick={() => navigate('/mypage')}
                  className="text-black font-semibold hover:text-gray-800 hover:underline drop-shadow-lg text-sm sm:text-base"
                >
                  마이페이지
                </button>
                <button 
                  onClick={handleLogout}
                  className="px-3 sm:px-4 py-1.5 sm:py-2 bg-black/20 backdrop-blur-sm text-black rounded-lg hover:bg-black/30 transition border border-black/30 drop-shadow-lg text-sm sm:text-base font-semibold"
                >
                  로그아웃
                </button>
              </>
            ) : (
              <>
                <button 
                  onClick={() => setShowLoginModal(true)}
                  className="text-black font-semibold hover:text-gray-800 hover:underline drop-shadow-lg text-sm sm:text-base"
                >
                  로그인
                </button>
                <button 
                  onClick={() => setShowSignupModal(true)}
                  className="px-3 sm:px-4 py-1.5 sm:py-2 bg-black/20 backdrop-blur-sm text-black rounded-lg hover:bg-black/30 transition border border-black/30 drop-shadow-lg text-sm sm:text-base font-semibold"
                >
                  회원가입
                </button>
              </>
            )}
          </nav>
        </div>
      </header>

      <LoginModal 
        isOpen={showLoginModal} 
        onClose={() => setShowLoginModal(false)}
        onSwitchToSignup={switchToSignup}
      />
      <SignupModal 
        isOpen={showSignupModal} 
        onClose={() => setShowSignupModal(false)}
        onSwitchToLogin={switchToLogin}
      />
    </>
  );
}
