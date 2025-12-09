import { useNavigate } from 'react-router-dom';
import StaggeredMenu from './StaggeredMenu';

export default function Header() {
  const navigate = useNavigate();

  return (
    <>
      <header className="bg-white sticky shadow-sm top-0 z-50">
        <div className="max-w-9xl mx-auto flex items-center justify-between px-4 sm:px-6 py-3">
          
          {/* 왼쪽: 메뉴 + 로고 */}
          <div className="flex items-center gap-2 sm:gap-4">
            {/* 메뉴 버튼 */}
            <div className="flex items-center">
              <StaggeredMenu
                position="left"
                items={[
                  { label: '홈', ariaLabel: '홈으로 이동', link: '/kakaomap' },
                  { label: '입양', ariaLabel: '입양 페이지로 이동', link: '/gallery' },
                  { label: '질문', ariaLabel: '질문 페이지로 이동', link: '/questions' },
                  
                ]}
                displaySocials={false}
                displayItemNumbering={false}
                colors={['#B19EEF', '#5227FF']}
                accentColor="#5227FF"
              />
            </div>

            {/* 로고 */}
            <div 
              onClick={() => navigate('/')}
              className="flex items-center text-lg sm:text-xl md:text-2xl font-bold text-black gap-2 hover:text-gray-800 transition cursor-pointer select-none"
            >
              <span className="text-2xl sm:text-3xl">🐾</span>
              <span className="hidden xs:inline">Animalloo</span>
              <span className="xs:hidden">Animalloo</span>
            </div>
          </div>

          {/* 오른쪽: 로그인/회원가입 제거 → 빈 영역 또는 추후 다른 버튼 넣기 */}
          <div className="flex items-center gap-2 sm:gap-3 md:gap-5">
            {/* 필요하면 여기 나중에 다른 버튼 추가 */}
          </div>
        </div>
      </header>
    </>
  );
}
