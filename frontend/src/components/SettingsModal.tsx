'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// CSV 카테고리 → 상위 카테고리 자동 매핑 함수
export function mapCategoryToMain(categoryName) {
  const mapping = {
    hospital: ["24시 동물병원", "일반 동물병원", "치과"],
    pharmacy: ["동물약국", "일반 약국 (동물약 취급)"],
    care: ["헤어/미용실", "목욕/스파"],
    shop: ["사료/간식", "종합 용품점"],
    cafe: ["애견카페", "동반 가능 카페"],
    culture: ["박물관", "미술관", "문화회관"],
    funeral: ["반려동물 장례식장"],
    poopbag: ["배변봉투함"]
  };

  for (const key in mapping) {
    if (mapping[key].includes(categoryName)) return key;
  }
  return null;
}

export default function SettingsModal({ isOpen, onClose }) {
  const seoulDistricts = [
    "강남구","강동구","강북구","강서구","관악구","광진구","구로구","금천구",
    "노원구","도봉구","동대문구","동작구","마포구","서대문구","서초구","성동구",
    "성북구","송파구","양천구","영등포구","용산구","은평구","종로구","중구","중랑구"
  ];

  const koreanLabels = {
    hospital: "동물병원",
    pharmacy: "동물약국",
    care: "미용/케어",
    shop: "용품점",
    cafe: "카페/휴식",
    culture: "문화/예술",
    funeral: "장례식장",
    poopbag: "배변봉투함"
  };

  const categoryKeys = Object.keys(koreanLabels);

  const [selectedDistrict, setSelectedDistrict] = useState("");
  const [categories, setCategories] = useState(
    Object.fromEntries(categoryKeys.map((key) => [key, false]))
  );

  const toggleCategory = (key) => {
    setCategories((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const resetCategories = () => {
    setCategories(Object.fromEntries(categoryKeys.map((key) => [key, false])));
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* 흐린 배경 */}
          <motion.div
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[20000]"
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />

          {/* 패널 */}
          <motion.div
            className="
              fixed top-0 right-0 h-full w-[380px] 
              bg-white rounded-l-2xl shadow-2xl z-[20001]
              p-6 flex flex-col overflow-y-auto
            "
            initial={{ x: 380 }}
            animate={{ x: 0 }}
            exit={{ x: 380 }}
            transition={{ type: "tween", duration: 0.25 }}
          >
            {/* 헤더 */}
            <h2 className="text-2xl font-semibold mb-5">설정</h2>

            {/* ---------------------------
                📍 위치 선택
            ---------------------------- */}
            <div className="mb-7">
              <h3 className="font-semibold text-black mb-1 text-lg">📍 위치 선택</h3>

              <label className="text-sm text-black block mb-1">
                서울시 구 선택
              </label>

              <div
                className={`
                  border rounded-xl px-3 py-2 bg-white 
                  shadow-sm transition cursor-pointer
                  ${
                    selectedDistrict
                      ? "border-purple-500 shadow-md"
                      : "border-gray-300"
                  }
                `}
              >
                <select
                  className="w-full bg-transparent outline-none text-gray-800"
                  value={selectedDistrict}
                  onChange={(e) => setSelectedDistrict(e.target.value)}
                >
                  <option value="">구 선택</option>
                  {seoulDistricts.map((gu) => (
                    <option key={gu} value={gu}>
                      {gu}
                    </option>
                  ))}
                </select>
              </div>

              {selectedDistrict && (
                <p className="text-sm text-purple-600 mt-2 font-medium">
                  선택됨: {selectedDistrict}
                </p>
              )}
            </div>

            {/* 🔸 구분선 */}
            <hr className="border-gray-300 opacity-50 mb-4" />

            {/* ---------------------------
                🔍 분류 선택 + 초기화 버튼
            ---------------------------- */}
            <div className="mb-3 flex items-center justify-between">
              <h3 className="font-semibold text-lg flex items-center gap-1">
                🔍 분류 선택
              </h3>

              <button
                onClick={resetCategories}
                className="text-sm text-purple-500 hover:text-purple-700 transition"
              >
                초기화
              </button>
            </div>

            {/* Chip 버튼 영역 */}
            <div className="flex flex-wrap gap-3 mb-6">
              {categoryKeys.map((key) => {
                const active = categories[key];

                return (
                  <button
                    key={key}
                    onClick={() => toggleCategory(key)}
                    className={`
                      px-4 py-2 rounded-full text-sm border transition 
                      ${
                        active
                          ? "bg-purple-500 text-white border-purple-500 shadow"
                          : "bg-gray-100 text-gray-700 border-gray-300"
                      }
                    `}
                  >
                    {koreanLabels[key]}
                  </button>
                );
              })}
            </div>

            {/* ---------------------------
                닫기 버튼 (연보라 스타일)
            ---------------------------- */}
            <button
              onClick={onClose}
              className="
                mt-auto w-full py-3 rounded-xl 
                bg-purple-500 text-white text-lg font-medium
                hover:bg-purple-600 transition
              "
            >
              닫기
            </button>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
