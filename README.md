# Animalloo - 서울 지역 기반 동물 정보 플랫폼

> 서울 지도를 활용한 인터랙티브 동물 정보 웹 애플리케이션

## 📋 프로젝트 개요

Animalloo는 서울의 25개 구를 인터랙티브한 지도로 표현하고, 각 구를 클릭하면 해당 지역의 카카오맵이 로드되는 웹 애플리케이션입니다. 물리 엔진 기반의 Ballpit 배경과 부드러운 애니메이션으로 사용자 경험을 극대화했습니다.

## ✨ 주요 기능

### 1. **인터랙티브 서울 지도**

- 25개 구의 SVG 기반 지도
- 마우스 호버 시 색상 변경 및 스케일 확대 효과
- 구 클릭 시 카카오맵으로 전환


### 2. **부드러운 화면 전환 애니메이션**

- 서울맵 → 카카오맵 전환 시 축소/확대 애니메이션
- Ballpit 배경의 페이드아웃 효과
- 1초간의 부드러운 transition 효과


### 3. **카카오맵 통합**

- Kakao Maps API 연동
- 선택한 구의 중심 좌표로 자동 이동
- 마커 및 정보창 표시


### 4. **macOS 스타일 Dock**

- 하단 고정 네비게이션 바
- 마우스 호버 시 아이콘 확대 효과 (Framer Motion)
- 커스터마이징 가능한 아이콘 및 색상


### 5. **로그인/회원가입 시스템**

- JWT 기반 인증
- 로그인 후 서울맵 확대 효과
- 헤더의 사용자 프로필 표시


### 6. **반응형 디자인**

- Tailwind CSS 기반 스타일링
- 모바일, 태블릿, 데스크탑 대응


## 🛠 기술 스택

### Frontend

- **React** 18.x + **TypeScript**
- **Vite** - 빠른 개발 환경
- **Tailwind CSS** - 유틸리티 기반 스타일링
- **Framer Motion** - 애니메이션 라이브러리
- **Lucide React** - 아이콘 라이브러리


### Backend

- **Node.js** + **Express**
- **SQLite** - 로컬 데이터베이스
- **JWT** - 인증 토큰


### APIs \& Libraries

- **Kakao Maps API** - 지도 서비스
- **React Context API** - 상태 관리
- **Canvas API** - Ballpit 물리 엔진


## 📦 설치 및 실행

### 1. 패키지 및 가상환경 설치

```bash
# Frontend
cd frontend

npm install three framer-motion lucide-react

# Backend
cd ../backend

python -m venv venv

venv/Scripts/activate

pip install requirements.txt
```


### 2. Kakao Maps API 키 설정

`frontend/public/index.html`에 API 키 추가:

```html
<script type="text/javascript" src="//dapi.kakao.com/v2/maps/sdk.js?appkey=YOUR_JAVASCRIPT_KEY"></script>
```


### 3. 개발 서버 실행

```bash
# Frontend (localhost:5173)
cd frontend
npm run dev

# Backend (localhost:5001)
cd backend
python app.py
```


## 🎨 주요 컴포넌트 구조

```
src/
├── components/
│   ├── Header.tsx              # 헤더 (로그인/로그아웃)
│   ├── SeoulMap.tsx            # 서울 지도 SVG
│   ├── KakaoMapView.tsx        # 카카오맵 뷰
│   ├── Dock.tsx                # macOS 스타일 Dock
│   ├── Ballpit.tsx             # 물리 엔진 배경
│   └── AnimatedText.tsx        # 텍스트 애니메이션
├── pages/
│   └── HomePage.tsx            # 메인 페이지
├── contexts/
│   └── AuthContext.tsx         # 인증 상태 관리
└── App.tsx
```


## 🔧 주요 개발 히스토리

### 1. **서울맵 구현**

- SVG path 기반 25개 구 지도 구현
- `makeProps` 함수로 이벤트 핸들러 통합
- hover 시 색상 변경 및 스케일 애니메이션 추가


### 2. **카카오맵 전환 애니메이션**

- `isTransitioning` 상태로 전환 제어
- 서울맵 축소 + 카카오맵 확대 동시 애니메이션
- 헤더 영역 침범 방지 (`top-16` 설정)


### 3. **Dock 네비게이션 구현**

- Framer Motion으로 확대 효과 구현
- 커스터마이징 가능한 아이콘 색상 및 크기
- 하단 고정 레이아웃


### 4. **로그인 후 맵 확대 효과**

- `isLoggedIn` 상태에 따른 조건부 클래스 적용
- 부드러운 transition 효과


### 5. **z-index 레이어 관리**

- Ballpit: `z-0`
- 서울맵: `z-10`
- 헤더: `z-40`
- 카카오맵: `z-50`


## 🎯 애니메이션 세부 설정

### 서울맵 축소 애니메이션

```css
@keyframes map-shrink {
  0% { transform: scale(1); opacity: 1; }
  100% { transform: scale(0); opacity: 0; }
}
```


### 카카오맵 확대 애니메이션

```css
@keyframes kakao-expand {
  0% { transform: scale(0); opacity: 0; }
  100% { transform: scale(1); opacity: 1; }
}
```


### Dock 아이콘 확대 효과

```tsx
magnification={70}    // 70px로 확대
distance={150}        // 150px 범위에서 효과 적용
```


## 🗺 서울 25개 구 좌표

각 구의 중심 좌표는 `guCenters` 객체에 정의:

```tsx
const guCenters = {
  '강남구': { lat: 37.5172, lng: 127.0473 },
  '강동구': { lat: 37.5301, lng: 127.1238 },
  '강북구': { lat: 37.6396, lng: 127.0257 },
  // ... 22개 구
};
```


## 🎨 커스터마이징 가이드

### Dock 크기 조정

```tsx
<Dock
  panelHeight={68}        // Dock 바 높이
  baseItemSize={50}       // 아이콘 기본 크기
  magnification={70}      // 확대 크기
  distance={150}          // 확대 효과 거리
/>
```


### 서울맵 구 간격 조정

```tsx
stroke="#FFFFFF"        // 테두리 색상
strokeWidth={3}         // 테두리 두께
```


### 아이콘 색상 변경

```tsx
icon: <Home size={20} color="#ffffff" />
```


## 📝 주요 이슈 및 해결

### 1. **Ballpit z-index 문제**

- **문제**: Ballpit이 서울맵 위에 렌더링되어 클릭 불가
- **해결**: `pointer-events-none` 추가


### 2. **카카오맵 헤더 침범**

- **문제**: 카카오맵 확대 시 헤더 영역 침범
- **해결**: `top-16` 적용하여 헤더 아래에서만 렌더링


### 3. **전환 애니메이션 끊김**

- **문제**: 화면 전환 시 애니메이션이 보이지 않음
- **해결**: `isTransitioning` 상태로 두 화면 동시 렌더링


## 📄 라이센스

MIT License

## 👥 기여

프로젝트에 기여하고 싶으시다면 Pull Request를 보내주세요!

***

**개발 기간**: 2025.11.16 - 2025.11.17
**개발자**: [Your Name]
**버전**: 1.0.0

