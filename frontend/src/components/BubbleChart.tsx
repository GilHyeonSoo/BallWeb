import React, { useMemo } from 'react';

interface BubbleChartProps {
  data: { name: string; count: number }[];
  guName: string;
  x: number;
  y: number;
}

export default function BubbleChart({ data, guName, x, y }: BubbleChartProps) {
  if (!data || data.length === 0) return null;

  const displayData = data.slice(0, 8); // 최대 8개
  const maxCount = Math.max(...displayData.map((d) => d.count));

  // 거미줄 좌표 계산
  const items = useMemo(() => {
    return displayData.map((item, index) => {
      const count = displayData.length;
      // 360도를 균등하게 분할 (시작 각도를 -90도로 해서 12시 방향부터 시작)
      const angle = (index / count) * 360 - 90; 
      const radian = (angle * Math.PI) / 180;
      
      // [중요] 반지름을 충분히 크게 줍니다 (120px ~ 180px)
      // 데이터가 많을수록 더 멀리 퍼지게 조정
      const radius = 140 + (item.count / maxCount) * 20; 

      // 중심(0,0) 기준 상대 좌표
      const itemX = Math.cos(radian) * radius;
      const itemY = Math.sin(radian) * radius;

      // 버블 크기 (40px ~ 80px)
      const size = 40 + (item.count / maxCount) * 40;

      return { ...item, x: itemX, y: itemY, size, color: getColor(index) };
    });
  }, [displayData, maxCount]);

  return (
    // [중요] 부모 컨테이너: width/height를 0으로 하고 overflow를 풀어줍니다.
    // 이렇게 하면 (x, y) 좌표가 정확한 '중심점'이 됩니다.
    <div 
      className="fixed pointer-events-none z-50"
      style={{ 
        left: x, 
        top: y,
        width: 0,
        height: 0,
        overflow: 'visible' // 중요: 자식 요소가 밖으로 튀어나와도 보이게 함
      }}
    >
      {/* 1. 거미줄 라인 (SVG) */}
      {/* SVG도 중심을 (0,0)으로 맞추기 위해 overflow visible 설정 */}
      <svg className="absolute overflow-visible" style={{ left: 0, top: 0 }}>
        {items.map((item, i) => (
          <line
            key={`line-${i}`}
            x1={0} y1={0}         // 중심
            x2={item.x} y2={item.y} // 버블 중심
            stroke={item.color}
            strokeWidth="2"
            strokeDasharray="4 3" // 점선
            className="opacity-60"
          />
        ))}
      </svg>

      {/* 2. 중앙 메인 원 (구 이름) */}
      <div 
        className="absolute flex items-center justify-center bg-white rounded-full shadow-xl border-4 border-purple-500 z-20"
        style={{
            width: '80px',
            height: '80px',
            left: '-40px', // width의 절반만큼 이동하여 정중앙 맞춤
            top: '-40px',  // height의 절반만큼 이동
        }}
      >
        <span className="text-sm font-bold text-gray-800 text-center leading-tight">
          애견이름<br/>TOP 8
        </span>
      </div>

      {/* 3. 데이터 버블들 */}
      {items.map((item, i) => (
        <div
          key={i}
          className="absolute flex flex-col items-center justify-center rounded-full shadow-lg border-2 border-white z-10 animate-pop-in"
          style={{
            width: item.size,
            height: item.size,
            backgroundColor: item.color,
            // [핵심] translate 대신 left/top으로 명확하게 위치 지정
            // 중심점(item.x)에서 버블 크기의 절반만큼 빼줘서 정중앙 정렬
            left: `${item.x - item.size / 2}px`,
            top: `${item.y - item.size / 2}px`,
          }}
        >
          <span className="text-xs font-bold text-gray-800 truncate px-1 max-w-full">
            {item.name}
          </span>
          <span className="text-[10px] text-gray-600 font-medium">
            {item.count}
          </span>
        </div>
      ))}
    </div>
  );
}

function getColor(index: number) {
  const colors = ['#FFD1DC', '#E2F0CB', '#C7CEEA', '#FFDAC1', '#E0BBE4', '#957DAD', '#D291BC', '#FEC8D8'];
  return colors[index % colors.length];
}