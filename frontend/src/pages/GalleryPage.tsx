import { useState, useEffect } from 'react';
import Header from '../components/Header';
import InfiniteMenu from '../components/InfiniteMenu';
import AnimatedText from '../components/AnimatedText';
import { ChevronRight } from 'lucide-react';

// 유튜브 썸네일 추출 함수
const getYoutubeThumbnail = (url: string) => {
  if (!url) return null;
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11)
    ? `https://img.youtube.com/vi/${match[2]}/hqdefault.jpg`
    : null;
};

// [추가] HTML 태그 제거 및 텍스트 정리 함수 (소개글용)
const cleanText = (html: string) => {
  if (!html) return "";
  
  // 1. <br> 태그를 줄바꿈 문자로 변환
  let formatted = html.replace(/<br\s*\/?>/gi, '\n');
  
  // 2. <p> 태그가 끝날 때마다 줄바꿈 두 번 (문단 나눔)
  formatted = formatted.replace(/<\/p>/gi, '\n\n');

  // 3. HTML 엔티티(&lt; 등) 해석 및 태그 제거
  const doc = new DOMParser().parseFromString(formatted, 'text/html');
  let text = doc.body.textContent || "";
  
  // 4. 불필요한 공백 정리 (연속된 줄바꿈은 최대 2개까지만 허용 등)
  text = text.trim().replace(/\n{3,}/g, '\n\n');
  
  return text;
};

export default function GalleryPage() {
  const [started, setStarted] = useState(false);
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnimals = async () => {
      try {
        const res = await fetch('http://localhost:5001/api/animals?start=1&end=50');
        const data = await res.json();

        if (res.ok && data.row) {
          const mappedItems = data.row.map((animal: any) => {
            
            let imageUrl = getYoutubeThumbnail(animal.MOVIE_URL);
            if (!imageUrl) imageUrl = 'https://placehold.co/600x600?text=No+Image';

            // [수정] 상세 정보(details) 객체를 추가해서 전달
            return {
              image: imageUrl,
              link: animal.MOVIE_URL || '#',
              title: animal.ANIMAL_NM, // 이름
              
              // InfiniteMenu에서 사용할 상세 데이터 묶음
              details: {
                breed: animal.ANIMAL_BREED,
                sex: animal.ANIMAL_SEX === 'W' || animal.ANIMAL_SEX === 'F' ? '암컷' : '수컷',
                age: animal.ANIMAL_BRITH_YMD || animal.AGE || '정보없음',
                weight: animal.WEIGHT_KG ? `${animal.WEIGHT_KG}kg` : '정보없음',
                status: animal.ADOPT_STATUS || '보호중',
                intro: cleanText(animal.CONT)
              }
            };
          });
          
          setItems(mappedItems);
        }
      } catch (err) {
        console.error("데이터 로드 실패:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchAnimals();
  }, []);

  return (
    <div className="relative w-full h-screen overflow-hidden bg-white">
      <Header />

      <div className="absolute top-0 left-0 right-0 bottom-0 z-0 pt-16">
        {!loading && items.length > 0 ? (
          <InfiniteMenu items={items} />
        ) : (
          <div className="flex items-center justify-center h-full text-gray-400">
            {loading ? "아이들을 불러오는 중..." : "데이터가 없습니다."}
          </div>
        )}

        {!started && (
          <div className="absolute inset-0 z-10 flex flex-col justify-center items-center backdrop-blur-[8px] bg-white/10 transition-all duration-500">
            <AnimatedText
              text="새로운 가족을 찾아보세요!"
              className="w-full text-center text-4xl sm:text-5xl md:text-6xl font-bold text-black drop-shadow-lg px-4 mb-8"
            />
            <button
              onClick={() => setStarted(true)}
              className="px-6 py-3 bg-[#5227FF] hover:bg-[#4114cc] text-white text-lg font-semibold rounded-full shadow-lg flex items-center gap-2 transition-all hover:scale-105 active:scale-95"
            >
              아이들 만나러 가기
              <ChevronRight size={22} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}