import google.generativeai as genai
import os
from dotenv import load_dotenv

load_dotenv()
api_key = os.getenv('GEMINI_API_KEY')
print(f"Checking with API Key: {api_key[:5]}...") # 키 앞 5자리만 출력 확인

genai.configure(api_key=api_key)

print("\n=== 사용 가능한 모델 목록 ===")
try:
    for m in genai.list_models():
        if 'generateContent' in m.supported_generation_methods:
            print(f"- {m.name}")
except Exception as e:
    print(f"에러 발생: {e}")