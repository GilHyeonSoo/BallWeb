import { useEffect, useRef, useState } from 'react';
import { Plus, Minus, Map, Satellite, Search, Settings, Navigation } from 'lucide-react';
import SettingsModal from './SettingsModal';
import SearchBar from './SearchBar';


// 1. 데이터 타입 정의 (운영시간 필드 추가됨 🌟)
interface Facility {
  id: string | number; 
  name: string;        
  category: string;    
  lat: number;         
  lng: number;         
  address: string;     
  phone?: string;      
  url?: string;        
  openinghours?: string; // 🕒 운영시간 (배변봉투함은 이 값이 없음)
}

interface KakaoMapViewProps {
  center: { lat: number; lng: number };
  guName: string;
  onBack: () => void;
  onMarkerClick?: (facility: any) => void; 
}

export default function KakaoMapView({ center, guName, onBack }: KakaoMapViewProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<any>(null);

  const activeInfoWindow = useRef<any>(null);

  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [mapType, setMapType] = useState<'roadmap' | 'skyview'>('roadmap');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  // --------------------------
  // (A) 백엔드 데이터 가져오기
  // --------------------------
  useEffect(() => {
    const fetchFacilities = async () => {
      try {
        // 🚀 [TODO] 백엔드 API 연결 시 주석 해제 및 URL 확인
        /*
        const response = await fetch('http://localhost:5001/api/places');
        const data = await response.json();
        setFacilities(data); 
        */

        console.log("데이터 수신 대기 중... (운영시간 포함)"); 

      } catch (error) {
        console.error("데이터 가져오기 실패:", error);
      }
    };

    fetchFacilities();
  }, []); 


  // --------------------------
  // (B) 지도 그리기 & 마커 표시
  // --------------------------
  useEffect(() => {
    if (!mapContainer.current) return;
    const { kakao } = window as any;

    const map = new kakao.maps.Map(mapContainer.current, {
      center: new kakao.maps.LatLng(center.lat, center.lng),
      level: 5,
    });
    mapInstance.current = map;

    // 중심 좌표(고양이 핀)
    const catMarkerImage = new kakao.maps.MarkerImage(
      "/cat_pin.svg", 
      new kakao.maps.Size(60, 80), 
      { offset: new kakao.maps.Point(30, 80) }
    );

    const mainMarker = new kakao.maps.Marker({
      position: new kakao.maps.LatLng(center.lat, center.lng),
      image: catMarkerImage,
      map: map
    });

    new kakao.maps.InfoWindow({
      content: `<div style="padding:10px; font-weight:bold;">${guName}</div>`
    }).open(map, mainMarker);


    // 3. 시설 마커 생성 반복문 🌟
    facilities.forEach((place) => {
      
      // (1) 카테고리별 디자인
      let badgeColor = '#6B7280';
      let icon = '🐾';
      let label = '기타';

      const cat = place.category.toLowerCase();
      if (cat.includes('hospital') || cat.includes('병원')) { 
        badgeColor = '#EF4444'; icon = '🏥'; label = '병원';
      } else if (cat.includes('pharmacy') || cat.includes('약국')) { 
        badgeColor = '#3B82F6'; icon = '💊'; label = '약국';
      } else if (cat.includes('beauty') || cat.includes('미용')) { 
        badgeColor = '#F59E0B'; icon = '✂️'; label = '미용';
      } else if (cat.includes('park') || cat.includes('waste') || cat.includes('공원')) { 
        badgeColor = '#10B981'; icon = '🌳'; label = '편의';
      } else if (cat.includes('cafe') || cat.includes('카페')) { 
        badgeColor = '#8B5CF6'; icon = '☕'; label = '카페';
      }

      // (2) 마커 생성
      const marker = new kakao.maps.Marker({
        position: new kakao.maps.LatLng(place.lat, place.lng),
        map: map,
        title: place.name,
        image: catMarkerImage 
      });

      // (3) 팝업(인포윈도우) HTML 디자인 🌟
      const content = `
        <div style="padding:12px; width:210px; font-family:'Pretendard', sans-serif; border-radius:8px; background:white;">
          
          <div style="margin-bottom:6px;">
            <span style="background-color:${badgeColor}; color:white; padding:3px 6px; border-radius:4px; font-size:11px; font-weight:bold;">
              ${icon} ${label}
            </span>
          </div>

          <div style="font-weight:bold; font-size:15px; margin-bottom:4px; color:#1F2937; word-break:keep-all;">
            ${place.name}
          </div>

          <div style="font-size:12px; color:#6B7280; margin-bottom:4px; line-height:1.4;">
            ${place.address}
          </div>

          ${place.operatingHours ? `
            <div style="font-size:12px; color:#4B5563; margin-top:6px; display:flex; align-items:center; gap:4px;">
              🕒 <span style="font-weight:500;">${place.operatingHours}</span>
            </div>` : ''
          }

          ${place.phone ? `
            <div style="font-size:12px; color:#3B82F6; margin-top:4px; font-weight:500;">
              📞 ${place.phone}
            </div>` : ''
          }
          
          ${place.url ? `
            <div style="margin-top:8px; text-align:right;">
              <a href="${place.url}" target="_blank" style="text-decoration:none; color:#8B5CF6; font-size:11px; font-weight:bold; border:1px solid #E5E7EB; padding:2px 6px; border-radius:4px;">
                홈페이지 방문 >
              </a>
            </div>` : ''
          }
        </div>
      `;

      const infowindow = new kakao.maps.InfoWindow({
        content: content,
        removable: true
      });

      kakao.maps.event.addListener(marker, 'click', () => {
        infowindow.open(map, marker);
      });
    });

  }, [center, guName, facilities]);

  // --------------------------
  // 지도 컨트롤 (기존 코드 유지)
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

  useEffect(() => {
    const controls = document.querySelector('.map-controls') as HTMLElement;
    if (!controls) return;
    controls.style.opacity = isSettingsOpen ? '0' : '1';
    controls.style.pointerEvents = isSettingsOpen ? 'none' : 'auto';
  }, [isSettingsOpen]);


  return (
    <>
      <div className="w-full bg-white" style={{ height: 'calc(100vh - 4rem)' }}>
        <div ref={mapContainer} className="w-full h-full" />
      </div>
      <SearchBar isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
      <div className="fixed right-4 bottom-5 z-40 flex flex-col gap-2 map-controls">
        <button onClick={() => setIsSettingsOpen(true)} className="w-12 h-12 bg-white rounded-lg shadow-lg border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition">
          <Settings size={20} className="text-gray-800" />
        </button>
        <button onClick={() => setIsSearchOpen(true)} className="w-12 h-12 bg-white rounded-lg shadow-lg border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition">
          <Search size={20} className="text-gray-800" />
        </button>
        <div className="bg-white rounded-lg overflow-hidden shadow-lg border border-gray-200">
          <button onClick={() => toggleMapType('roadmap')} className={`w-12 h-12 flex items-center justify-center border-b transition ${mapType === 'roadmap' ? 'bg-purple-400 text-white' : 'text-gray-700 hover:bg-gray-100'}`}>
            <Map size={20} />
          </button>
          <button onClick={() => toggleMapType('skyview')} className={`w-12 h-12 flex items-center justify-center transition ${mapType === 'skyview' ? 'bg-purple-400 text-white' : 'text-gray-700 hover:bg-gray-100'}`}>
            <Satellite size={20} />
          </button>
        </div>
        <div className="bg-white rounded-lg overflow-hidden shadow-lg border border-gray-200">
          <button onClick={zoomIn} className="w-12 h-12 flex items-center justify-center border-b hover:bg-gray-100 transition">
            <Plus size={20} className="text-gray-700" />
          </button>
          <button onClick={zoomOut} className="w-12 h-12 flex items-center justify-center hover:bg-gray-100 transition">
            <Minus size={20} className="text-gray-700" />
          </button>
        </div>
        <button onClick={goToMyLocation} className="w-12 h-12 bg-purple-400 rounded-lg shadow-lg border border-gray-200 flex items-center justify-center text-white hover:bg-purple-500 transition">
          <Navigation size={20} />
        </button>
      </div>
      <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
    </>
  );
}