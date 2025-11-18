import { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Minus } from 'lucide-react';

interface Message {
  id: number;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
}

export default function Chatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      text: '안녕하세요! 무엇을 도와드릴까요?',
      sender: 'bot',
      timestamp: new Date(),
    },
  ]);
  const [inputText, setInputText] = useState('');
  
  // 채팅창 드래그 관련 상태
  const [chatPosition, setChatPosition] = useState({ x: 24, y: window.innerHeight - 524 });
  const [targetPosition, setTargetPosition] = useState({ x: 24, y: window.innerHeight - 524 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const headerRef = useRef<HTMLDivElement>(null);
  const animationFrameRef = useRef<number>();

  const handleSendMessage = () => {
    if (!inputText.trim()) return;

    const userMessage: Message = {
      id: messages.length + 1,
      text: inputText,
      sender: 'user',
      timestamp: new Date(),
    };

    setMessages([...messages, userMessage]);
    setInputText('');

    setTimeout(() => {
      const botMessage: Message = {
        id: messages.length + 2,
        text: '메시지를 받았습니다. (LLM 기능은 곧 추가됩니다)',
        sender: 'bot',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, botMessage]);
    }, 500);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // 부드러운 애니메이션 (lerp)
  useEffect(() => {
    if (!isDragging) return;

    const animate = () => {
      setChatPosition(prev => {
        const lerpFactor = 0.2; // 0~1 사이 값 (낮을수록 더 부드럽고 느림)
        
        const newX = prev.x + (targetPosition.x - prev.x) * lerpFactor;
        const newY = prev.y + (targetPosition.y - prev.y) * lerpFactor;
        
        // 거의 도달했으면 정확한 위치로
        const distanceX = Math.abs(targetPosition.x - newX);
        const distanceY = Math.abs(targetPosition.y - newY);
        
        if (distanceX < 0.5 && distanceY < 0.5) {
          return targetPosition;
        }
        
        return { x: newX, y: newY };
      });
      
      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animationFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isDragging, targetPosition]);

  // 채팅창 열릴 때 초기 위치 설정
    useEffect(() => {
        if (isOpen) {
            const saved = localStorage.getItem('chatbot-chat-position');
            if (saved) {
            setChatPosition(JSON.parse(saved));
            setTargetPosition(JSON.parse(saved));
            } else {
            // 기본 위치: 오른쪽 벽에 딱 붙음
            const chatWidth = 340; // w-96 = 384px (또는 320 if w-80)
            const initialPos = {
                x: window.innerWidth - chatWidth,  // 오른쪽 벽에 딱 붙음 (여백 없음)
                y: 80,  // 상단에서 80px
            };
            setChatPosition(initialPos);
            setTargetPosition(initialPos);
            }
        }
        }, [isOpen]);

  // 채팅창 헤더 드래그 시작
  const handleHeaderMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    setDragStart({
      x: e.clientX - chatPosition.x,
      y: e.clientY - chatPosition.y,
    });
  };

  const handleHeaderTouchStart = (e: React.TouchEvent) => {
    e.preventDefault();
    const touch = e.touches[0];
    setIsDragging(true);
    setDragStart({
      x: touch.clientX - chatPosition.x,
      y: touch.clientY - chatPosition.y,
    });
  };

  // 드래그 중
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;

      const newX = e.clientX - dragStart.x;
      const newY = e.clientY - dragStart.y;

      const chatWidth = 340;
      const chatHeight = isMinimized ? 60 : 500;
      
      const maxX = window.innerWidth - chatWidth;
      const maxY = window.innerHeight - chatHeight;

      setTargetPosition({
        x: Math.max(0, Math.min(newX, maxX)),
        y: Math.max(0, Math.min(newY, maxY)),
      });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      // 드래그 종료 시 정확한 위치로 스냅
      setChatPosition(targetPosition);
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.userSelect = 'none';
    } else {
      document.body.style.userSelect = '';
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.userSelect = '';
    };
  }, [isDragging, dragStart, isMinimized, targetPosition]);

  // 터치 드래그
  useEffect(() => {
    const handleTouchMove = (e: TouchEvent) => {
      if (!isDragging) return;

      const touch = e.touches[0];
      const newX = touch.clientX - dragStart.x;
      const newY = touch.clientY - dragStart.y;

      const chatWidth = 340;
      const chatHeight = isMinimized ? 60 : 500;
      
      const maxX = window.innerWidth - chatWidth;
      const maxY = window.innerHeight - chatHeight;

      setTargetPosition({
        x: Math.max(0, Math.min(newX, maxX)),
        y: Math.max(0, Math.min(newY, maxY)),
      });
    };

    const handleTouchEnd = () => {
      setIsDragging(false);
      setChatPosition(targetPosition);
    };

    if (isDragging) {
      document.addEventListener('touchmove', handleTouchMove, { passive: false });
      document.addEventListener('touchend', handleTouchEnd);
    }

    return () => {
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isDragging, dragStart, isMinimized, targetPosition]);

  // 위치 저장
  useEffect(() => {
    if (isOpen && !isDragging) {
      localStorage.setItem('chatbot-chat-position', JSON.stringify(chatPosition));
    }
  }, [chatPosition, isOpen, isDragging]);

  // 창 크기 변경 시 위치 재조정
  useEffect(() => {
    const handleResize = () => {
      const chatWidth = 340;
      const chatHeight = isMinimized ? 60 : 500;
      
      const newPos = {
        x: Math.min(chatPosition.x, window.innerWidth - chatWidth),
        y: Math.min(chatPosition.y, window.innerHeight - chatHeight),
      };
      
      setChatPosition(newPos);
      setTargetPosition(newPos);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isMinimized, chatPosition]);

  return (
    <>
      {/* 챗봇 아이콘 - 왼쪽 하단 고정 */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed top-20 right-6 z-50 bg-blue-500 hover:bg-blue-600 text-white p-4 rounded-full shadow-2xl transition-all duration-300 hover:scale-110"
          aria-label="챗봇 열기"
        >
          <MessageCircle size={20} />
        </button>
      )}

      {/* 채팅창 - 드래그 가능 */}
      {isOpen && (
        <div 
          className="fixed z-50 bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden w-72 sm:w-80"
          style={{
            left: `${chatPosition.x}px`,
            top: `${chatPosition.y}px`,
            height: isMinimized ? '60px' : '500px',
            transition: isDragging ? 'none' : 'height 0.2s ease',
          }}
        >
          {/* 헤더 - 드래그 가능 */}
          <div 
            ref={headerRef}
            onMouseDown={handleHeaderMouseDown}
            onTouchStart={handleHeaderTouchStart}
            className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-4 py-3 flex justify-between items-center select-none active:cursor-grabbing"
            style={{ 
              cursor: isDragging ? 'grabbing' : 'grab',
              touchAction: 'none',
            }}
          >
            <div className="flex items-center gap-2 pointer-events-none">
              <MessageCircle size={20} />
              <h3 className="font-bold">Animalloo 챗봇</h3>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsMinimized(!isMinimized);
                }}
                className="hover:bg-white/20 p-1 rounded-full transition pointer-events-auto"
                aria-label={isMinimized ? "채팅창 펼치기" : "채팅창 최소화"}
              >
                <Minus size={20} />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsOpen(false);
                  setIsMinimized(false);
                }}
                className="hover:bg-white/20 p-1 rounded-full transition pointer-events-auto"
                aria-label="챗봇 닫기"
              >
                <X size={20} />
              </button>
            </div>
          </div>

          {/* 메시지 영역 */}
          {!isMinimized && (
            <>
              <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${
                      message.sender === 'user' ? 'justify-end' : 'justify-start'
                    }`}
                  >
                    <div
                      className={`max-w-[75%] px-4 py-2 rounded-2xl ${
                        message.sender === 'user'
                          ? 'bg-blue-500 text-white rounded-br-sm'
                          : 'bg-white text-gray-800 rounded-bl-sm shadow-sm border border-gray-200'
                      }`}
                    >
                      <p className="text-sm whitespace-pre-wrap break-words">
                        {message.text}
                      </p>
                      <p
                        className={`text-xs mt-1 ${
                          message.sender === 'user'
                            ? 'text-blue-100'
                            : 'text-gray-400'
                        }`}
                      >
                        {message.timestamp.toLocaleTimeString('ko-KR', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="p-3 bg-white border-t border-gray-200">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="메시지를 입력하세요..."
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <button
                    onClick={handleSendMessage}
                    className="bg-blue-500 hover:bg-blue-600 text-white p-2 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={!inputText.trim()}
                    aria-label="메시지 전송"
                  >
                    <Send size={20} />
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
}
