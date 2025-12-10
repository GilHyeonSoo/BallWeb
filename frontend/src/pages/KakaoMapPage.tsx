import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import KakaoMapView from '../components/KakaoMapView';
import Header from '../components/Header';
import { X, Loader2, MapPin, Phone, Clock, Info, CalendarOff, Mail, Car, FileText } from 'lucide-react';

// ... (guCenters 코드는 그대로 유지) ...
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

const keyMapping: { [key: string]: string } = {
  'DESC': '설명',
  'DESCRIPTION': '상세 설명',
  'DONG': '행정동',
  'LOTADDRESS': '지번 주소',
  'HOLIDAY': '휴무일',
  'PARKINGAVAILABLE': '주차 가능 여부',
  'POSTALCODE': '우편번호',
  'HOMEPAGE': '홈페이지',
  'WEBSITE': '웹사이트',
  'TYPE': '시설 유형',
};

// [헬퍼 함수] 대소문자 무시하고 값 찾기
const getValue = (data: any, keyName: string) => {
    if (!data) return null;
    const lowerKey = keyName.toLowerCase();
    const foundKey = Object.keys(data).find(k => k.toLowerCase() === lowerKey);
    return foundKey ? data[foundKey] : null;
};

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
      const facilityId = basicInfo.id || basicInfo.facility || basicInfo.uri;
      
      if (!facilityId) {
          setDetailData(basicInfo);
          setLoading(false);
          return;
      }

      const response = await fetch(`http://localhost:5001/api/facility/detail?id=${encodeURIComponent(facilityId)}`);
      
      if (!response.ok) {
        throw new Error('상세 정보 조회 실패');
      }

      const data = await response.json();
      setDetailData({ ...basicInfo, ...data });

    } catch (error) {
      console.error(error);
      setDetailData(basicInfo);
    } finally {
      setLoading(false);
    }
  };

  const closePanel = () => {
    setIsPanelOpen(false);
    setDetailData(null);
  };

  // 렌더링 제외 키 (소문자로 비교)
  const excludeKeys = [
    'name', 'lat', 'lng', 'id', 'type', 'uri', 'facility', 
    'gu', 'sido', 'category', 'label', 'latitude', 'longitude', 
    'dong', 'description', 
    'address', 'streetaddress', 'tel', 'telephone', 'hours', 'image', 
    'postalcode', 'holiday', 'lotaddress', 'desc', 'parkingavailable'
  ];

  // [중요] 렌더링 시 사용할 변수 미리 추출 (대소문자 무시)
  const addressVal = getValue(detailData, 'address') || getValue(detailData, 'streetAddress');
  const lotAddressVal = getValue(detailData, 'lotAddress');
  const postalCodeVal = getValue(detailData, 'postalCode');
  const telVal = getValue(detailData, 'tel') || getValue(detailData, 'telephone');
  const descVal = getValue(detailData, 'desc') || getValue(detailData, 'description');
  const hoursVal = getValue(detailData, 'hours');
  const holidayVal = getValue(detailData, 'holiday');
  const parkingVal = getValue(detailData, 'parkingAvailable');
  const imageVal = getValue(detailData, 'image');

  return (
    <div className="flex flex-col h-screen w-full relative overflow-hidden bg-white">
      <Header title={`${guName} 동물 보호 센터`} onBack={handleBack} />
      
      <div className="flex-1 relative flex">
        <div className="w-full h-full">
            <KakaoMapView 
                center={center} 
                guName={guName} 
                onBack={handleBack}
                onMarkerClick={handleMarkerClick}
            />
        </div>

        {/* 슬라이드 패널 */}
        <div 
          className={`absolute top-0 right-0 h-full w-full sm:w-[400px] bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-in-out border-l border-gray-200 flex flex-col ${
            isPanelOpen ? 'translate-x-0' : 'translate-x-full'
          }`}
        >
          {/* 패널 헤더 */}
          <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-white sticky top-0 z-10">
            <h2 className="text-xl font-bold text-gray-900 truncate pr-4">
              {detailData ? detailData.name : "정보 불러오는 중"}
            </h2>
            <button 
              onClick={closePanel} 
              className="p-2 rounded-full hover:bg-gray-100 transition-colors duration-200 focus:outline-none"
            >
              <X className="w-6 h-6 text-gray-400" />
            </button>
          </div>

          {/* 패널 컨텐츠 */}
          <div className="flex-1 overflow-y-auto p-6 bg-white custom-scrollbar">
            {loading ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-400 space-y-3">
                <Loader2 className="w-10 h-10 animate-spin text-blue-500" />
                <p className="text-sm font-medium">상세 정보를 불러오고 있습니다...</p>
              </div>
            ) : detailData ? (
              <div className="space-y-6 pb-10">
                 
                 {/* 1. 주소 정보 (도로명 + 지번) */}
                 <div>
                  <div className="flex items-center mb-2">
                    <MapPin className="w-4 h-4 text-blue-500 mr-1.5" />
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">주소</span>
                  </div>
                  {/* 도로명 주소 */}
                  <div className="w-full bg-gray-50 border border-gray-100 rounded-lg p-4 text-gray-700 text-sm leading-relaxed mb-2">
                    <span className="text-xs font-bold text-gray-400 mr-2">도로명</span>
                    {addressVal || "주소 정보 없음"}
                  </div>
                  {/* 지번 주소 */}
                  {lotAddressVal && (
                    <div className="w-full bg-gray-50 border border-gray-100 rounded-lg p-4 text-gray-700 text-sm leading-relaxed mb-2">
                      <span className="text-xs font-bold text-gray-400 mr-2">지번</span>
                      {lotAddressVal}
                    </div>
                  )}
                  {/* 우편번호 */}
                  {postalCodeVal && (
                    <div className="flex items-center text-xs text-gray-500 ml-1">
                      <Mail className="w-3 h-3 mr-1" />
                      <span className="font-medium mr-1">우편번호:</span>
                      <span>{postalCodeVal}</span>
                    </div>
                  )}
                 </div>

                 {/* 2. 전화번호 */}
                 {telVal && (
                  <div>
                    <div className="flex items-center mb-2">
                      <Phone className="w-4 h-4 text-green-500 mr-1.5" />
                      <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">전화번호</span>
                    </div>
                    <div className="w-full bg-gray-50 border border-gray-100 rounded-lg p-4 text-gray-800 text-sm font-semibold tracking-wide">
                      {telVal}
                    </div>
                  </div>
                 )}

                 {/* 3. 설명 (운영정보 위) */}
                 {descVal && (
                   <div>
                    <div className="flex items-center mb-2">
                      <FileText className="w-4 h-4 text-purple-500 mr-1.5" />
                      <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">설명</span>
                    </div>
                    <div className="w-full bg-gray-50 border border-gray-100 rounded-lg p-4 text-gray-700 text-sm leading-relaxed">
                      {descVal}
                    </div>
                   </div>
                 )}

                {/* 4. 운영 정보 (시간 + 휴무일) */}
                {(hoursVal || holidayVal) && (
                  <div>
                    <div className="flex items-center mb-2">
                      <Clock className="w-4 h-4 text-orange-500 mr-1.5" />
                      <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">운영 정보</span>
                    </div>
                    <div className="w-full bg-gray-50 border border-gray-100 rounded-lg p-4">
                        {/* 운영 시간 */}
                        {hoursVal ? (
                            <div className="text-gray-600 text-sm whitespace-pre-wrap leading-relaxed mb-3">
                                {hoursVal}
                            </div>
                        ) : (
                            <div className="text-gray-400 text-sm mb-3">운영 시간 정보 없음</div>
                        )}
                        
                        {/* 휴무일 */}
                        {holidayVal && (
                            <div className="flex items-start pt-3 border-t border-gray-200">
                                <CalendarOff className="w-4 h-4 text-red-400 mr-2 mt-0.5" />
                                <div>
                                    <span className="text-xs font-bold text-gray-500 block mb-0.5">휴무일</span>
                                    <span className="text-sm text-gray-700">{holidayVal}</span>
                                </div>
                            </div>
                        )}
                    </div>
                  </div>
                )}

                {/* 5. 주차 정보 (운영정보 아래) */}
                {parkingVal && (
                  <div>
                    <div className="flex items-center mb-2">
                      <Car className="w-4 h-4 text-blue-400 mr-1.5" />
                      <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">주차 정보</span>
                    </div>
                    <div className="w-full bg-gray-50 border border-gray-100 rounded-lg p-4 text-gray-700 text-sm font-medium">
                      {(String(parkingVal).toLowerCase() === 'true') ? '주차 가능' : 
                       (String(parkingVal).toLowerCase() === 'false') ? '주차 불가' : parkingVal}
                    </div>
                  </div>
                )}

                {/* 6. 이미지 */}
                {imageVal && (
                   <div>
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-2">시설 이미지</span>
                    <div className="rounded-lg overflow-hidden border border-gray-100 shadow-sm">
                      <img 
                        src={imageVal} 
                        alt={detailData.name} 
                        className="w-full h-auto object-cover hover:scale-105 transition-transform duration-300"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    </div>
                   </div>
                )}

                <div className="border-t border-gray-100 my-4"></div>

                {/* 7. 나머지 동적 데이터 */}
                {Object.entries(detailData).map(([key, value]) => {
                  const upperKey = key.toUpperCase();
                  const lowerKey = key.toLowerCase();
                  
                  if (excludeKeys.includes(lowerKey)) return null;
                  if (!value || value === 'null' || value === 'undefined') return null;

                  const label = keyMapping[upperKey] || key.replace(/([A-Z])/g, ' $1').trim();
                  let displayValue = String(value);

                  return (
                    <div key={key}>
                      <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-2 pl-1">
                        {label}
                      </span>
                      <div className="w-full bg-gray-50 border border-gray-100 rounded-lg p-4 text-gray-600 text-sm break-words leading-relaxed hover:bg-gray-100 transition-colors duration-200">
                        {displayValue.startsWith('http') ? (
                           <a href={displayValue} target="_blank" rel="noreferrer" className="text-blue-500 hover:underline break-all">
                             {displayValue}
                           </a>
                        ) : displayValue}
                      </div>
                    </div>
                  );
                })}

                <div className="h-10"></div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-64 text-gray-500">
                <Info className="w-10 h-10 text-gray-300 mb-2" />
                <p>선택된 시설의 정보가 없습니다.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
