import { useEffect, useRef, useState } from "react";
import { Plus, Minus, Map, Satellite, Search, Settings, Navigation } from "lucide-react";
import SettingsModal from "./SettingsModal";
import SearchBar from "./SearchBar";

interface Facility {
  id: string | number;
  name: string;
  category: string;
  lat: number;
  lng: number;
  address: string;
  phone?: string;
  url?: string;
  openinghours?: string;
}

interface KakaoMapViewProps {
  center: { lat: number; lng: number };
  guName: string;
  onBack: () => void;
  onMarkerClick?: (facility: any) => void;
}

export default function KakaoMapView({ center, guName, onBack, onMarkerClick }: KakaoMapViewProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<any>(null);
  const activeInfoWindow = useRef<any>(null);
  
  const [mapType, setMapType] = useState<"roadmap" | "skyview">("roadmap");
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [facilities, setFacilities] = useState<Facility[]>([]);

  // --------------------------
  // Kakao Map SDK 로드
  // --------------------------
  const loadKakaoMapScript = (callback: () => void) => {
    if (typeof window === "undefined") return;
    if ((window as any).kakao && (window as any).kakao.maps) {
      callback();
      return;
    }

    const script = document.createElement("script");
    script.src = `https://dapi.kakao.com/v2/maps/sdk.js?autoload=false&appkey=4e34ef0e449c2ec445ee2ed78657054e`;
    script.onload = () => {
      (window as any).kakao.maps.load(callback);
    };
    document.head.appendChild(script);
  };

  // --------------------------
  // 지도 초기화 함수
  // --------------------------
  const initMap = () => {
    if (!mapContainer.current) return;
    const { kakao } = window as any;
    const map = new kakao.maps.Map(mapContainer.current, {
      center: new kakao.maps.LatLng(center.lat, center.lng),
      level: 5,
    });
    mapInstance.current = map;

    // 🐱 중심 좌표 마커 - cat_pin.svg 사용
    const catMarkerImage = new kakao.maps.MarkerImage(
      "/cat_pin.svg",
      new kakao.maps.Size(60, 80), // 마커 이미지 크기 (폭, 높이)
      { offset: new kakao.maps.Point(30, 80) } // 마커 이미지의 기준점 (중앙 하단)
    );

    const marker = new kakao.maps.Marker({
      position: new kakao.maps.LatLng(center.lat, center.lng),
      image: catMarkerImage,
      map,
    });

    // 구 이름 인포윈도우
    // new kakao.maps.InfoWindow({
    //   content: `<div style="padding:5px;">${guName}</div>`,
    // }).open(map, marker);
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
  // 시설 마커 표시
  // --------------------------
  useEffect(() => {
    if (!mapInstance.current) return;
    if (facilities.length === 0) return;

    const { kakao } = window as any;
    const markers: any[] = [];

    // 🐱 시설 마커용 cat_pin.svg 이미지
    const catMarkerImage = new kakao.maps.MarkerImage(
      "/cat_pin.svg",
      new kakao.maps.Size(30, 50), // 시설 마커는 조금 작게
      { offset: new kakao.maps.Point(30, 50) }
    );

    facilities.forEach((f) => {
      const markerPosition = new kakao.maps.LatLng(f.lat, f.lng);
      const marker = new kakao.maps.Marker({
        map: mapInstance.current,
        position: markerPosition,
        title: f.name,
        image: catMarkerImage, // 🎯 커스텀 이미지 적용
      });

      // 인포윈도우 생성
      const infowindow = new kakao.maps.InfoWindow({
        content: `<div style="padding:5px;">${f.name}</div>`,
        removable: true,
      });

      // 마커 클릭 이벤트
      kakao.maps.event.addListener(marker, "click", () => {
        // 기존 인포윈도우 닫기
        if (activeInfoWindow.current) {
          activeInfoWindow.current.close();
        }

        // 현재 인포윈도우 열기
        infowindow.open(mapInstance.current, marker);
        activeInfoWindow.current = infowindow;

        // 부모에게 데이터 전달
        if (onMarkerClick) {
          onMarkerClick(f);
        }
      });

      markers.push(marker);
    });

    return () => markers.forEach((m) => m.setMap(null));
  }, [facilities, onMarkerClick]);

  // --------------------------
  // 지도 조작 함수들
  // --------------------------
  const zoomIn = () => mapInstance.current?.setLevel(mapInstance.current.getLevel() - 1);
  const zoomOut = () => mapInstance.current?.setLevel(mapInstance.current.getLevel() + 1);
  
  const toggleMapType = (type: "roadmap" | "skyview") => {
    const { kakao } = window as any;
    setMapType(type);
    mapInstance.current?.setMapTypeId(
      type === "skyview" ? kakao.maps.MapTypeId.HYBRID : kakao.maps.MapTypeId.ROADMAP
    );
  };

  const goToMyLocation = () => {
    if (!navigator.geolocation) return;
    const { kakao } = window as any;
    
    navigator.geolocation.getCurrentPosition((pos) => {
      const latlng = new kakao.maps.LatLng(pos.coords.latitude, pos.coords.longitude);
      mapInstance.current?.setCenter(latlng);
      
      // 🐱 내 위치 마커도 cat_pin.svg 사용
      const catMarkerImage = new kakao.maps.MarkerImage(
        "/cat_pin.svg",
        new kakao.maps.Size(30, 50),
        { offset: new kakao.maps.Point(30, 50) }
      );
      
      new kakao.maps.Marker({ 
        position: latlng, 
        map: mapInstance.current,
        image: catMarkerImage
      });
      
      mapInstance.current?.setLevel(4);
    });
  };

  // Settings 열릴 때 컨트롤 숨기기
  useEffect(() => {
    const controls = document.querySelector('.map-controls') as HTMLElement;
    if (!controls) return;
    controls.style.opacity = isSettingsOpen ? '0' : '1';
    controls.style.pointerEvents = isSettingsOpen ? 'none' : 'auto';
  }, [isSettingsOpen]);

  return (
    <>
      <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
      <SearchBar isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />

      <div ref={mapContainer} className="w-full h-full" />

      {/* 버튼들 */}
      <div className="map-controls absolute bottom-4 right-4 flex flex-col gap-3 z-10 transition-opacity duration-300">
        <button
          onClick={() => setIsSettingsOpen(true)}
          className="w-12 h-12 bg-white rounded-lg shadow-lg border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition"
        >
          <Settings className="w-6 h-6 text-gray-700" />
        </button>

        <button
          onClick={() => setIsSearchOpen(true)}
          className="w-12 h-12 bg-white rounded-lg shadow-lg border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition"
        >
          <Search className="w-6 h-6 text-gray-700" />
        </button>

        {/* 지도/위성 버튼 */}
        <div className="bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden">
          <button
            onClick={() => toggleMapType("roadmap")}
            className={`w-12 h-12 flex items-center justify-center border-b transition ${
              mapType === "roadmap" ? "bg-purple-400 text-white" : "text-gray-700 hover:bg-gray-100"
            }`}
          >
            <Map className="w-6 h-6" />
          </button>
          <button
            onClick={() => toggleMapType("skyview")}
            className={`w-12 h-12 flex items-center justify-center transition ${
              mapType === "skyview" ? "bg-purple-400 text-white" : "text-gray-700 hover:bg-gray-100"
            }`}
          >
            <Satellite className="w-6 h-6" />
          </button>
        </div>

        {/* 줌 버튼 */}
        <div className="bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden">
          <button
            onClick={zoomIn}
            className="w-12 h-12 flex items-center justify-center border-b hover:bg-gray-100 transition"
          >
            <Plus className="w-6 h-6 text-gray-700" />
          </button>
          <button
            onClick={zoomOut}
            className="w-12 h-12 flex items-center justify-center hover:bg-gray-100 transition"
          >
            <Minus className="w-6 h-6 text-gray-700" />
          </button>
        </div>

        {/* 내 위치 버튼 */}
        <button
          onClick={goToMyLocation}
          className="w-12 h-12 bg-white rounded-lg shadow-lg border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition"
        >
          <Navigation className="w-6 h-6 text-gray-700" />
        </button>
      </div>
    </>
  );
}
