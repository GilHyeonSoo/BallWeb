import React, { useState, useRef, useEffect } from 'react';
import Header from '../components/Header';
import { Bot, User, Sparkles, ArrowUp } from 'lucide-react';

interface Message {
  id: number;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
}

export default function QuestionPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // 스크롤 자동 이동
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSendMessage = async (text: string) => {
    if (!text.trim()) return;

    // 1. 유저 메시지 화면에 즉시 추가
    const userMessage: Message = {
      id: Date.now(),
      text: text,
      sender: 'user',
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMessage]);
    setInputText('');
    setIsLoading(true); // 로딩 시작

    try {
      // 2. 백엔드 API 호출 (Gemini에게 질문)
      const response = await fetch('http://localhost:5001/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: text }),
      });

      const data = await response.json();

      if (response.ok) {
        // 3. 성공 시 봇 응답 추가
        const botMessage: Message = {
          id: Date.now() + 1,
          text: data.response, // 백엔드에서 준 답변
          sender: 'bot',
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, botMessage]);
      } else {
        // 실패 시 에러 메시지
        throw new Error(data.error || '오류가 발생했습니다.');
      }
    } catch (error) {
      console.error('Chat Error:', error);
      const errorMessage: Message = {
        id: Date.now() + 1,
        text: '죄송합니다. 오류가 발생하여 답변을 가져올 수 없습니다.',
        sender: 'bot',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false); // 로딩 종료
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(inputText);
    }
  };

  // 대화 여부에 따른 UI 상태 결정
  const isChatStarted = messages.length > 0;

  return (
    <div className="flex flex-col h-screen bg-white">
      {/* 1. 상단 헤더 */}
      <Header />

      {/* 2. 메인 컨텐츠 영역 */}
      <main className={`flex-1 flex flex-col w-full mx-auto relative transition-all duration-500 ${isChatStarted ? 'max-w-3xl' : 'max-w-4xl'}`}>
        
        {/* A. 대화 내용 표시 영역 (대화 시작 시에만 보임) */}
        {isChatStarted && (
          <div className="flex-1 overflow-y-auto px-4 py-6 custom-scrollbar pb-32">
             <div className="space-y-6">
              {messages.map((msg) => (
                <div key={msg.id} className={`flex gap-4 ${msg.sender === 'user' ? 'flex-row-reverse' : ''}`}>
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                    msg.sender === 'user' ? 'bg-gray-200' : 'bg-[#5227FF]'
                  }`}>
                    {msg.sender === 'user' ? <User size={20} className="text-gray-600" /> : <Bot size={20} className="text-white" />}
                  </div>
                  <div className={`flex flex-col max-w-[80%] ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}>
                    <div className={`px-5 py-3 rounded-2xl text-[15px] leading-relaxed shadow-sm ${
                      msg.sender === 'user' 
                        ? 'bg-gray-100 text-gray-800 rounded-tr-none' 
                        : 'bg-white border border-gray-100 text-gray-800 rounded-tl-none shadow-md'
                    }`}>
                      {msg.text.split('\n').map((line, i) => (
                        <p key={i} className="min-h-[1.2em]">{line}</p>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
              
              {isLoading && (
                <div className="flex gap-4">
                   <div className="w-10 h-10 rounded-full bg-[#5227FF] flex items-center justify-center flex-shrink-0">
                     <Bot size={20} className="text-white" />
                   </div>
                   <div className="bg-white border border-gray-100 px-5 py-4 rounded-2xl rounded-tl-none shadow-md flex items-center gap-1.5">
                     <span className="w-2 h-2 bg-[#B19EEF] rounded-full animate-bounce" style={{ animationDelay: '0s' }} />
                     <span className="w-2 h-2 bg-[#B19EEF] rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                     <span className="w-2 h-2 bg-[#B19EEF] rounded-full animate-bounce" style={{ animationDelay: '0.4s' }} />
                   </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          </div>
        )}

        {/* B. 초기 환영 메시지 & 입력창 컨테이너 */}
        {/* - 대화 시작 전: 화면 중앙(flex-col justify-center)에 위치
            - 대화 시작 후: 화면 하단(fixed bottom)으로 이동
        */}
        <div className={`transition-all duration-500 ease-in-out w-full
          ${!isChatStarted 
            ? 'flex-1 flex flex-col justify-center items-center px-4 -mt-20' // 초기: 중앙 정렬
            : 'fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-md p-4 border-t border-gray-100' // 대화중: 하단 고정
          }
        `}>
          
          <div className={`w-full mx-auto transition-all duration-500 ${isChatStarted ? 'max-w-3xl' : 'max-w-2xl text-center'}`}>
            
            {/* 초기 화면일 때만 보이는 환영 문구들 */}
            {!isChatStarted && (
              <div className="mb-8 space-y-6 animate-fade-in-up">
                <div className="w-16 h-16 bg-gradient-to-tr from-[#B19EEF] to-[#5227FF] rounded-2xl flex items-center justify-center shadow-lg mx-auto mb-6">
                  <Sparkles className="text-white w-8 h-8" />
                </div>
                {/* 요청하신 문구 배치: 검색바 바로 위 */}
                <h2 className="text-3xl md:text-4xl font-bold text-gray-900">무엇을 도와드릴까요?</h2>
              </div>
            )}

            {/* 검색바 (Input) */}
            <div className="relative w-full">
              <input
                ref={inputRef}
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={isChatStarted ? "메시지를 입력하세요..." : "궁금한 점을 물어보세요..."}
                className={`w-full pl-6 pr-14 bg-white border border-gray-200 text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#5227FF]/50 focus:border-[#5227FF] shadow-lg transition-all
                  ${isChatStarted ? 'py-4 rounded-full' : 'py-5 rounded-2xl text-lg'}
                `}
                disabled={isLoading}
              />
              <button
                onClick={() => handleSendMessage(inputText)}
                disabled={!inputText.trim() || isLoading}
                className={`absolute right-3 top-1/2 -translate-y-1/2 p-2.5 rounded-xl transition-all duration-200 
                  ${inputText.trim() && !isLoading
                    ? 'bg-[#5227FF] text-white hover:bg-[#4114cc] shadow-md'
                    : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  }`}
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <ArrowUp size={isChatStarted ? 20 : 24} strokeWidth={2.5} />
                )}
              </button>
            </div>

            {/* 초기 화면일 때 추천 질문 칩 */}
            {!isChatStarted && (
              <div className="mt-8 flex flex-wrap justify-center gap-3">
                {['무엇에 대해 질문할 수 있나요?', '우리 강아지 상태 좀 봐주세요', '정보들을 무조건 믿어도 되나요?'].map((q, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSendMessage(q)}
                    className="px-4 py-2 bg-gray-50 hover:bg-white border border-gray-200 hover:border-[#B19EEF] hover:shadow-md rounded-full text-sm text-gray-600 transition-all duration-200"
                  >
                    {q}
                  </button>
                ))}
              </div>
            )}
            
            {/* 하단 안내 문구 (대화 중에만 보임) */}
            {isChatStarted && (
               <p className="text-center text-xs text-gray-400 mt-3 hidden sm:block">
                Animalloo AI는 실수를 할 수 있습니다. 중요한 정보는 확인이 필요합니다.
              </p>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}