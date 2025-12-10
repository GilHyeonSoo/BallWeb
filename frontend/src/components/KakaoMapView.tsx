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

// 🐶 카테고리별 캐릭터 핀 이미지 매핑
export const CATEGORY_IMAGES: { [key: string]: string } = {
  hospital: "/dog_pin.svg",
  pharmacy: "/panda_pin.svg",
  care:     "/frog_pin.svg",
  shop:     "/rabbit_pin.svg",
  cafe:     "/cheetah_pin.svg",
  culture:  "/quokka_pin.svg",
  funeral:  "/sheep_pin.svg",
  poopbag:  "/duckraccoon_pin.svg",
  default:  "/cat_pin.svg"
};

export default function KakaoMapView({ center, guName, onBack, onMarkerClick }: KakaoMapViewProps) {
  const mapContainer = useRef(null);
  const mapInstance = useRef(null);
  const activeInfoWindow = useRef(null);

  const [mapType, setMapType] = useState<"roadmap" | "skyview">("roadmap");
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [filteredFacilities, setFilteredFacilities] = useState<Facility[]>([]);
  
  const [filterCategories, setFilterCategories] = useState<{ [key: string]: boolean }>({
    hospital: true,
    pharmacy: false, care: false, shop: false,
    cafe: false, culture: false, funeral: false, poopbag: false
  });

  // ❌ loadKakaoMapScript 삭제됨 (index.html에서 로드함)

  const initMap = () => {
    if (!mapContainer.current) return;
    const { kakao } = window as any;

    // 안전 장치
    if (!kakao || !kakao.maps) return;

    const map = new kakao.maps.Map(mapContainer.current, {
      center: new kakao.maps.LatLng(center.lat, center.lng),
      level: 5,
    });
    mapInstance.current = map;

    // 초기 센터 마커
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

  // ✅ [수정] index.html의 스크립트 사용
  useEffect(() => {
    const { kakao } = window as any;
    if (kakao && kakao.maps) {
        kakao.maps.load(() => initMap());
    }
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

  // 필터링 로직
  useEffect(() => {
    const activeKeys = Object.entries(filterCategories)
      .filter(([_, isActive]) => isActive)
      .map(([key]) => key);

    if (activeKeys.length === 0) {
      setFilteredFacilities(facilities);
      return;
    }

    const filtered = facilities.filter((f) => {
      const mainCat = mapCategoryToMain(f.category, f.name); 
      return mainCat && activeKeys.includes(mainCat);
    });

    setFilteredFacilities(filtered);
  }, [facilities, filterCategories]);

  // 헬퍼 함수: 카테고리에 맞는 마커 이미지 생성
  const createMarkerImage = (categoryKey: string) => {
    const { kakao } = window as any;
    
    // 이미 정의된 CATEGORY_IMAGES에서 키에 맞는 이미지를 가져옴 (없으면 default)
    const imageSrc = CATEGORY_IMAGES[categoryKey] || CATEGORY_IMAGES['default'];

    return new kakao.maps.MarkerImage(
      imageSrc,
      new kakao.maps.Size(35, 55), 
      { offset: new kakao.maps.Point(17, 55) } 
    );
  };

  // 마커 표시
  useEffect(() => {
    if (!mapInstance.current) return;
    
    const { kakao } = window as any;
    const markers: any[] = [];

    filteredFacilities.forEach((f) => {
      const markerPosition = new kakao.maps.LatLng(f.lat, f.lng);
      
      // ✅ [수정] createMarkerImage 함수 호출로 변경
      const realCategory = mapCategoryToMain(f.category, f.name);

      const image = createMarkerImage(realCategory);

      const marker = new kakao.maps.Marker({
        map: mapInstance.current,
        position: markerPosition,
        title: f.name,
        image: image, // 이제 올바른 이미지가 들어갑니다
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

  // 지도 이동 및 핀 설정 함수
  const moveAndPin = (facility: Facility) => {
    setFilteredFacilities([facility]);

    if (mapInstance.current) {
      const { kakao } = window as any;
      const moveLatLon = new kakao.maps.LatLng(facility.lat, facility.lng);
      mapInstance.current.setCenter(moveLatLon);
      mapInstance.current.setLevel(3);
    }
    setIsSearchOpen(false);
  };

  // 검색 결과 처리
  const handleSearchResult = (result: any) => {
    const foundFacility = facilities.find(f => f.name === result.label);
    
    if (foundFacility) {
      moveAndPin(foundFacility);
    } else if (result.address) {
      const { kakao } = window as any;
      
      if (!kakao.maps.services) {
        alert("지도 서비스를 불러오는 중입니다. 잠시 후 다시 시도해주세요.");
        return;
      }

      const geocoder = new kakao.maps.services.Geocoder();

      geocoder.addressSearch(result.address, (data: any, status: any) => {
        if (status === kakao.maps.services.Status.OK) {
          const newFacility: Facility = {
            id: result.uri || Date.now(),
            name: result.label,
            category: result.type || 'search_result',
            lat: parseFloat(data[0].y),
            lng: parseFloat(data[0].x),
            address: result.address
          };
          moveAndPin(newFacility);
        } else {
          alert('주소로 위치를 찾을 수 없습니다.');
        }
      });
    } else {
      alert('위치 정보가 부족하여 이동할 수 없습니다.');
    }
  };

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
        { offset: new kakao.maps.Point(15, 50) }
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

      <SearchBar 
        isOpen={isSearchOpen} 
        onClose={() => setIsSearchOpen(false)} 
        onResultSelect={handleSearchResult} 
      />

      <div ref={mapContainer} className="w-full h-full"></div>

      <div className="map-controls absolute bottom-4 right-4 flex flex-col gap-3 z-10 transition-opacity duration-300">
        <button onClick={() => setIsSettingsOpen(true)} className="w-12 h-12 bg-white rounded-lg shadow-lg border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition">
          <Settings className="w-6 h-6 text-gray-700" />
        </button>

        <button onClick={() => setIsSearchOpen(true)} className="w-12 h-12 bg-white rounded-lg shadow-lg border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition">
          <Search className="w-6 h-6 text-gray-700" />
        </button>

        <div className="bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden">
          <button onClick={() => toggleMapType("roadmap")} className={`w-12 h-12 flex items-center justify-center border-b transition ${mapType === "roadmap" ? "bg-purple-400 text-white" : "text-gray-700 hover:bg-gray-100"}`}>
            <Map className="w-6 h-6" />
          </button>
          <button onClick={() => toggleMapType("skyview")} className={`w-12 h-12 flex items-center justify-center transition ${mapType === "skyview" ? "bg-purple-400 text-white" : "text-gray-700 hover:bg-gray-100"}`}>
            <Satellite className="w-6 h-6" />
          </button>
        </div>

        <div className="bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden">
          <button onClick={zoomIn} className="w-12 h-12 flex items-center justify-center border-b hover:bg-gray-100 transition">
            <Plus className="w-6 h-6 text-gray-700" />
          </button>
          <button onClick={zoomOut} className="w-12 h-12 flex items-center justify-center hover:bg-gray-100 transition">
            <Minus className="w-6 h-6 text-gray-700" />
          </button>
        </div>

        <button onClick={goToMyLocation} className="w-12 h-12 bg-white rounded-lg shadow-lg border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition">
          <Navigation className="w-6 h-6 text-gray-700" />
        </button>
      </div>
    </>
  );
}