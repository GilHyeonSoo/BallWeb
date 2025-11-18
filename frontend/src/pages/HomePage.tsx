import { useState, useEffect } from 'react';
import Header from '../components/Header';
import Ballpit from '../components/Ballpit';
import AnimatedText from '../components/AnimatedText';
import SeoulMap from '../components/SeoulMap';
import { useAuth } from '../contexts/AuthContext';
import KakaoMapView from '../components/KakaoMapView';

const ANIMAL_THEME_COLORS = [
  '#FFC1CC',
  '#FFD700',
  '#8B4513',
  '#90EE90',
  '#87CEEB',
  '#FFB6C1',
  '#98D8C8'
];

const guCenters: Record<string, { lat: number; lng: number }> = {
  '강남구': { lat: 37.5172, lng: 127.0473 },
  '강동구': { lat: 37.5301, lng: 127.1238 },
  '강북구': { lat: 37.6396, lng: 127.0257 },
  '강서구': { lat: 37.5510, lng: 126.8495 },
  '관악구': { lat: 37.4784, lng: 126.9516 },
  '광진구': { lat: 37.5384, lng: 127.0823 },
  '구로구': { lat: 37.4954, lng: 126.8875 },
  '금천구': { lat: 37.4501, lng: 126.9004 },
  '노원구': { lat: 37.6543, lng: 127.0564 },
  '도봉구': { lat: 37.6688, lng: 127.0471 },
  '동대문구': { lat: 37.5744, lng: 127.0400 },
  '동작구': { lat: 37.5124, lng: 126.9393 },
  '마포구': { lat: 37.5663, lng: 126.9019 },
  '서대문구': { lat: 37.5791, lng: 126.9368 },
  '서초구': { lat: 37.4837, lng: 127.0324 },
  '성동구': { lat: 37.5634, lng: 127.0371 },
  '성북구': { lat: 37.5894, lng: 127.0167 },
  '송파구': { lat: 37.5145, lng: 127.1059 },
  '양천구': { lat: 37.5170, lng: 126.8664 },
  '영등포구': { lat: 37.5264, lng: 126.8963 },
  '용산구': { lat: 37.5324, lng: 126.9900 },
  '은평구': { lat: 37.6027, lng: 126.9291 },
  '종로구': { lat: 37.5735, lng: 126.9792 },
  '중구': { lat: 37.5641, lng: 126.9979 },
  '중랑구': { lat: 37.6063, lng: 127.0925 },
};

function HomePage() {
  const { isLoggedIn } = useAuth();
  const [step, setStep] = useState(1);
  const [selectedGu, setSelectedGu] = useState<string | null>(null);
  const [hoveredGu, setHoveredGu] = useState<string | null>(null);
  const [showKakaoMap, setShowKakaoMap] = useState(false);
  const [selectedGuCenter, setSelectedGuCenter] = useState({ lat: 37.5665, lng: 126.9780 });

  useEffect(() => {
    const timer1 = setTimeout(() => setStep(2), 1500);
    return () => clearTimeout(timer1);
  }, []);

  const onSelectGu = (gu: string) => {
    setSelectedGu(gu);
    const center = guCenters[gu];
    if (center) {
      setSelectedGuCenter(center);
      setShowKakaoMap(true);  // 즉시 전환
    }
  };

  const handleBack = () => {
    setShowKakaoMap(false);
    setSelectedGu(null);
  };

  // 카카오맵 화면
  if (showKakaoMap && selectedGu) {
    return (
      <div className="w-full h-screen">
        <Header />
        <KakaoMapView
          center={selectedGuCenter}
          guName={selectedGu}
          onBack={handleBack}
        />
      </div>
    );
  }

  // 서울맵 화면
  const mapContainerClass = isLoggedIn
    ? 'absolute inset-0 z-10 transition-all pt-5 duration-1000 ease-out'
    : 'absolute inset-0 z-10 flex items-center justify-center transition-all duration-1000 ease-out';

  const mapClass = isLoggedIn
    ? 'w-[500px] h-[500px] md:w-[600px] md:h-[600px] lg:w-[800px] lg:h-[800px] pointer-events-auto transition-all duration-1000 ease-out'
    : 'w-[400px] h-[400px] sm:w-[500px] sm:h-[500px] blur-lg pointer-events-none transition-all duration-1000 ease-out';

  return (
    <div className="relative w-full h-screen overflow-hidden">
      {/* 서울맵 */}
      <div className={mapContainerClass}>
        <SeoulMap
          className={mapClass}
          selectedGu={selectedGu}
          hoveredGu={hoveredGu}
          setHoveredGu={setHoveredGu}
          onSelectGu={onSelectGu}
        />
      </div>

      {/* Ballpit 배경 */}
      <div className="absolute inset-0 z-0 w-full h-full">
        <Ballpit
          className="pointer-events-none"
          count={50}
          gravity={0.7}
          friction={0.9965}
          wallBounce={0.95}
          followCursor={false}
          colors={ANIMAL_THEME_COLORS}
        />
      </div>

      {/* 헤더 */}
      <div className="relative z-30">
        <Header />
      </div>

      {/* 안내문구 */}
      {!isLoggedIn && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center pointer-events-none px-4">
          <div className={`transition-all duration-1000 ease-out ${step === 1 ? 'translate-y-0' : '-translate-y-16 sm:-translate-y-24'}`}>
            <AnimatedText
              text="안녕하세요!"
              className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold text-black drop-shadow-2xl text-center"
            />
          </div>
          <div className={`mt-2 sm:mt-3 transition-all duration-1000 ease-out ${step === 1 ? 'opacity-0 translate-y-8' : 'opacity-100 translate-y-0'}`}>
            {step === 2 && (
              <AnimatedText
                text="로그인하여 서비스를 받아보세요!"
                className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-semibold text-black/90 drop-shadow-lg text-center"
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default HomePage;
