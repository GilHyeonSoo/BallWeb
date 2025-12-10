import { useEffect, useRef, useState } from "react";
import { Plus, Minus, Map, Satellite, Search, Settings, Navigation } from "lucide-react";
import SettingsModal, { mapCategoryToMain } from "./SettingsModal";
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
  const mapContainer = useRef(null);
  const mapInstance = useRef(null);
  const activeInfoWindow = useRef(null);

  const [mapType, setMapType] = useState<"roadmap" | "skyview">("roadmap");
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  const [facilities, setFacilities] = useState<Facility[]>([]); // 원본 데이터
  const [filteredFacilities, setFilteredFacilities] = useState<Facility[]>([]); // 필터링된 데이터
  
  const [filterCategories, setFilterCategories] = useState<{ [key: string]: boolean }>({
    hospital: false, pharmacy: false, care: false, shop: false,
    cafe: false, culture: false, funeral: false, poopbag: false
  });

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

  const initMap = () => {
    if (!mapContainer.current) return;
    const { kakao } = window as any;

    const map = new kakao.maps.Map(mapContainer.current, {
      center: new kakao.maps.LatLng(center.lat, center.lng),
      level: 5,
    });
    mapInstance.current = map;

    const catMarkerImage = new kakao.maps.MarkerImage(
      "/cat_pin.svg",
      new kakao.maps.Size(60, 80), 
      { offset: new kakao.maps.Point(30, 80) }
    );

    new kakao.maps.Marker({
      position: new kakao.maps.LatLng(center.lat, center.lng),
      image: catMarkerImage,
      map,
    });
  };

  useEffect(() => {
    loadKakaoMapScript(() => {
      initMap();
    });
  }, [center]);

  // 데이터 로드
  useEffect(() => {
    if (!guName) return;
    fetch(`http://localhost:5001/api/facilities?gu=${encodeURIComponent(guName)}`)
      .then((res) => res.json())
      .then((data) => {
        setFacilities(data);
        setFilteredFacilities(data); 
      })
      .catch((err) => console.error("시설 조회 실패:", err));
  }, [guName]);

  // [핵심] 클라이언트 필터링 로직
  useEffect(() => {
    const activeKeys = Object.entries(filterCategories)
      .filter(([_, isActive]) => isActive)
      .map(([key]) => key);

    if (activeKeys.length === 0) {
      setFilteredFacilities(facilities);
      return;
    }

    const filtered = facilities.filter((f) => {
      // [수정] RDF 카테고리가 없어도, 이름(f.name)에 키워드가 있으면 매칭되도록 함
      // 예: 카테고리가 '기타'여도 이름이 '000 동물약국'이면 pharmacy로 매핑됨
      const mainCat = mapCategoryToMain(f.category, f.name); 
      return mainCat && activeKeys.includes(mainCat);
    });

    setFilteredFacilities(filtered);
  }, [facilities, filterCategories]);

  // 마커 표시
  useEffect(() => {
    if (!mapInstance.current) return;
    
    const { kakao } = window as any;
    const markers: any[] = [];

    const catMarkerImage = new kakao.maps.MarkerImage(
      "/cat_pin.svg",
      new kakao.maps.Size(30, 50), 
      { offset: new kakao.maps.Point(30, 50) }
    );

    filteredFacilities.forEach((f) => {
      const markerPosition = new kakao.maps.LatLng(f.lat, f.lng);
      
      const marker = new kakao.maps.Marker({
        map: mapInstance.current,
        position: markerPosition,
        title: f.name,
        image: catMarkerImage,
      });

      const infowindow = new kakao.maps.InfoWindow({
        content: `<div style="padding:5px; color:black;">${f.name}</div>`,
        removable: true,
      });

      kakao.maps.event.addListener(marker, "click", () => {
        if (activeInfoWindow.current) {
          activeInfoWindow.current.close();
        }
        infowindow.open(mapInstance.current, marker);
        activeInfoWindow.current = infowindow;

        if (onMarkerClick) {
          onMarkerClick(f);
        }
      });

      markers.push(marker);
    });

    return () => markers.forEach((m) => m.setMap(null));
  }, [filteredFacilities, onMarkerClick]);

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

  useEffect(() => {
    const controls = document.querySelector('.map-controls') as HTMLElement;
    if (!controls) return;
    controls.style.opacity = isSettingsOpen ? '0' : '1';
    controls.style.pointerEvents = isSettingsOpen ? 'none' : 'auto';
  }, [isSettingsOpen]);

  const handleSettingsApply = ({ district, categories }: { district: string; categories: any }) => {
    setFilterCategories(categories);
    if (district && district !== guName) {
      window.location.search = `?gu=${district}`;
    }
  };

  return (
    <>
      <SettingsModal 
        isOpen={isSettingsOpen} 
        onClose={() => setIsSettingsOpen(false)} 
        initialDistrict={guName}
        initialCategories={filterCategories}
        onApply={handleSettingsApply}
      />

      <SearchBar isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />

      <div ref={mapContainer} className="w-full h-full"></div>

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
