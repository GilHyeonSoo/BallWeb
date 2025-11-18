import { useState } from 'react';
import { Search, X } from 'lucide-react';

interface SearchBarProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SearchBar({ isOpen, onClose }: SearchBarProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<string[]>([]);

  const handleSearch = () => {
    if (!searchQuery.trim()) return;

    const mockResults = [
      `${searchQuery}에 대한 결과 1`,
      `${searchQuery}에 대한 결과 2`,
      `${searchQuery}에 대한 결과 3`,
    ];
    setSearchResults(mockResults);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
    if (e.key === 'Escape') {
      onClose();
    }
  };

  const handleClose = () => {
    setSearchQuery('');
    setSearchResults([]);
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

      {/* 검색창 - 수정된 부분 */}
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
              placeholder="병원, 약국, 동물 정보 검색..."
              className="flex-1 text-lg outline-none"
              autoFocus
            />
            <button
              onClick={handleClose}
              className="p-2 hover:bg-gray-100 rounded-full transition"
              aria-label="검색창 닫기"
            >
              <X size={24} className="text-gray-500" />
            </button>
          </div>

          {/* 검색 결과 영역 */}
          {searchResults.length > 0 && (
            <div className="max-h-96 overflow-y-auto">
              <div className="p-2">
                {searchResults.map((result, index) => (
                  <div
                    key={index}
                    className="px-4 py-3 hover:bg-gray-50 rounded-lg cursor-pointer transition"
                    onClick={() => {
                      console.log('선택된 결과:', result);
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <Search size={18} className="text-gray-400" />
                      <span className="text-gray-700">{result}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 검색어가 있지만 결과가 없을 때 */}
          {searchQuery && searchResults.length === 0 && (
            <div className="p-8 text-center text-gray-500">
              <Search size={48} className="mx-auto mb-3 text-gray-300" />
              <p>검색 결과가 없습니다.</p>
              <p className="text-sm mt-1">다른 키워드로 검색해보세요.</p>
            </div>
          )}

          {/* 초기 상태 */}
          {!searchQuery && searchResults.length === 0 && (
            <div className="p-6">
              <h3 className="text-sm font-semibold text-gray-500 mb-3">
                추천 검색어
              </h3>
              <div className="flex flex-wrap gap-2">
                {['동물병원', '반려동물 카페', '애견 미용', '24시 병원'].map(
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

      {/* 애니메이션 스타일 - 수정된 부분 */}
      <style>{`
        @keyframes fade-in {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
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
      `}</style>
    </>
  );
}
