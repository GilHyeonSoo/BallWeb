import { useState } from 'react';
import Header from '../components/Header';
import InfiniteMenu from '../components/InfiniteMenu';

const galleryItems = [
  {
    image: 'https://picsum.photos/600/600?random=1',
    link: '/detail/1',
    title: '집 가는날',
    description: '첫 번째 갤러리 이미지'
  },
  {
    image: 'https://picsum.photos/600/600?random=2',
    link: '/detail/2',
    title: '이미지 2',
    description: '두 번째 갤러리 이미지'
  },
  {
    image: 'https://picsum.photos/600/600?random=3',
    link: '/detail/3',
    title: '이미지 3',
    description: '세 번째 갤러리 이미지'
  },
  {
    image: 'https://picsum.photos/600/600?random=4',
    link: '/detail/4',
    title: '이미지 4',
    description: '네 번째 갤러리 이미지'
  },
  {
    image: 'https://picsum.photos/600/600?random=5',
    link: '/detail/5',
    title: '이미지 5',
    description: '다섯 번째 갤러리 이미지'
  },
  {
    image: 'https://picsum.photos/600/600?random=6',
    link: '/detail/6',
    title: '이미지 6',
    description: '여섯 번째 갤러리 이미지'
  }
];

export default function GalleryPage() {
  return (
    <div className="relative w-full h-screen overflow-hidden bg-white">
      <Header />
      
      <div className="absolute top-16 left-0 right-0 bottom-0">
        <InfiniteMenu items={galleryItems} />
      </div>
    </div>
  );
}
