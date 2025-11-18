import { useEffect, useRef, useState } from 'react';
import { Plus, Minus, Map, Satellite, Home, Search, User, Settings, Navigation, Images } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Chatbot from './Chatbot';
import Dock from './Dock';

interface KakaoMapViewProps {
  center: { lat: number; lng: number };
  guName: string;
  onBack: () => void;
}

export default function KakaoMapView({ center, guName, onBack }: KakaoMapViewProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<any>(null);
  const [mapType, setMapType] = useState<'roadmap' | 'skyview'>('roadmap');
  const navigate = useNavigate();

  useEffect(() => {
    if (!mapContainer.current) return;

    const { kakao } = window as any;
    if (!kakao || !kakao.maps) {
      console.error('Kakao Maps API가 로드되지 않았습니다.');
      return;
    }

    const options = {
      center: new kakao.maps.LatLng(center.lat, center.lng),
      level: 5,
    };

    const map = new kakao.maps.Map(mapContainer.current, options);
    mapInstance.current = map;

    const markerPosition = new kakao.maps.LatLng(center.lat, center.lng);
    const marker = new kakao.maps.Marker({
      position: markerPosition,
    });
    marker.setMap(map);

    const infowindow = new kakao.maps.InfoWindow({
      content: `<div style="padding:10px;font-size:14px;font-weight:bold;">${guName}</div>`,
    });
    infowindow.open(map, marker);
  }, [center, guName]);

  const zoomIn = () => {
    if (!mapInstance.current) return;
    const level = mapInstance.current.getLevel();
    mapInstance.current.setLevel(level - 1);
  };

  const zoomOut = () => {
    if (!mapInstance.current) return;
    const level = mapInstance.current.getLevel();
    mapInstance.current.setLevel(level + 1);
  };

  const toggleMapType = (type: 'roadmap' | 'skyview') => {
    if (!mapInstance.current) return;
    const { kakao } = window as any;
    
    setMapType(type);
    
    if (type === 'skyview') {
      mapInstance.current.setMapTypeId(kakao.maps.MapTypeId.HYBRID);
    } else {
      mapInstance.current.setMapTypeId(kakao.maps.MapTypeId.ROADMAP);
    }
  };

  const goToMyLocation = () => {
    if (!mapInstance.current) return;
    
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { kakao } = window as any;
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          
          const moveLatLng = new kakao.maps.LatLng(lat, lng);
          mapInstance.current.setCenter(moveLatLng);
          
          new kakao.maps.Marker({
            position: moveLatLng,
            map: mapInstance.current,
          });
        },
        (error) => {
          console.error('위치 정보를 가져올 수 없습니다:', error);
          alert('위치 정보를 가져올 수 없습니다. 브라우저 설정을 확인해주세요.');
        }
      );
    } else {
      alert('이 브라우저는 위치 정보를 지원하지 않습니다.');
    }
  };

  const dockItems = [
    {
      icon: <Home size={24} color="#ffffff" />,
      label: '홈',
      onClick: onBack,
    },
    {
      icon: <Search size={24} color="#ffffff" />,
      label: '검색',
      onClick: () => {},
    },
    {
      icon: <Images size={24} color="#ffffff" />,
      label: '이미지',
      onClick: () => navigate('/mypage'),
    },
    {
      icon: <Settings size={24} color="#ffffff" />,
      label: '설정',
      onClick: () => console.log('설정'),
    },
  ];

  return (
    <>
      {/* 카카오맵 */}
      <div 
        className="w-full bg-white"
        style={{ height: 'calc(100vh - 4rem)' }}
      >
        <div ref={mapContainer} className="w-full h-full" />
      </div>

      {/* 챗봇 */}
      <Chatbot />

      {/* 지도 컨트롤 패널 - 오른쪽 하단으로 이동 */}
      <div className="fixed right-4 bottom-5 z-40 flex flex-col gap-2">
        {/* 확대/축소 버튼 그룹 */}
        <div className="bg-white rounded-lg shadow-lg overflow-hidden border border-gray-200">
          <button
            onClick={zoomIn}
            className="w-12 h-12 flex items-center justify-center hover:bg-gray-100 transition border-b border-gray-200"
            aria-label="지도 확대"
          >
            <Plus size={20} className="text-gray-700" />
          </button>
          <button
            onClick={zoomOut}
            className="w-12 h-12 flex items-center justify-center hover:bg-gray-100 transition"
            aria-label="지도 축소"
          >
            <Minus size={20} className="text-gray-700" />
          </button>
        </div>

        {/* 지도 타입 버튼 그룹 */}
        <div className="bg-white rounded-lg shadow-lg overflow-hidden border border-gray-200">
          <button
            onClick={() => toggleMapType('roadmap')}
            className={`w-12 h-12 flex items-center justify-center transition border-b border-gray-200 ${
              mapType === 'roadmap'
                ? 'bg-blue-500 text-white'
                : 'hover:bg-gray-100 text-gray-700'
            }`}
            aria-label="일반 지도"
          >
            <Map size={20} />
          </button>
          <button
            onClick={() => toggleMapType('skyview')}
            className={`w-12 h-12 flex items-center justify-center transition ${
              mapType === 'skyview'
                ? 'bg-blue-500 text-white'
                : 'hover:bg-gray-100 text-gray-700'
            }`}
            aria-label="위성 지도"
          >
            <Satellite size={20} />
          </button>
        </div>

        {/* 내 위치 버튼 */}
        <div className="bg-white rounded-lg shadow-lg overflow-hidden border border-gray-200">
          <button
            onClick={goToMyLocation}
            className="w-12 h-12 flex items-center justify-center hover:bg-blue-50 transition text-blue-500"
            aria-label="내 위치"
          >
            <Navigation size={20} />
          </button>
        </div>
      </div>

      {/* Dock */}
      <div className="fixed bottom-0 left-0 right-0 z-30 pointer-events-none">
        <div className="pointer-events-auto">
          <Dock items={dockItems} />
        </div>
      </div>
    </>
  );
}
