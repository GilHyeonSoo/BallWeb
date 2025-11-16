// src/components/GuTextSelector.tsx
import React from "react";

interface GuTextSelectorProps {
    selectedGu: string | null;
    setSelectedGu: (gu: string | null) => void;
    hoveredGu: string | null;
    setHoveredGu: (gu: string | null) => void;
}

const SEOUL_GUS = [
    "강남구", "강동구", "강북구", "강서구", "관악구", "광진구",
    "구로구", "금천구", "노원구", "도봉구", "동대문구", "동작구",
    "마포구", "서대문구", "서초구", "성동구", "성북구", "송파구",
    "양천구", "영등포구", "용산구", "은평구", "종로구", "중구", "중랑구"
];

export default function GuTextSelector({
    selectedGu,
    setSelectedGu,
    hoveredGu,
    setHoveredGu
}: GuTextSelectorProps) {

    return (
        <div>
            <h2 className="text-xl font-bold mb-4">서울시 구 선택</h2>

            {/* 전체 선택 */}
            <button
                onClick={() => setSelectedGu(null)}
                className={`w-full mb-4 p-3 rounded-xl font-medium border 
                  ${selectedGu === null ? "bg-blue-500 text-white" : "bg-gray-100 hover:bg-gray-200"}`}
            >
                전체 선택
            </button>

            {/* 구 리스트 (2열로 바꿈) */}
            <div className="grid grid-cols-2 gap-3">
                {SEOUL_GUS.map((gu) => (
                    <button
                        key={gu}
                        onClick={() => setSelectedGu(gu)}
                        onMouseEnter={() => setHoveredGu(gu)}
                        onMouseLeave={() => setHoveredGu(null)}
                        className={`
                            py-2 rounded-xl border text-sm font-medium
                            transition-all
                            ${selectedGu === gu
                                ? "bg-blue-500 text-white"
                                : hoveredGu === gu
                                    ? "bg-yellow-300"
                                    : "bg-gray-100"}
                        `}
                    >
                        {gu}
                    </button>
                ))}
            </div>
        </div>
    );
}
