import { useState, useEffect } from 'react';
import Header from '../components/Header';
import Ballpit from '../components/Ballpit';
import AnimatedText from '../components/AnimatedText';

const ANIMAL_THEME_COLORS = [
  '#FFC1CC',
  '#FFD700',
  '#8B4513',
  '#90EE90',
  '#87CEEB',
  '#FFB6C1',
  '#98D8C8'
];

function App() {
  const [step, setStep] = useState(1);

  useEffect(() => {
    const timer1 = setTimeout(() => {
      setStep(2);
    }, 1500);

    return () => clearTimeout(timer1);
  }, []);

  return (
    <div className="relative w-full h-screen overflow-hidden">
      {/* 전체 화면 Ballpit 배경 */}
      <div className="absolute inset-0 w-full h-full">
        <Ballpit
          count={50}
          gravity={0.7}
          friction={0.9965}
          wallBounce={0.95}
          followCursor={false}
          colors={ANIMAL_THEME_COLORS}
        />
      </div>

      {/* 헤더 */}
      <div className="relative z-10">
        <Header />
      </div>

      {/* 중앙 텍스트 애니메이션 - 반응형 */}
      <div className="absolute inset-0 z-[5] flex flex-col items-center justify-center pointer-events-none px-4">
        {/* 안녕하세요! */}
        <div 
          className={`transition-all duration-1000 ease-out ${
            step === 1 
              ? 'translate-y-0' 
              : '-translate-y-16 sm:-translate-y-24'
          }`}
        >
          <AnimatedText
            text="안녕하세요!"
            className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold text-black drop-shadow-2xl text-center"
          />
        </div>

        {/* 로그인하여 서비스를 받아보세요! */}
        <div 
          className={`mt-2 sm:mt-3 transition-all duration-1000 ease-out ${
            step === 1 
              ? 'opacity-0 translate-y-8' 
              : 'opacity-100 translate-y-0'
          }`}
        >
          {step === 2 && (
            <AnimatedText
              text="로그인하여 서비스를 받아보세요!"
              className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-semibold text-black/90 drop-shadow-lg text-center"
            />
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
