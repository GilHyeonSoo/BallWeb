import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import LoginModal from './LoginModal';
import SignupModal from './SignupModal';
import StaggeredMenu from './StaggeredMenu';

export default function Header() {
  const { isLoggedIn, logout, token } = useAuth();
  const navigate = useNavigate();
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showSignupModal, setShowSignupModal] = useState(false);
  const [nickname, setNickname] = useState<string>('');

  useEffect(() => {
    const fetchUserInfo = async () => {
      if (!isLoggedIn || !token) {
        setNickname('');
        return;
      }
      try {
        const response = await fetch('http://localhost:5001/api/profile', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.ok) {
          const data = await response.json();
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
        <div className="max-w-9xl mx-auto flex items-center justify-between px-4 sm:px-6 py-3">
          
          {/* [수정됨] 왼쪽 영역: 메뉴와 로고를 하나의 div로 묶음 */}
          <div className="flex items-center gap-2 sm:gap-4">
            {/* 1. StaggeredMenu */}
            <div className="flex items-center">
              <StaggeredMenu
                position="left"
                items={[
                  { label: '홈', ariaLabel: '홈으로 이동', link: '/kakaomap' },
                  { label: '갤러리', ariaLabel: '갤러리로 이동', link: '/gallery' },
                  { label: '입양', ariaLabel: '입양 페이지로 이동', link: '/adopt' },
                  { label: '마이페이지', ariaLabel: '마이페이지로 이동', link: '/mypage' }
                ]}
                displaySocials={false}
                displayItemNumbering={false}
                colors={['#B19EEF', '#5227FF']}
                accentColor="#5227FF"
              />
            </div>

            {/* 2. 로고 (flex-1 제거, justify-center 제거) */}
            <div 
              onClick={() => navigate('/')}
              className="flex items-center text-lg sm:text-xl md:text-2xl font-bold text-black gap-2 hover:text-gray-800 transition cursor-pointer select-none"
            >
              <span className="text-2xl sm:text-3xl">🐾</span>
              <span className="hidden xs:inline">Animalloo</span>
              <span className="xs:hidden">Animalloo</span>
            </div>
          </div>

          {/* 오른쪽: 네비게이션 (기존 유지) */}
          <nav className="flex items-center gap-2 sm:gap-3 md:gap-5">
            {isLoggedIn ? (
              <>
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