import { useState } from 'react';
import Header from '../components/Header';
import InfiniteMenu from '../components/InfiniteMenu';
import AnimatedText from '../components/AnimatedText';
import { ChevronRight } from 'lucide-react';


const galleryItems = [
  {
    image: 'https://picsum.photos/600/600?random=1',
    link: '/detail/1',
    title: '집 가는날',
    description: '첫 번째 갤러리 이미지'
  },
  {
    image: 'https://picsum.photos/600/600?random=2',
    link: '/detail/2',
    title: '이미지 2',
    description: '두 번째 갤러리 이미지'
  },
  {
    image: 'https://picsum.photos/600/600?random=3',
    link: '/detail/3',
    title: '이미지 3',
    description: '세 번째 갤러리 이미지'
  },
  {
    image: 'https://picsum.photos/600/600?random=4',
    link: '/detail/4',
    title: '이미지 4',
    description: '네 번째 갤러리 이미지'
  },
  {
    image: 'https://picsum.photos/600/600?random=5',
    link: '/detail/5',
    title: '이미지 5',
    description: '다섯 번째 갤러리 이미지'
  },
  {
    image: 'https://picsum.photos/600/600?random=6',
    link: '/detail/6',
    title: '이미지 6',
    description: '여섯 번째 갤러리 이미지'
  }
];

export default function GalleryPage() {
  const [started, setStarted] = useState(false);

  return (
    <div className="relative w-full h-screen overflow-hidden bg-white">
      <Header />

      {/* 배경 이미지 레이어 + 블러 */}
      <div className="absolute top-16 left-0 right-0 bottom-0 z-0">
        <InfiniteMenu items={galleryItems} />
      {/* AnimatedText 영역 */}
      {!started && (
        <div className="absolute inset-0 z-10 flex flex-col justify-center backdrop-blur-[8px] items-center pointer-events-none">
          <AnimatedText
            text="소중한 아이와의 추억을 남겨보세요!"
            className="text-4xl sm:text-5xl md:text-6xl font-bold text-black drop-shadow-lg text-center"
          />
          {/* 바로가기(시작) 버튼 */}
          <button
            onClick={() => setStarted(true)}
            className="mt-6 px-4 py-3 bg-blue-500 hover:bg-blue-600 text-white text-lg rounded-full shadow-lg flex items-center gap-2 transition pointer-events-auto"
            style={{ pointerEvents: 'auto' }}
          >
            시작하기
            <ChevronRight size={22} />
          </button>
        </div>
      )}
    </div>
    </div>
  );
}
