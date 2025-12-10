import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import KakaoMapView from '../components/KakaoMapView';
import Header from '../components/Header';
import { X, Loader2 } from 'lucide-react';

const guCenters: { [key: string]: { lat: number; lng: number } } = {
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

function useQuery() {
  return new URLSearchParams(useLocation().search);
}

export default function KakaoMapPage() {
  const query = useQuery();
  const guName = query.get('gu') || '노원구';
  const center = guCenters[guName] || { lat: 37.5665, lng: 126.9780 };
  
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [detailData, setDetailData] = useState<any>(null);

  const handleBack = () => {
    window.location.href = '/';
  };

  const handleMarkerClick = async (basicInfo: any) => {
    setIsPanelOpen(true);
    setLoading(true);
    setDetailData(null); 

    try {
      // id가 없는 경우 (URI가 아닌 경우) 예외 처리
      const facilityId = basicInfo.id || basicInfo.facility || basicInfo.uri;
      
      if (!facilityId) {
          console.error("ID(URI) 정보가 없습니다:", basicInfo);
          setDetailData(basicInfo); // 기본 정보만이라도 표시
          setLoading(false);
          return;
      }

      // API 호출
      const response = await fetch(`http://localhost:5001/api/facility/detail?id=${encodeURIComponent(facilityId)}`);
      
      if (!response.ok) {
        throw new Error('상세 정보 조회 실패');
      }

      const data = await response.json();
      
      // 기존 기본 정보 + 새로 받은 상세 정보 병합
      setDetailData({ ...basicInfo, ...data });

    } catch (error) {
      console.error(error);
      // 실패 시 기본 정보만 표시
      setDetailData(basicInfo);
    } finally {
      setLoading(false);
    }
  };

  const closePanel = () => {
    setIsPanelOpen(false);
    setDetailData(null);
  };

  return (
    <div className="flex flex-col h-screen w-full relative overflow-hidden">
      <Header title={`동물 보호 센터`} onBack={handleBack} />
      
      <div className="flex-1 relative flex">
        <div className="w-full h-full">
            <KakaoMapView 
                center={center} 
                guName={guName} 
                onBack={handleBack}
                onMarkerClick={handleMarkerClick}
            />
        </div>

        {isPanelOpen && (
          <div className="absolute top-0 right-0 h-full w-96 bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-in-out border-l border-gray-200 flex flex-col">
            
            <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
              <h2 className="text-lg font-bold text-gray-800 truncate pr-2">
                {detailData ? detailData.name : "시설 정보 불러오는 중..."}
              </h2>
              <button onClick={closePanel} className="p-1 rounded-full hover:bg-gray-200 transition-colors">
                <X className="w-6 h-6 text-gray-500" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1">
              {loading ? (
                <div className="flex flex-col items-center justify-center h-full text-gray-400">
                  <Loader2 className="w-8 h-8 animate-spin mb-2" />
                  <p className="text-sm">GraphDB에서 정보를 가져오는 중...</p>
                </div>
              ) : detailData ? (
                <div className="space-y-6">
                   <div>
                    <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-1">주소</span>
                    <p className="text-gray-700 text-sm leading-relaxed">{detailData.address || "정보 없음"}</p>
                   </div>

                   {detailData.tel && (
                    <div>
                      <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-1">전화번호</span>
                      <p className="text-gray-700 text-sm font-medium">{detailData.tel}</p>
                    </div>
                   )}

                  {/* 그 외 모든 동적 데이터 출력 */}
                  {Object.entries(detailData).map(([key, value]) => {
                    if (['name', 'address', 'tel', 'lat', 'lng', 'id', 'type', 'uri', 'facility'].includes(key)) return null;
                    return (
                      <div key={key}>
                        <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-1">{key}</span>
                        <p className="text-gray-600 text-sm bg-gray-50 p-3 rounded-lg border border-gray-100 break-words">
                          {String(value)}
                        </p>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center text-gray-500 mt-10">
                  정보를 불러올 수 없습니다.
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
