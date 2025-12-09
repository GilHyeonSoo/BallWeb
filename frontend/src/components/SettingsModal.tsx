'use client';

import { motion, AnimatePresence } from 'framer-motion';

export default function SettingsModal({ isOpen, onClose }) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* 🔥 배경 오버레이 */}
          <motion.div
            className="fixed inset-0 bg-black/30 z-[20000]"  // ⬅⬅⬅ z-index 올림
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />

          {/* 🔥 오른쪽 패널 */}
          <motion.div
            className="
              fixed top-0 right-0 h-full w-[320px]
              bg-white shadow-xl z-[20001]   // ⬅⬅⬅ 팝업도 매우 높게 설정
              p-6 flex flex-col
            "
            initial={{ x: 320 }}
            animate={{ x: 0 }}
            exit={{ x: 320 }}
            transition={{ type: 'tween', duration: 0.25 }}
          >
            <h2 className="text-xl font-semibold mb-4">설정</h2>

            <p className="text-gray-600 mb-4">여기에 설정 옵션을 넣으세요!</p>

            <button
              onClick={onClose}
              className="mt-auto bg-gray-100 px-3 py-2 rounded-lg border"
            >
              닫기
            </button>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
