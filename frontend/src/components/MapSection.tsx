import { useState, useEffect, useRef } from 'react';
import { Facility, District } from '../lib/supabase';
import FacilityModal from './FacilityModal';
import { Crosshair } from 'lucide-react';

interface MapSectionProps {
  facilities: Facility[];
  loading: boolean;
  districts: District[];
  selectedGu: string | null;
  setSelectedGu: (gu: string | null) => void;
  selectedCategories: string[];
  setSelectedCategories: (categories: string[]) => void;
  findLocationTrigger: number;
  setShowGuSelect: (v: boolean) => void; 
}

declare global {
  interface Window {
    kakao: any;
  }
}

const districtCenters: Record<string, { lat: number; lng: number }> = {
  "강남구": { lat: 37.5172, lng: 127.0473 },
  "강동구": { lat: 37.5301, lng: 127.1238 },
  "강북구": { lat: 37.6396, lng: 127.0257 },
  "강서구": { lat: 37.5510, lng: 126.8495 },
  "관악구": { lat: 37.4784, lng: 126.9516 },
  "광진구": { lat: 37.5384, lng: 127.0823 },
  "구로구": { lat: 37.4954, lng: 126.8875 },
  "금천구": { lat: 37.4501, lng: 126.9004 },
  "노원구": { lat: 37.6543, lng: 127.0564 },
  "도봉구": { lat: 37.6688, lng: 127.0471 },
  "동대문구": { lat: 37.5744, lng: 127.0396 },
  "동작구": { lat: 37.5124, lng: 126.9393 },
  "마포구": { lat: 37.5634, lng: 126.9083 },
  "서대문구": { lat: 37.5791, lng: 126.9368 },
  "서초구": { lat: 37.4836, lng: 127.0326 },
  "성동구": { lat: 37.5633, lng: 127.0369 },
  "성북구": { lat: 37.5894, lng: 127.0182 },
  "송파구": { lat: 37.5145, lng: 127.1058 },
  "양천구": { lat: 37.5271, lng: 126.8562 },
  "영등포구": { lat: 37.5263, lng: 126.8963 },
  "용산구": { lat: 37.5325, lng: 126.9900 },
  "은평구": { lat: 37.6176, lng: 126.9227 },
  "종로구": { lat: 37.5730, lng: 126.9794 },
  "중구": { lat: 37.5636, lng: 126.9977 },
  "중랑구": { lat: 37.6060, lng: 127.0927 },
};

const SEOUL_TEST_COORDS = {
  lat: 37.5665,
  lng: 126.9780,
};

export default function MapSection({
  facilities,
  loading,
  districts,
  selectedGu,
  setSelectedGu,
  selectedCategories,
  setSelectedCategories,
  findLocationTrigger,
  setShowGuSelect,
}: MapSectionProps) {

  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<any>(null);
  const [markers, setMarkers] = useState<any[]>([]);
  const [userMarker, setUserMarker] = useState<any>(null);
  const [selectedFacility, setSelectedFacility] = useState<Facility | null>(null);

  // ⭐ 구 선택 → 지도 이동
  useEffect(() => {
    if (!map || !selectedGu) return;
    const pos = districtCenters[selectedGu];
    if (!pos) return;

    map.panTo(new window.kakao.maps.LatLng(pos.lat, pos.lng));
    map.setLevel(5);
  }, [map, selectedGu]);

  // ⭐ 최초 지도 로딩
  useEffect(() => {
    const script = document.createElement("script");
    script.src = `//dapi.kakao.com/v2/maps/sdk.js?appkey=${
      import.meta.env.VITE_KAKAO_MAP_API_KEY
    }&autoload=false`;
    script.async = true;
    document.head.appendChild(script);

    script.onload = () => {
      window.kakao.maps.load(() => {
        if (mapRef.current) {
          const newMap = new window.kakao.maps.Map(mapRef.current, {
            center: new window.kakao.maps.LatLng(
              SEOUL_TEST_COORDS.lat,
              SEOUL_TEST_COORDS.lng
            ),
            level: 8,
          });
          setMap(newMap);
        }
      });
    };

    return () => document.head.removeChild(script);
  }, []);

  // ⭐ 시설 마커 렌더링
  useEffect(() => {
    if (!map) return;

    // 기존 마커 제거
    markers.forEach(m => m.setMap(null));

    if (!facilities.length) {
      setMarkers([]);
      return;
    }

    const newMarkers = facilities.map(f => {
      const marker = new window.kakao.maps.Marker({
        map,
        position: new window.kakao.maps.LatLng(f.latitude, f.longitude),
      });

      window.kakao.maps.event.addListener(marker, "click", () => {
        setSelectedFacility(f);
      });

      return marker;
    });

    setMarkers(newMarkers);
  }, [map, facilities]);

  // ⭐ 내 위치 버튼
  const handleCurrentLocationClick = () => {
    const lat = SEOUL_TEST_COORDS.lat;
    const lng = SEOUL_TEST_COORDS.lng;

    if (userMarker) userMarker.setMap(null);

    const newMarker = new window.kakao.maps.Marker({
      map,
      position: new window.kakao.maps.LatLng(lat, lng),
    });

    setUserMarker(newMarker);
    map.panTo(newMarker.getPosition());
    map.setLevel(4);
  };

  // ⭐ 카테고리 토글
  const toggleCategory = (value: string) => {
    if (selectedCategories.includes(value)) {
      setSelectedCategories(selectedCategories.filter(v => v !== value));
    } else {
      setSelectedCategories([...selectedCategories, value]);
    }
  };

  const uiCategories = [
    { value: 'hospital', label: '병 원' },
    { value: 'pharmacy', label: '약 국' },
    { value: 'grooming', label: '미 용 샵' },
    { value: 'culture_center', label: '문 화 센 터' },
    { value: 'travel', label: '여 행 지' },
    { value: 'care_service', label: '위 탁 관 리' },
    { value: 'pension', label: '펜 션' },
    { value: 'pet_supplies', label: '동 물 용 품' },
    { value: 'restaurant', label: '식 당' },
  ];

  return (
    <section className="py-16 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 lg:flex gap-8">

        {/* 지도 */}
        <div className="flex-1 bg-white rounded-xl shadow p-4">
          <div ref={mapRef} className="w-full h-[500px] rounded-lg bg-gray-100" />
        </div>

        {/* 오른쪽 패널 */}
        <div className="w-full lg:w-80 bg-white p-4 rounded-xl shadow">

          {/* 선택된 구 */}
          <div className="mb-6 p-4 bg-gray-100 rounded-lg">
            <h3 className="font-bold text-lg text-gray-800 mb-2">선택된 위치</h3>

            {selectedGu ? (
              <div className="text-primary font-semibold text-xl">{selectedGu}</div>
            ) : (
              <div className="text-gray-500 text-sm">구가 선택되지 않았습니다.</div>
            )}

            <button
              onClick={() => setShowGuSelect(true)}
              className="mt-4 px-3 py-1 bg-gray-300 rounded hover:bg-gray-400 text-sm"
            >
              ← 다시 지도 선택하기
            </button>
          </div>

          {/* 내 위치 버튼 */}
          <button
            onClick={handleCurrentLocationClick}
            className="flex items-center gap-2 bg-gray-200 hover:bg-gray-300 px-3 py-2 rounded-md w-full text-sm mb-6"
          >
            <Crosshair size={16} /> 내 위치로 이동
          </button>

          {/* 카테고리 */}
          <h3 className="font-bold text-lg mb-2">2. 항목 선택</h3>

          <div className="flex flex-wrap gap-2">
            {uiCategories.map(c => (
              <button
                key={c.value}
                onClick={() => toggleCategory(c.value)}
                className={`py-1 px-3 rounded-full text-sm ${
                  selectedCategories.includes(c.value)
                    ? "bg-primary text-white"
                    : "bg-gray-200 hover:bg-gray-300"
                }`}
              >
                {c.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {selectedFacility && (
        <FacilityModal facility={selectedFacility} onClose={() => setSelectedFacility(null)} />
      )}
    </section>
  );
}
