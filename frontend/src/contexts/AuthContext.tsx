// frontend/src/contexts/AuthContext.tsx

import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';

// 1. Context에 저장할 값들의 타입(모양) 정의
interface AuthContextType {
  token: string | null; // 로그인 토큰 (JWT)
  isLoggedIn: boolean; // 로그인 여부 (true/false)
  login: (token: string) => void; // 로그인 처리 함수
  logout: () => void; // 로그아웃 처리 함수
}

// 2. Context 생성 (기본값은 undefined, 타입은 AuthContextType | undefined)
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// 3. Context를 제공할 'AuthProvider' 컴포넌트 생성
interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  // ⬇️ 타입을 명시: string | null
  const [token, setToken] = useState<string | null>(null);

  // 앱이 처음 로드될 때, 로컬 스토리지에 저장된 토큰이 있는지 확인
  useEffect(() => {
    const storedToken = localStorage.getItem('authToken');
    if (storedToken) {
      setToken(storedToken);
    }
  }, []);

  // 로그인 함수
  const login = (newToken: string) => {
    setToken(newToken);
    localStorage.setItem('authToken', newToken); // 토큰을 로컬 스토리지에 저장
  };

  // 로그아웃 함수
  const logout = () => {
    setToken(null);
    localStorage.removeItem('authToken'); // 로컬 스토리지에서 토큰 제거
  };

  // Context가 제공할 값들을 구성
  const value: AuthContextType = {
    token,
    isLoggedIn: !!token, // 토큰이 있으면 true, 없으면 false
    login,
    logout,
  };

  // children(자식 컴포넌트들)에게 위 'value'를 제공
  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// 4. 다른 컴포넌트에서 Context를 쉽게 사용하도록 도와주는 커스텀 훅
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth는 AuthProvider 안에서만 사용해야 합니다.');
  }
  return context;
};
