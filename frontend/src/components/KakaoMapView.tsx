import { useEffect, useRef, useState } from 'react';
import { Plus, Minus, Map, Satellite, Search, Settings, Navigation } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Chatbot from './Chatbot';
import SettingsModal from './SettingsModal';
import SearchBar from './SearchBar';

interface KakaoMapViewProps {
  center: { lat: number; lng: number };
  guName: string;
  onBack: () => void;
}

export default function KakaoMapView({ center, guName, onBack }: KakaoMapViewProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<any>(null);

  const [mapType, setMapType] = useState<'roadmap' | 'skyview'>('roadmap');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  const navigate = useNavigate();

  // --------------------------
  // 지도 로드
  // --------------------------
  useEffect(() => {
    if (!mapContainer.current) return;

    const { kakao } = window as any;

    const map = new kakao.maps.Map(
      mapContainer.current,
      {
        center: new kakao.maps.LatLng(center.lat, center.lng),
        level: 5
      }
    );

    mapInstance.current = map;

    const marker = new kakao.maps.Marker({
      position: new kakao.maps.LatLng(center.lat, center.lng)
    });
    marker.setMap(map);

    new kakao.maps.InfoWindow({
      content: `<div style="padding:10px;font-size:14px;font-weight:bold;">${guName}</div>`
    }).open(map, marker);
  }, [center, guName]);

  // --------------------------
  // 지도 조작 기능
  // --------------------------
  const zoomIn = () => mapInstance.current?.setLevel(mapInstance.current.getLevel() - 1);
  const zoomOut = () => mapInstance.current?.setLevel(mapInstance.current.getLevel() + 1);

  const toggleMapType = (type: 'roadmap' | 'skyview') => {
    const { kakao } = window as any;
    setMapType(type);

    mapInstance.current?.setMapTypeId(
      type === 'skyview' ? kakao.maps.MapTypeId.HYBRID : kakao.maps.MapTypeId.ROADMAP
    );
  };

  const goToMyLocation = () => {
    if (!navigator.geolocation) return;

    navigator.geolocation.getCurrentPosition(pos => {
      const { kakao } = window as any;
      const latlng = new kakao.maps.LatLng(pos.coords.latitude, pos.coords.longitude);
      mapInstance.current?.setCenter(latlng);
      new kakao.maps.Marker({ position: latlng, map: mapInstance.current });
    });
  };

  // --------------------------
  // 설정 모달 열릴 때 지도 버튼 숨기기
  // --------------------------
  useEffect(() => {
    const controls = document.querySelector('.map-controls') as HTMLElement;

    if (!controls) return;

    controls.style.opacity = isSettingsOpen ? '0' : '1';
    controls.style.pointerEvents = isSettingsOpen ? 'none' : 'auto';
  }, [isSettingsOpen]);


  return (
    <>
      {/* ----------------- 카카오맵 ----------------- */}
      <div className="w-full bg-white" style={{ height: 'calc(100vh - 4rem)' }}>
        <div ref={mapContainer} className="w-full h-full" />
      </div>

      {/* 챗봇 */}
      <Chatbot />

      {/* 🔍 검색바 */}
      <SearchBar isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />

      {/* ----------------- 지도 우측 버튼들 ----------------- */}
      <div className="fixed right-4 bottom-5 z-40 flex flex-col gap-2 map-controls">

        {/* 🔥 설정 버튼 (맨 위로 이동) */}
        <button
          onClick={() => setIsSettingsOpen(true)}
          className="w-12 h-12 bg-white rounded-lg shadow-lg border border-gray-200 flex items-center justify-center"
        >
          <Settings size={20} className="text-gray-800" />
        </button>

        {/* 🔍 검색 버튼 */}
        <button
          onClick={() => setIsSearchOpen(true)}
          className="w-12 h-12 bg-white rounded-lg shadow-lg border border-gray-200 flex items-center justify-center"
        >
          <Search size={20} className="text-gray-800" />
        </button>

        {/* 지도 타입 */}
        <div className="bg-white rounded-lg overflow-hidden shadow-lg border border-gray-200">
          <button
            onClick={() => toggleMapType('roadmap')}
            className={`w-12 h-12 flex items-center justify-center border-b ${
              mapType === 'roadmap' ? 'bg-blue-500 text-white' : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            <Map size={20} />
          </button>

          <button
            onClick={() => toggleMapType('skyview')}
            className={`w-12 h-12 flex items-center justify-center ${
              mapType === 'skyview' ? 'bg-blue-500 text-white' : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            <Satellite size={20} />
          </button>
        </div>

        {/* 확대/축소 */}
        <div className="bg-white rounded-lg overflow-hidden shadow-lg border border-gray-200">
          <button
            onClick={zoomIn}
            className="w-12 h-12 flex items-center justify-center border-b hover:bg-gray-100"
          >
            <Plus size={20} className="text-gray-700" />
          </button>
          <button
            onClick={zoomOut}
            className="w-12 h-12 flex items-center justify-center hover:bg-gray-100"
          >
            <Minus size={20} className="text-gray-700" />
          </button>
        </div>

        {/* 내 위치 */}
        <button
          onClick={goToMyLocation}
          className="w-12 h-12 bg-white rounded-lg shadow-lg border border-gray-200 flex items-center justify-center text-blue-500 hover:bg-blue-50"
        >
          <Navigation size={20} />
        </button>
      </div>

      {/* ----------------- 설정 모달 ----------------- */}
      <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
    </>
  );
}
