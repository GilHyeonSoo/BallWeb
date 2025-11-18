import { Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';
import MyPage from './pages/MyPage';
import GalleryPage from './pages/GalleryPage';

function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/mypage" element={<MyPage />} />
      <Route path="/gallery" element={<GalleryPage />} />
    </Routes>
  );
}

export default App;
