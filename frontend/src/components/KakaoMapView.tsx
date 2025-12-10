import { useEffect, useRef, useState } from "react";
import { Plus, Minus, Map, Satellite, Search, Settings, Navigation } from "lucide-react";
import Chatbot from "./Chatbot";
import SettingsModal from "./SettingsModal";
import SearchBar from "./SearchBar";

interface KakaoMapViewProps {
  center: { lat: number; lng: number };
  guName: string;
  onBack: () => void;
  onMarkerClick?: (facility: any) => void; 
}

export default function KakaoMapView({ center, guName, onBack, onMarkerClick }: KakaoMapViewProps) {
  const mapContainer = useRef(null);
  const mapInstance = useRef<any>(null);
  
  // [수정] 현재 열려있는 인포윈도우를 추적하기 위한 ref
  // state로 관리하면 리렌더링 이슈가 생길 수 있어 ref가 더 적합할 때가 많으나,
  // 여기서는 간단히 로직 내부 변수나 ref로 처리합니다.
  const activeInfoWindow = useRef<any>(null); 

  const [mapType, setMapType] = useState<"roadmap" | "skyview">("roadmap");
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [facilities, setFacilities] = useState<any[]>([]);

  // --------------------------
  // Kakao Map SDK 로드
  // --------------------------
  const loadKakaoMapScript = (callback: () => void) => {
    if (typeof window === "undefined") return;
    if (window.kakao && window.kakao.maps) {
      callback();
      return;
    }
    const script = document.createElement("script");
    script.src = `https://dapi.kakao.com/v2/maps/sdk.js?autoload=false&appkey=4e34ef0e449c2ec445ee2ed78657054e`;
    script.onload = () => {
      window.kakao.maps.load(callback);
    };
    document.head.appendChild(script);
  };

  // --------------------------
  // 지도 초기화 함수
  // --------------------------
  const initMap = () => {
    if (!mapContainer.current) return;
    const { kakao } = window;
    const map = new kakao.maps.Map(mapContainer.current, {
      center: new kakao.maps.LatLng(center.lat, center.lng),
      level: 5,
    });
    mapInstance.current = map;
    
    // 중심 좌표 마커 (구청 등)
    const marker = new kakao.maps.Marker({
      position: new kakao.maps.LatLng(center.lat, center.lng),
      map,
    });
    
    // 구 이름 인포윈도우 (이건 항상 떠있어도 되는지, 아니면 이것도 닫혀야 하는지에 따라 다르지만 보통 유지)
    // 만약 이것도 닫히길 원하면 activeInfoWindow에 할당하면 됩니다.
    // 여기서는 구 이름은 계속 떠있도록 둡니다.
    new kakao.maps.InfoWindow({
      content: `<div style="padding:5px;">${guName}</div>`,
    }).open(map, marker);
  };

  useEffect(() => {
    loadKakaoMapScript(() => {
      initMap();
    });
  }, [center]);

  // --------------------------
  // 데이터 로드
  // --------------------------
  useEffect(() => {
    if (!guName) return;
    fetch(`http://localhost:5001/api/facilities?gu=${encodeURIComponent(guName)}`)
      .then((res) => res.json())
      .then((data) => {
        setFacilities(data);
      })
      .catch((err) => console.error("시설 조회 실패:", err));
  }, [guName]);

  // --------------------------
  // 시설 마커 표시 (여기가 수정됨)
  // --------------------------
  useEffect(() => {
    if (!mapInstance.current) return;
    if (facilities.length === 0) return;
    const { kakao } = window;
    const markers: any[] = [];
    
    facilities.forEach((f) => {
      const markerPosition = new kakao.maps.LatLng(f.lat, f.lng);
      const marker = new kakao.maps.Marker({
        map: mapInstance.current,
        position: markerPosition,
        title: f.name,
      });
      
      // 인포윈도우 생성 (열지는 않음)
      const infowindow = new kakao.maps.InfoWindow({
        content: `<div style="padding:5px; z-index:1; white-space:nowrap;">${f.name}</div>`,
        removable: true, // 닫기 버튼 추가 (선택사항)
      });
      
      // 마커 클릭 이벤트
      kakao.maps.event.addListener(marker, "click", () => {
        // [핵심 로직]
        // 1. 기존에 열려있는 인포윈도우가 있다면 닫는다.
        if (activeInfoWindow.current) {
            activeInfoWindow.current.close();
        }

        // 2. 현재 클릭한 마커의 인포윈도우를 연다.
        infowindow.open(mapInstance.current, marker);

        // 3. 현재 열린 인포윈도우를 activeInfoWindow에 저장한다.
        activeInfoWindow.current = infowindow;
        
        // 4. 부모에게 데이터 전달
        if (onMarkerClick) {
            onMarkerClick(f);
        }
      });
      
      markers.push(marker);
    });
    
    return () => markers.forEach((m) => m.setMap(null));
  }, [facilities, onMarkerClick]);

  // --------------------------
  // 지도 조작 함수들 (그대로 유지)
  // --------------------------
  const zoomIn = () => mapInstance.current?.setLevel(mapInstance.current.getLevel() - 1);
  const zoomOut = () => mapInstance.current?.setLevel(mapInstance.current.getLevel() + 1);
  const toggleMapType = (type: "roadmap" | "skyview") => {
    const { kakao } = window;
    setMapType(type);
    mapInstance.current?.setMapTypeId(
      type === "skyview" ? kakao.maps.MapTypeId.HYBRID : kakao.maps.MapTypeId.ROADMAP
    );
  };
  const goToMyLocation = () => {
    if (!navigator.geolocation) return;
    const { kakao } = window;
    navigator.geolocation.getCurrentPosition((pos) => {
      const latlng = new kakao.maps.LatLng(pos.coords.latitude, pos.coords.longitude);
      mapInstance.current?.setCenter(latlng);
      new kakao.maps.Marker({ position: latlng, map: mapInstance.current });
      mapInstance.current?.setLevel(4);
    });
  };

  return (
    <div className="relative w-full h-full">
      <div ref={mapContainer} className="w-full h-full" />

      <Chatbot />
      <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
      <SearchBar isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />

      <div className="absolute top-4 right-4 flex flex-col gap-2 z-10">
        <button
          onClick={() => setIsSettingsOpen(true)}
          className="w-12 h-12 bg-white rounded-lg shadow-lg border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-colors"
        >
          <Settings className="w-6 h-6 text-gray-700" />
        </button>

        <button
          onClick={() => setIsSearchOpen(true)}
          className="w-12 h-12 bg-white rounded-lg shadow-lg border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-colors"
        >
          <Search className="w-6 h-6 text-gray-700" />
        </button>

        <div className="flex flex-col bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden">
          <button
            onClick={() => toggleMapType("roadmap")}
            className={`w-12 h-12 flex items-center justify-center border-b transition-colors ${
              mapType === "roadmap" ? "bg-blue-500 text-white" : "hover:bg-gray-50 text-gray-700"
            }`}
          >
            <Map className="w-6 h-6" />
          </button>
          <button
            onClick={() => toggleMapType("skyview")}
            className={`w-12 h-12 flex items-center justify-center transition-colors ${
              mapType === "skyview" ? "bg-blue-500 text-white" : "hover:bg-gray-50 text-gray-700"
            }`}
          >
            <Satellite className="w-6 h-6" />
          </button>
        </div>

        <div className="flex flex-col bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden mt-2">
          <button
            onClick={zoomIn}
            className="w-12 h-12 flex items-center justify-center border-b hover:bg-gray-50 transition-colors"
          >
            <Plus className="w-6 h-6 text-gray-700" />
          </button>
          <button
            onClick={zoomOut}
            className="w-12 h-12 flex items-center justify-center hover:bg-gray-50 transition-colors"
          >
            <Minus className="w-6 h-6 text-gray-700" />
          </button>
        </div>

        <button
          onClick={goToMyLocation}
          className="w-12 h-12 bg-white rounded-lg shadow-lg border border-gray-200 flex items-center justify-center mt-2 hover:bg-gray-50 transition-colors"
        >
          <Navigation className="w-6 h-6 text-blue-500" />
        </button>
      </div>
    </div>
  );
}
