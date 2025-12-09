import { useState, useEffect } from 'react';
import Header from '../components/Header';
import Ballpit from '../components/Ballpit';
import SeoulMap from '../components/SeoulMap';

const ANIMAL_THEME_COLORS = [
  '#FFC1CC',
  '#FFD700',
  '#8B4513',
  '#90EE90',
  '#87CEEB',
  '#FFB6C1',
  '#98D8C8'
];

function HomePage() {
  const [step, setStep] = useState(1);
  const [selectedGu, setSelectedGu] = useState<string | null>(null);
  const [hoveredGu, setHoveredGu] = useState<string | null>(null);

  useEffect(() => {
    const timer1 = setTimeout(() => setStep(2), 1500);
    return () => clearTimeout(timer1);
  }, []);

  const onSelectGu = (gu: string) => {
    window.location.href = `/kakaomap?gu=${encodeURIComponent(gu)}`;
  };

  // 서울맵 화면
  const mapContainerClass = 'absolute inset-0 z-10 flex items-center justify-center transition-all duration-1000 ease-out';

  const mapClass = 'w-[500px] h-[500px] md:w-[600px] md:h-[600px] lg:w-[800px] lg:h-[800px] pointer-events-auto transition-all duration-1000 ease-out';

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
    </div>
  );
}

export default HomePage;
