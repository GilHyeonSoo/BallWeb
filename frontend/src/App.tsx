import { Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';
import MyPage from './pages/MyPage';
import GalleryPage from './pages/GalleryPage';
import KakaoMapPage from './pages/KakaoMapPage';
import QuestionPage from './pages/QuestionPage';

function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/kakaomap" element={<KakaoMapPage />} />
      <Route path="/mypage" element={<MyPage />} />
      <Route path="/gallery" element={<GalleryPage />} />
      <Route path="/questions" element={<QuestionPage />} />
    </Routes>
  );
}

export default App;
