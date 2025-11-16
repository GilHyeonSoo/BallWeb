import { X, MapPin, Phone, Clock } from 'lucide-react';
import { Facility } from '../lib/supabase';

interface FacilityModalProps {
  facility: Facility;
  onClose: () => void;
}

const categoryLabels: Record<string, string> = {
  hospital: '동물병원',
  pharmacy: '동물약국',
  grooming: '미용샵',
  culture_center: '문화센터',
  museum: '박물관',
  art_gallery: '미술관',
  travel: '여행지',
  care_service: '위탁관리',
  pension: '펜션',
  pet_supplies: '반려동물용품',
  restaurant: '음식점'
};

const FacilityModal = ({ facility, onClose }: FacilityModalProps) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-primary text-white p-6 flex justify-between items-start">
          <div>
            <h3 className="text-2xl font-bold mb-2">{facility.name}</h3>
            <span className="inline-block bg-blue-100 text-primary px-3 py-1 rounded-full text-sm font-medium">
              {categoryLabels[facility.category] || facility.category}
            </span>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:text-gray-200 transition-colors"
          >
            <X size={28} />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div className="flex items-start space-x-3">
            <MapPin className="text-primary mt-1 flex-shrink-0" size={20} />
            <div>
              <p className="font-semibold text-gray-700">주소</p>
              <p className="text-gray-600">{facility.address}</p>
              <p className="text-sm text-primary font-medium">{facility.district}</p>
            </div>
          </div>

          {facility.phone && (
            <div className="flex items-start space-x-3">
              <Phone className="text-primary mt-1 flex-shrink-0" size={20} />
              <div>
                <p className="font-semibold text-gray-700">전화번호</p>
                <a
                  href={`tel:${facility.phone}`}
                  className="text-primary hover:underline"
                >
                  {facility.phone}
                </a>
              </div>
            </div>
          )}

          {facility.opening_hours && (
            <div className="flex items-start space-x-3">
              <Clock className="text-primary mt-1 flex-shrink-0" size={20} />
              <div>
                <p className="font-semibold text-gray-700">운영시간</p>
                <p className="text-gray-600">{facility.opening_hours}</p>
              </div>
            </div>
          )}

          {facility.description && (
            <div className="border-t pt-4 mt-4">
              <p className="font-semibold text-gray-700 mb-2">시설 정보</p>
              <p className="text-gray-600 leading-relaxed">{facility.description}</p>
            </div>
          )}

          <div className="border-t pt-4 mt-4">
            <p className="text-xs text-gray-500">
              위도: {facility.latitude} / 경도: {facility.longitude}
            </p>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              onClick={() => window.open(`https://map.kakao.com/link/to/${facility.name},${facility.latitude},${facility.longitude}`, '_blank')}
              className="flex-1 bg-primary text-white py-3 rounded-lg hover:bg-primary-dark transition-colors font-medium"
            >
              길찾기
            </button>
            <button
              onClick={onClose}
              className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg hover:bg-gray-300 transition-colors font-medium"
            >
              닫기
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FacilityModal;