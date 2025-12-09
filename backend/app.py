from flask import Flask, request, jsonify 
from flask_cors import CORS
from dotenv import load_dotenv
import os
import time
from datetime import timedelta
import google.generativeai as genai

load_dotenv()

GEMINI_API_KEY = os.getenv('GEMINI_API_KEY')
if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)

app = Flask(__name__)
CORS(app, resources={
    r"/api/*": {
        "origins": ["http://localhost:5173"],
        "methods": ["GET", "POST", "OPTIONS"],
        "allow_headers": ["Content-Type"]
    }
})

# ========== API 라우트 ==========
@app.route('/api/chat', methods=['POST'])
def chat():
    # ... (기존 API 키 확인 코드 등은 그대로 유지) ...
    api_key = os.getenv('GEMINI_API_KEY')
    if not api_key:
        return jsonify({'error': 'API Key Error'}), 500

    try:
        data = request.get_json()
        user_message = data.get('message')
        if not user_message:
            return jsonify({'error': '메시지가 없습니다.'}), 400

        # ▼▼▼ [수정] 프롬프트 설정 부분 시작 ▼▼▼
        
        # 1. AI에게 부여할 역할(페르소나) 정의
        system_prompt = """
        너는 유기동물 보호 및 입양 플랫폼 '애니멀루(Animalloo)'의 친절한 AI 챗봇이야.
        너의 역할과 대화 규칙은 다음과 같아:

        1. [말투] 친근하고 다정하게 존댓말을 써줘. (해요체 사용)
        2. [표현] 강아지(🐶), 고양이(🐱), 하트(💖) 등 이모지를 적절히 섞어서 대답해줘.
        3. [전문성] 유기동물 입양, 반려동물 상식, 보호소 위치 등에 대해 아는 대로 친절히 설명해줘.
        4. [한계] 만약 의학적이거나 전문적인 판단이 필요한 질문(질병 진단 등)이라면, "정확한 진단은 수의사 선생님께 상담받아보시는 게 좋아요"라고 안내해줘.
        5. [길이] 답변은 너무 길지 않게, 핵심을 잘 전달해줘.
        """

        # 2. 실제 AI에게 보낼 메시지 조합 (프롬프트 + 유저 질문)
        full_message = f"{system_prompt}\n\n사용자 질문: {user_message}"

        # 3. 모델 설정 (사용하시던 모델명 유지: gemini-1.5-flash 또는 gemini-pro)
        genai.configure(api_key=api_key)
        model = genai.GenerativeModel('gemini-2.5-flash') 
        
        # 4. 조합된 메시지로 요청
        response = model.generate_content(full_message)
        
        # ▲▲▲ [수정] 프롬프트 설정 부분 끝 ▲▲▲

        if not response.text:
            return jsonify({'error': '응답이 없습니다.'}), 500

        return jsonify({'response': response.text}), 200

    except Exception as e:
        print(f"에러 발생: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/animals', methods=['GET'])
def get_animals():
    # 1. 서울시 API 키 가져오기
    # .env 파일에 'SEOUL_API_KEY'가 없으면 'sample'을 씁니다.
    SEOUL_API_KEY = os.getenv('SEOUL_API_KEY', 'sample') 
    
    # 2. 서비스명 (틀리면 400 에러 남)
    SERVICE_NAME = 'vPetInfo' 

    start_index = request.args.get('start', 1)
    end_index = request.args.get('end', 50)

    # URL 생성
    url = f"http://openapi.seoul.go.kr:8088/{SEOUL_API_KEY}/json/{SERVICE_NAME}/{start_index}/{end_index}/"
    
    # [디버깅] 요청하는 URL이 맞는지 터미널에 출력
    print(f"서울시 요청 URL: {url}") 

    try:
        response = requests.get(url)
        data = response.json()
        
        # [성공] 데이터가 정상적으로 있는 경우
        if SERVICE_NAME in data:
            print(f"데이터 {len(data[SERVICE_NAME]['row'])}개 가져오기 성공!")
            return jsonify(data[SERVICE_NAME]), 200
            
        # [실패] 서울시에서 에러 메시지를 보낸 경우 (여기가 400 원인!)
        elif 'RESULT' in data:
            error_code = data['RESULT']['CODE']
            error_msg = data['RESULT']['MESSAGE']
            print(f"❌ 서울시 API 에러 ({error_code}): {error_msg}") # 터미널 확인용
            return jsonify({'error': f"서울시 응답: {error_msg}"}), 400
            
        else:
            return jsonify({'error': '데이터를 찾을 수 없습니다.'}), 404

    except Exception as e:
        print(f"서버 내부 에러: {e}")
        return jsonify({'error': '서울시 서버와 통신 중 오류가 발생했습니다.'}), 500
    
if __name__ == '__main__':
    app.run(debug=True, port=5001)
