import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import Header from "../components/Header";
import Ballpit from "../components/Ballpit";

const ANIMAL_THEME_COLORS = [
  '#FFC1CC', '#FFD700', '#8B4513', '#90EE90',
  '#87CEEB', '#FFB6C1', '#98D8C8'
];

export default function MyPage() {
  const navigate = useNavigate();
  const { token, logout, isLoggedIn } = useAuth();
  
  const [username, setUsername] = useState<string>("");
  const [nickname, setNickname] = useState<string>("");
  const [profilePic, setProfilePic] = useState<string>("https://cdn-icons-png.flaticon.com/512/1077/1077012.png");
  
  const [passwordStep, setPasswordStep] = useState<'none' | 'current' | 'new'>('none');
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserInfo = async () => {
      if (!isLoggedIn || !token) {
        navigate("/");
        return;
      }

      try {
        setLoading(true);
        
        const response = await fetch("http://localhost:5001/api/profile", {
          headers: { "Authorization": `Bearer ${token}` },
        });

        if (!response.ok) throw new Error("인증 실패");

        const data = await response.json();
        setUsername(data.username);
        setNickname(data.nickname || data.username);
        setProfilePic(data.profile_url || "https://cdn-icons-png.flaticon.com/512/1077/1077012.png");

      } catch (error) {
        console.error("사용자 정보 로드 실패:", error);
        logout();
        navigate("/");
      } finally {
        setLoading(false);
      }
    };

    fetchUserInfo();
  }, [token, isLoggedIn, navigate]); // ✅ 수정

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !token) {
      alert('파일을 선택해주세요.');
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch("http://localhost:5001/api/profile/upload", {
        method: "POST",
        headers: { 
          "Authorization": `Bearer ${token}`
        },
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || '업로드 실패');
      }

      setProfilePic(data.profile_url);
      alert("프로필 사진이 변경되었습니다!");
    } catch (error: any) {
      alert("업로드 실패: " + error.message);
    }
  };

  const handleNicknameChange = async () => {
    if (!nickname.trim()) return alert("닉네임을 입력해주세요.");
    
    try {
      const response = await fetch("http://localhost:5001/api/profile/nickname", {
        method: "PUT",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ nickname }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      
      alert("닉네임이 변경되었습니다!");
    } catch (error: any) {
      alert("닉네임 변경 실패: " + error.message);
    }
  };

  const handlePasswordChangeStart = () => {
    setPasswordStep('current');
    setCurrentPassword("");
    setNewPassword("");
  };

  const handleCurrentPasswordSubmit = async () => {
    if (!currentPassword.trim()) {
      return alert("기존 비밀번호를 입력해주세요.");
    }

    try {
      const response = await fetch("http://localhost:5001/api/profile/verify-password", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ password: currentPassword }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || '비밀번호가 일치하지 않습니다.');
      }

      setPasswordStep('new');
    } catch (error: any) {
      alert(error.message);
    }
  };

  const handleNewPasswordSubmit = async () => {
    if (newPassword.length < 6) {
      return alert("새 비밀번호는 최소 6자 이상이어야 합니다.");
    }

    try {
      const response = await fetch("http://localhost:5001/api/profile/password", {
        method: "PUT",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ 
          current_password: currentPassword,
          new_password: newPassword 
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      
      alert("비밀번호가 변경되었습니다!");
      
      setPasswordStep('none');
      setCurrentPassword("");
      setNewPassword("");
    } catch (error: any) {
      alert("비밀번호 변경 실패: " + error.message);
    }
  };

  const handlePasswordChangeCancel = () => {
    setPasswordStep('none');
    setCurrentPassword("");
    setNewPassword("");
  };

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  if (loading) {
    return (
      <div className="relative w-full h-screen overflow-hidden flex items-center justify-center">
        <div className="absolute inset-0">
          <Ballpit count={50} gravity={0} friction={0.9965} wallBounce={0.95} followCursor={false} colors={ANIMAL_THEME_COLORS} />
        </div>
        <div className="relative z-10 text-2xl font-bold text-black">
          로딩 중...
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full min-h-screen overflow-hidden">
      <div className="fixed inset-0 w-full h-full">
        <Ballpit count={50} gravity={0} friction={0.9965} wallBounce={0.95} followCursor={false} colors={ANIMAL_THEME_COLORS} />
      </div>

      <div className="relative z-10">
        <Header />
      </div>

      <div className="relative z-10 flex justify-center items-start py-12 px-4">
        <div className="bg-white/10 backdrop-blur-lg shadow-2xl rounded-2xl p-8 w-full max-w-md border border-black/20">

          <div className="flex flex-col items-center mb-8">
            <div className="relative">
              <img
                src={profilePic}
                alt="프로필"
                className="w-40 h-40 rounded-full border-4 border-black/20 object-cover shadow-lg"
              />
              <label className="absolute bottom-0 right-0 bg-black/20 backdrop-blur-sm text-black rounded-full p-2 cursor-pointer hover:bg-black/30 transition border border-black/30">
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageUpload}
                />
                📷
              </label>
            </div>
            <p className="mt-4 text-2xl font-bold text-black drop-shadow-lg">
              {nickname}
            </p>
            <p className="text-gray-800 text-sm">@{username}</p>
          </div>

          <div className="mt-6 border-t border-black/10 pt-6">
            <h3 className="text-lg font-bold text-black mb-3 drop-shadow">
              닉네임 변경
            </h3>
            <div className="space-y-3">
              <input
                type="text"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                placeholder="새 닉네임 입력"
                className="w-full bg-white/20 border border-black/30 rounded-lg p-3 text-black placeholder-gray-600 focus:ring-2 focus:ring-black/50 outline-none backdrop-blur-sm"
              />
              <button
                onClick={handleNicknameChange}
                className="w-full bg-black/20 hover:bg-black/30 text-black font-semibold py-3 rounded-lg transition border border-black/30 backdrop-blur-sm"
              >
                닉네임 변경
              </button>
            </div>
          </div>

          <div className="mt-6 border-t border-black/10 pt-6">
            <h3 className="text-lg font-bold text-black mb-3 drop-shadow">
              비밀번호 변경
            </h3>

            {passwordStep === 'none' && (
              <button
                onClick={handlePasswordChangeStart}
                className="w-full bg-black/20 hover:bg-black/30 text-black font-semibold py-3 rounded-lg transition border border-black/30 backdrop-blur-sm"
              >
                비밀번호 변경
              </button>
            )}

            {passwordStep === 'current' && (
              <div className="space-y-3">
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="기존 비밀번호 입력"
                  className="w-full bg-white/20 border border-black/30 rounded-lg p-3 text-black placeholder-gray-600 focus:ring-2 focus:ring-black/50 outline-none backdrop-blur-sm"
                  autoFocus
                />
                <div className="flex gap-2">
                  <button
                    onClick={handleCurrentPasswordSubmit}
                    className="flex-1 bg-black/20 hover:bg-black/30 text-black font-semibold py-3 rounded-lg transition border border-black/30 backdrop-blur-sm"
                  >
                    확인
                  </button>
                  <button
                    onClick={handlePasswordChangeCancel}
                    className="flex-1 bg-black/10 hover:bg-black/20 text-black font-semibold py-3 rounded-lg transition border border-black/20"
                  >
                    취소
                  </button>
                </div>
              </div>
            )}

            {passwordStep === 'new' && (
              <div className="space-y-3">
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="새 비밀번호 입력 (6자 이상)"
                  className="w-full bg-white/20 border border-black/30 rounded-lg p-3 text-black placeholder-gray-600 focus:ring-2 focus:ring-black/50 outline-none backdrop-blur-sm"
                  autoFocus
                />
                <div className="flex gap-2">
                  <button
                    onClick={handleNewPasswordSubmit}
                    className="flex-1 bg-black/20 hover:bg-black/30 text-black font-semibold py-3 rounded-lg transition border border-black/30 backdrop-blur-sm"
                  >
                    변경
                  </button>
                  <button
                    onClick={handlePasswordChangeCancel}
                    className="flex-1 bg-black/10 hover:bg-black/20 text-black font-semibold py-3 rounded-lg transition border border-black/20"
                  >
                    취소
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
