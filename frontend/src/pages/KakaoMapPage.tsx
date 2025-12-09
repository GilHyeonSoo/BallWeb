import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import KakaoMapView from '../components/KakaoMapView';
import Header from '../components/Header';
import { X, Loader2 } from 'lucide-react';

// 구 중심 좌표 정의 (HomePage와 동일)
const guCenters = {
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

export default function KakaoMapPage() {
  const query = useQuery();
  const guName = query.get('gu') || '노원구';
  const center = guCenters[guName] || { lat: 37.5665, lng: 126.9780 };

  // onBack 핸들러를 통한 뒤로 가기(홈으로)
  const handleBack = () => {
    window.location.href = '/';
  };

  return (
    <div>
      <Header />
      <KakaoMapView center={center} guName={guName} onBack={handleBack} />
    </div>
  );
}
