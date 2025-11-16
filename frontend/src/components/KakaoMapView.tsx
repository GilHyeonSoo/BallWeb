import { useEffect, useRef } from 'react';
import Dock from './Dock';
import { Home, MapPin, Search, Settings } from 'lucide-react'; // 아이콘 라이브러리

interface KakaoMapViewProps {
  center: { lat: number; lng: number };
  guName: string;
  onBack: () => void;
}

export default function KakaoMapView({ center, guName, onBack }: KakaoMapViewProps) {
  const mapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!mapRef.current || !window.kakao) return;

    const kakao = window.kakao;
    const container = mapRef.current;
    const options = {
      center: new kakao.maps.LatLng(center.lat, center.lng),
      level: 5,
    };

    const map = new kakao.maps.Map(container, options);

    const markerPosition = new kakao.maps.LatLng(center.lat, center.lng);
    const marker = new kakao.maps.Marker({
      position: markerPosition,
    });
    marker.setMap(map);

    const infowindow = new kakao.maps.InfoWindow({
      content: `<div style="padding:5px; font-weight:bold;">${guName}</div>`,
    });
    infowindow.open(map, marker);
  }, [center, guName]);

  // Dock 아이템 정의
  const dockItems = [
    { 
      icon: <Home size={20} color="#ffffff" />, 
      label: '홈', 
      onClick: onBack 
    },
    { 
      icon: <MapPin size={20} color="#ffffff" />, 
      label: '내 위치', 
      onClick: () => console.log('위치 클릭') 
    },
    { 
      icon: <Search size={20} color="#ffffff" />, 
      label: '검색', 
      onClick: () => console.log('검색 클릭') 
    },
    { 
      icon: <Settings size={20} color="#ffffff" />, 
      label: '설정', 
      onClick: () => console.log('설정 클릭') 
    },
  ];

  return (
    <div className="relative w-full h-full">
      {/* 카카오맵 */}
      <div ref={mapRef} className="w-full h-full" />

      {/* Dock */}
      <div className="absolute bottom-0 left-0 right-0 z-50 pointer-events-auto">
        <Dock
          items={dockItems}
          panelHeight={58}
          baseItemSize={40}
          magnification={55}
          distance={150}
        />
      </div>
    </div>
  );
}