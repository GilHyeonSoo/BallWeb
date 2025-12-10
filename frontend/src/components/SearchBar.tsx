import { useState, useEffect, useCallback } from 'react';
import { Search, X, MapPin, Building2, Stethoscope } from 'lucide-react';
import debounce from 'lodash.debounce';

interface SearchResult {
  uri: string;
  label: string;
  type?: string;
  description?: string;
  category?: string; // 기존 코드에 있어서 유지
  lat?: number;
  lng?: number;
}

interface SearchBarProps {
  isOpen: boolean;
  onClose: () => void;
  onResultSelect?: (result: SearchResult) => void;
}

export default function SearchBar({ isOpen, onClose, onResultSelect }: SearchBarProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 검색 API 호출
  const performSearch = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/search?q=${encodeURIComponent(query)}`
      );
      
      if (!response.ok) {
        throw new Error('검색에 실패했습니다.');
      }

      const data = await response.json();
      setSearchResults(data.results || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : '알 수 없는 오류');
      setSearchResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  // 디바운싱된 검색 (300ms 지연)
  const debouncedSearch = useCallback(
    debounce((query: string) => performSearch(query), 300),
    []
  );

  // 검색어 변경 감지
  useEffect(() => {
    debouncedSearch(searchQuery);
    return () => debouncedSearch.cancel();
  }, [searchQuery, debouncedSearch]);

  // 타입별 아이콘 선택
  const getIconForType = (type?: string) => {
    if (!type) return <Search size={18} className="text-gray-400" />;
    
    if (type.includes('Hospital') || type.includes('병원')) {
      return <Stethoscope size={18} className="text-blue-500" />;
    }
    if (type.includes('District') || type.includes('구')) {
      return <MapPin size={18} className="text-green-500" />;
    }
    return <Building2 size={18} className="text-purple-500" />;
  };

  const handleResultClick = (result: SearchResult) => {
    console.log('선택된 결과:', result); // 이 로그가 찍히는지 개발자 도구(F12) 콘솔에서 확인 필요
    onResultSelect?.(result); // 👈 여기서 KakaoMapView로 데이터를 넘겨줍니다.
    handleClose();
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    }
  };

  const handleClose = () => {
    setSearchQuery('');
    setSearchResults([]);
    setError(null);
    onClose();
  };

  if (!isOpen) return null;

  

  return (
    <>
      {/* 배경 오버레이 */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 animate-fade-in"
        onClick={handleClose}
      />

      {/* 검색창 */}
      <div className="fixed top-24 left-0 right-0 z-50 flex justify-center px-4">
        <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden animate-slide-down">
          {/* 검색 입력 영역 */}
          <div className="flex items-center gap-3 p-4 border-b border-gray-200">
            <Search className="text-gray-400" size={24} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder="강남구, 동물병원, 배변봉투,애견카페..."
              className="flex-1 text-lg outline-none"
              autoFocus
            />
            {isLoading && (
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500" />
            )}
            <button
              onClick={handleClose}
              className="p-2 hover:bg-gray-100 rounded-full transition"
              aria-label="검색창 닫기"
            >
              <X size={24} className="text-gray-500" />
            </button>
          </div>

          {/* 에러 메시지 */}
          {error && (
            <div className="p-4 bg-red-50 border-b border-red-100">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          {/* 검색 결과 영역 */}
          {searchResults.length > 0 && (
            <div className="max-h-96 overflow-y-auto">
              <div className="p-2">
                {searchResults.map((result, index) => (
  <div
    key={index}
    className="px-4 py-3 hover:bg-gray-50 rounded-lg cursor-pointer transition group"
    onClick={() => handleResultClick(result)}
  >
    <div className="flex items-start gap-3">
      {getIconForType(result.type)}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h4 className="font-medium text-gray-900 group-hover:text-blue-600 transition">
            {result.label}
          </h4>
          {/* 링크드 데이터 카테고리 배지 */}
          {result.category && (
                      <span className={`
                        text-xs px-2 py-0.5 rounded-full font-medium
                        ${result.category === '위치기반' ? 'bg-green-100 text-green-700' : ''}
                        ${result.category === '시설타입' ? 'bg-blue-100 text-blue-700' : ''}
                        ${result.category === '질병-증상' ? 'bg-purple-100 text-purple-700' : ''}
                        ${result.category === '동물-질병' ? 'bg-orange-100 text-orange-700' : ''}
                        ${result.category === '직접매칭' ? 'bg-gray-100 text-gray-700' : ''}
                      `}>
                        {result.category}
                      </span>
                    )}
                  </div>
                  {result.type && (
                    <p className="text-xs text-gray-500 mt-0.5">
                      {result.type}
                    </p>
                  )}
                  {result.description && (
                    <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                      {result.description}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
              </div>
            </div>
          )}

          {/* 검색어가 있지만 결과가 없을 때 */}
          {searchQuery && !isLoading && searchResults.length === 0 && !error && (
            <div className="p-8 text-center text-gray-500">
              <Search size={48} className="mx-auto mb-3 text-gray-300" />
              <p className="font-medium">'{searchQuery}'에 대한 결과가 없습니다.</p>
              <p className="text-sm mt-1">다른 키워드로 검색해보세요.</p>
            </div>
          )}

          {/* 초기 상태 - 추천 검색어 */}
          {!searchQuery && searchResults.length === 0 && (
            <div className="p-6">
              <h3 className="text-sm font-semibold text-gray-500 mb-3">
                추천 검색어
              </h3>
              <div className="flex flex-wrap gap-2">
                {['강남구', '동물병원', '배변봉투','24시 병원', '반려동물 카페', '애견 미용'].map(
                  (tag) => (
                    <button
                      key={tag}
                      onClick={() => setSearchQuery(tag)}
                      className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-full text-sm text-gray-700 transition"
                    >
                      {tag}
                    </button>
                  )
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 애니메이션 스타일 */}
      <style>{`
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        @keyframes slide-down {
          from {
            opacity: 0;
            transform: translateY(-20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .animate-fade-in {
          animation: fade-in 0.2s ease-out;
        }
        
        .animate-slide-down {
          animation: slide-down 0.3s ease-out;
        }

        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>
    </>
  );
}
