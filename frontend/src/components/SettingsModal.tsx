'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// 이미지 매핑 (지도와 동일하게 사용)
const CATEGORY_IMAGES: { [key: string]: string } = {
  hospital: "/dog_pin.svg",         // 동물병원 - 강아지
  pharmacy: "/panda_pin.svg",       // 동물약국 - 판다
  care:     "/frog_pin.svg",        // 미용/케어 - 개구리
  shop:     "/rabbit_pin.svg",      // 용품점 - 토끼
  cafe:     "/cheetah_pin.svg",     // 카페/휴식 - 치타
  culture:  "/quokka_pin.svg",      // 문화/예술 - 쿼카
  funeral:  "/sheep_pin.svg",       // 장례식장 - 양
  poopbag:  "/duckraccoon_pin.svg", // 배변봉투함 - 오리너구리
};

export function mapCategoryToMain(categoryName: string, extraText: string = "") {
  const catStr = String(categoryName || "");
  const textStr = String(extraText || "");
  const combined = (catStr + " " + textStr).toLowerCase();

  if (catStr.includes("VeterinaryHospital")) return "hospital";
  if (catStr.includes("BeautySalon")) return "care";
  if (catStr.includes("Pharmacy") || catStr.includes("VeterinaryPharmacy")) return "pharmacy";
  if (catStr.includes("PetShop") || catStr.includes("Supplies")) return "shop";
  if (catStr.includes("PetCafe") || catStr.includes("Cafe")) return "cafe";
  if (catStr.includes("Funeral")) return "funeral";
  if (catStr.includes("Culture") || catStr.includes("Museum")) return "culture";
  if (catStr.includes("PoopBag")) return "poopbag";

  if (combined.includes("병원") || combined.includes("의료센터") || combined.includes("메디컬") || combined.includes("클리닉") || combined.includes("치과") || combined.includes("내과") || combined.includes("외과")) return "hospital";
  if (combined.includes("약국")) return "pharmacy";
  if (combined.includes("미용") || combined.includes("살롱") || combined.includes("헤어") || combined.includes("목욕") || combined.includes("스파") || combined.includes("그루밍")) return "care";
  if (combined.includes("용품") || combined.includes("사료") || combined.includes("간식") || combined.includes("마트") || combined.includes("store") || combined.includes("샵")) return "shop";
  if (combined.includes("카페") || combined.includes("커피") || combined.includes("cafe")) return "cafe";
  if (combined.includes("장례") || combined.includes("추모")) return "funeral";
  if (combined.includes("미술관") || combined.includes("박물관") || combined.includes("전시") || combined.includes("문화")) return "culture";
  if (combined.includes("배변봉투") || combined.includes("봉투함")) return "poopbag";

  return null;
}

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialDistrict?: string;
  initialCategories?: { [key: string]: boolean };
  onApply?: (filters: { district: string; categories: { [key: string]: boolean } }) => void;
}

export default function SettingsModal({ 
  isOpen, 
  onClose, 
  initialDistrict = "", 
  initialCategories, 
  onApply 
}: SettingsModalProps) {
  
  const seoulDistricts = [
    "강남구","강동구","강북구","강서구","관악구","광진구","구로구","금천구",
    "노원구","도봉구","동대문구","동작구","마포구","서대문구","서초구","성동구",
    "성북구","송파구","양천구","영등포구","용산구","은평구","종로구","중구","중랑구"
  ];

  const koreanLabels: { [key: string]: string } = {
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

  const [selectedDistrict, setSelectedDistrict] = useState(initialDistrict);
  
  const [categories, setCategories] = useState<{ [key: string]: boolean }>(
    initialCategories || Object.fromEntries(categoryKeys.map((key) => [key, false]))
  );

  useEffect(() => {
    if (isOpen) {
      if (initialDistrict) setSelectedDistrict(initialDistrict);
      if (initialCategories) setCategories(initialCategories);
    }
  }, [isOpen, initialDistrict, initialCategories]);

  const toggleCategory = (key: string) => {
    const newCategories = {
      ...categories,
      [key]: !categories[key],
    };
    setCategories(newCategories);
    if (onApply) {
      onApply({ district: selectedDistrict, categories: newCategories });
    }
  };

  const handleDistrictChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newDistrict = e.target.value;
    setSelectedDistrict(newDistrict);
    if (onApply) {
      onApply({ district: newDistrict, categories });
    }
  };

  const resetCategories = () => {
    const newCategories = Object.fromEntries(categoryKeys.map((key) => [key, false]));
    setCategories(newCategories);
    if (onApply) {
      onApply({ district: selectedDistrict, categories: newCategories });
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div 
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[20000]" 
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />

          <motion.div 
            className="fixed top-0 right-0 h-full w-[380px] bg-white rounded-l-2xl shadow-2xl z-[20001] p-6 flex flex-col overflow-y-auto"
            initial={{ x: 380 }}
            animate={{ x: 0 }}
            exit={{ x: 380 }}
            transition={{ type: "tween", duration: 0.25 }}
          >
            <h2 className="text-2xl font-semibold mb-5">설정</h2>

            <div className="mb-7">
              <h3 className="font-semibold text-black mb-1 text-lg">📍 위치 선택</h3>
              <label className="text-sm text-black block mb-1">서울시 구 선택</label>
              
              <div className={`border rounded-xl px-3 py-2 bg-white shadow-sm transition cursor-pointer ${selectedDistrict ? 'border-purple-500 shadow-md' : 'border-gray-300'}`}>
                <select 
                  className="w-full bg-transparent outline-none text-gray-800"
                  value={selectedDistrict}
                  onChange={handleDistrictChange}
                >
                  <option value="">구 선택</option>
                  {seoulDistricts.map((gu) => (
                    <option key={gu} value={gu}>{gu}</option>
                  ))}
                </select>
              </div>
              {selectedDistrict && (
                <p className="text-sm text-purple-600 mt-2 font-medium">선택됨: {selectedDistrict}</p>
              )}
            </div>

            <hr className="border-gray-300 opacity-50 mb-4" />

            <div className="mb-3 flex items-center justify-between">
              <h3 className="font-semibold text-lg flex items-center gap-1">🔍 분류 선택</h3>
              <button 
                onClick={resetCategories}
                className="text-sm text-purple-500 hover:text-purple-700 transition"
              >
                초기화
              </button>
            </div>

            <div className="flex flex-wrap gap-3 mb-6">
              {categoryKeys.map((key) => {
                const active = categories[key];
                const imageSrc = CATEGORY_IMAGES[key];

                return (
                  <button 
                    key={key} 
                    onClick={() => toggleCategory(key)}
                    className={`
                      px-4 py-2 rounded-full text-sm border transition flex items-center gap-2
                      ${active 
                        ? "bg-purple-500 text-white border-purple-500 shadow" 
                        : "bg-gray-100 text-gray-700 border-gray-300"
                      }
                    `}
                  >
                    {/* 📷 캐릭터 아이콘 표시 */}
                    {imageSrc && (
                        <img 
                            src={imageSrc} 
                            alt={koreanLabels[key]} 
                            className="w-5 h-7 object-contain" // 크기 조절
                        />
                    )}
                    {koreanLabels[key]}
                  </button>
                );
              })}
            </div>

            <button 
              onClick={onClose}
              className="mt-auto w-full py-3 rounded-xl bg-purple-500 text-white text-lg font-medium hover:bg-purple-600 transition"
            >
              닫기
            </button>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
