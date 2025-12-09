from flask import Flask, request, jsonify 
from flask_cors import CORS
from dotenv import load_dotenv
import os
import time
from datetime import timedelta
import google.generativeai as genai
import requests
from sparql_client import KnowledgeGraph 
from utils import ANIMAL_MAP, map_text_to_uri
from SPARQLWrapper import SPARQLWrapper, JSON 
import logging

load_dotenv()

GEMINI_API_KEY = os.getenv('GEMINI_API_KEY')
if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)

SPARQL_ENDPOINT = "http://localhost:7200/repositories/knowledgemap" 
sparql = SPARQLWrapper(SPARQL_ENDPOINT)

app = Flask(__name__)
CORS(app, resources={
    r"/api/*": {
        "origins": ["http://localhost:5173"],
        "methods": ["GET", "POST", "OPTIONS"],
        "allow_headers": ["Content-Type"]
    }
})
log = logging.getLogger('werkzeug')
log.setLevel(logging.ERROR)

# ========== API 라우트 ==========
def get_graphdb_context(keyword):
    """
    GraphDB를 검색하고, 어떤 파일(출처)에서 데이터를 가져왔는지 로그를 남깁니다.
    """
    print(f"\n🕵️ [GraphDB] '{keyword}' 관련 지식 탐색 시작 (순환 점검 중)...")
    
    query = f"""
    SELECT ?s ?p ?o
    WHERE {{
        ?s ?p ?o .
        FILTER regex(str(?o), "{keyword}")
    }}
    LIMIT 50
    """
    
    sparql.setQuery(query)
    sparql.setReturnFormat(JSON)
    
    try:
        results = sparql.query().convert()
        
        context_text = ""
        seen_uris = set()
        
        # 📊 [디버그용] 출처별 데이터 개수 카운터
        source_tracker = {
            "File_A (증상 목록)": 0,
            "File_B (질병 백과)": 0,
            "File_C (메타 데이터)": 0
        }

        for r in results["results"]["bindings"]:
            uri = r['s']['value']
            # 오타 수정
            uri = uri.replace("knowlefgemap", "knowledgemap")
            content = r['o']['value'].strip()
            
            if uri not in seen_uris:
                # --- [순환 점검 로직] URI 패턴으로 출처 파악 ---
                if "/medical/condition/" in uri:
                    source_tracker["File_A (증상 목록)"] += 1
                elif "/koah/disease/" in uri:
                    source_tracker["File_B (질병 백과)"] += 1
                elif "/koah/" in uri: # disease 없이 숫자만 있는 경우
                    source_tracker["File_C (메타 데이터)"] += 1
                # ---------------------------------------------

                clean_content = content.replace("\n", " ").replace("#", "")
                context_text += f"- {clean_content}\n"
                seen_uris.add(uri)
        
        # 📢 [디버그 출력] 터미널에 순환 결과 보고
        print("-" * 50)
        print(f"📊 [순환 학습 증거 확보] '{keyword}' 검색 결과 출처 분석:")
        print(f"   📂 A파일 (증상코드): {source_tracker['File_A (증상 목록)']}개 참조함")
        print(f"   📂 B파일 (질병설명): {source_tracker['File_B (질병 백과)']}개 참조함")
        print(f"   📂 C파일 (태그정보): {source_tracker['File_C (메타 데이터)']}개 참조함")
        
        total_found = sum(source_tracker.values())
        if total_found > 0:
            print(f"✅ 총 {total_found}개의 데이터를 여러 파일에서 성공적으로 융합했습니다.")
        else:
            print("⚠️ 검색된 데이터가 없습니다.")
        print("-" * 50)

        return context_text

    except Exception as e:
        print(f"❌ [GraphDB] 오류 발생: {e}")
        return ""


# ========== API 라우트 ==========
@app.route('/api/chat', methods=['POST'])
def chat():
    api_key = os.getenv('GEMINI_API_KEY')
    if not api_key:
        return jsonify({'error': 'API Key Error'}), 500

    try:
        data = request.get_json()
        user_message = data.get('message')
        if not user_message:
            return jsonify({'error': '메시지가 없습니다.'}), 400

        # [1] 키워드 추출
        db_context = ""
        search_keyword = ""
        
        # 간단 키워드 매칭 (확장 가능)
        if "구토" in user_message: search_keyword = "구토"
        elif "설사" in user_message: search_keyword = "설사"
        elif "기침" in user_message: search_keyword = "기침"
            
        # [2] GraphDB 검색 (위의 수정된 함수 호출)
        if search_keyword:
            db_context = get_graphdb_context(search_keyword)

        # [3] 프롬프트 구성
        base_prompt = """
        너는 유기동물 보호 및 입양 플랫폼 '애니멀루(Animalloo)'의 친절한 AI 챗봇이야.
        
        [지시사항]
        1. 아래 제공된 [수의학 데이터베이스 정보]를 바탕으로 답변해.
        2. 너의 환각 증세를 0%로 만들어야해 절대 너는 [수의학 데이터베이스 정보] 외 다른 곳에서 정보를 가져오면 안돼.
        3. 만약 [수의학 데이터베이스 정보]에서 정보가 없으면 임의로 답변하지말고 솔직하게 데이터가 없다고 답변해.
        4. 친근한 말투(해요체)와 이모지를 사용해.
        5. 의학적 진단은 피하고, 병원 방문을 권유해.
        """
        
        context_section = ""
        if db_context:
            context_section = f"""
            \n[수의학 데이터베이스 정보]
            {db_context}
            """
        
        full_message = f"{base_prompt}{context_section}\n\n사용자 질문: {user_message}"

        # [4] Gemini 호출
        genai.configure(api_key=api_key)
        model = genai.GenerativeModel('gemini-2.5-flash') 
        
        response = model.generate_content(full_message)

        if not response.text:
            return jsonify({'error': '응답이 없습니다.'}), 500
        
        return jsonify({'response': response.text}), 200

    except Exception as e:
        print(f"에러 발생: {e}")
        return jsonify({'error': str(e)}), 500
    
kg = KnowledgeGraph()
@app.route('/api/animals', methods=['GET'])
def get_animals():
    # 1. 서울시 API 호출 (기존 코드 유지)
    SEOUL_API_KEY = os.getenv('SEOUL_API_KEY', 'sample') 
    SERVICE_NAME = 'vPetInfo' 
    start_index = request.args.get('start', 1)
    end_index = request.args.get('end', 50)
    
    url = f"http://openapi.seoul.go.kr:8088/{SEOUL_API_KEY}/json/{SERVICE_NAME}/{start_index}/{end_index}/"
    
    try:
        response = requests.get(url)
        data = response.json()
        
        if SERVICE_NAME in data:
            rows = data[SERVICE_NAME]['row']
            
            # 2. [Data Enrichment] 각 데이터에 지식 그래프 정보 추가
            enriched_data = []
            
            # 성능을 위해 한 번 조회한 URI 정보는 캐싱(임시 저장)하는 것이 좋습니다.
            uri_cache = {} 
            
            for item in rows:
                # [수정] 올바른 필드명(ANIMAL_TYPE) 사용
                # 예: "[개] 믹스견" 또는 "개" 등의 값이 들어올 것으로 예상됩니다.
                kind_text = item.get('ANIMAL_TYPE', '') 
                
                # (혹시 ANIMAL_TYPE이 비어있으면 ANIMAL_BREED도 확인하도록 보완)
                if not kind_text:
                    kind_text = item.get('ANIMAL_BREED', '')


                # 매핑 시도
                animal_uri = map_text_to_uri(kind_text, ANIMAL_MAP)

                enrichment_info = {
                    "medical_risks": []
                }

                if animal_uri:
                    if animal_uri not in uri_cache:
                        
                        medical_data = kg.get_medical_info_by_animal(animal_uri)
                        
                        risk_list = []
                        for binding in medical_data:
                            # 1. 질병 이름 안전하게 가져오기
                            d_name = binding.get('diseaseName', {}).get('value', '알 수 없는 질병')
                            
                            # 2. 증상 이름 안전하게 가져오기 (증상도 없을 수 있으니 대비)
                            s_name = binding.get('symptomName', {}).get('value', '')
                            
                            if s_name:
                                risk_list.append(f"{d_name} ({s_name})")
                            else:
                                risk_list.append(d_name)
                        
                        uri_cache[animal_uri] = risk_list
                        uri_cache[animal_uri] = risk_list
                    
                    enrichment_info["medical_risks"] = uri_cache[animal_uri]

                # 2-3. 원본 데이터에 지식 정보 병합
                item['knowledge_graph'] = enrichment_info
                enriched_data.append(item)

            # 3. 풍성해진(Enriched) 데이터 반환
            return jsonify({
                "list_total_count": data[SERVICE_NAME].get('list_total_count', len(enriched_data)),
                "row": enriched_data
            }), 200
            
        elif 'RESULT' in data:
             # ... (에러 처리 코드 유지) ...
             pass
             
    except Exception as e:
        print(f"Error: {e}")
        return jsonify({'error': str(e)}), 500
    
@app.route('/api/stats/pet-names', methods=['GET'])
def get_pet_names():
    gu_name = request.args.get('gu')
    if not gu_name:
        return jsonify({'error': '구 이름이 필요합니다.'}), 400

    try:
        # SPARQL로 통계 조회
        results = kg.get_pet_names_by_gu(gu_name)
        
        # 프론트엔드에서 쓰기 편하게 포맷팅
        stats = []
        for item in results:
            stats.append({
                "name": item['name']['value'],
                "count": int(item['count']['value'])
            })
            
        return jsonify(stats), 200

    except Exception as e:
        print(f"통계 조회 에러: {e}")
        return jsonify({'error': str(e)}), 500
    
if __name__ == '__main__':
    app.run(debug=True, port=5001)
