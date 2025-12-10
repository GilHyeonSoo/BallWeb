import os
from dotenv import load_dotenv
from flask import Flask, request, jsonify 
from flask_cors import CORS
import time
from datetime import timedelta
import google.generativeai as genai
import requests
from sparql_client import KnowledgeGraph 
from utils import ANIMAL_MAP, map_text_to_uri
from SPARQLWrapper import SPARQLWrapper, JSON 
import logging
from graphdb_api import graphdb_bp

load_dotenv()

GEMINI_API_KEY = os.getenv('GEMINI_API_KEY')
if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)

app = Flask(__name__)
SPARQL_ENDPOINT = "http://localhost:7200/repositories/knowledgemap" 
sparql = SPARQLWrapper(SPARQL_ENDPOINT)
app.register_blueprint(graphdb_bp)
GRAPHDB_URL = "http://localhost:7200/repositories/knowledgemap" 
CORS(app, resources={
    r"/api/*": {
        "origins": ["http://localhost:5173"],
        "methods": ["GET", "POST", "OPTIONS"],
        "allow_headers": ["Content-Type"]
    }
})
log = logging.getLogger('werkzeug')
log.setLevel(logging.ERROR)

@app.route('/api/facilities', methods=['GET'])
def get_facilities_by_gu():
    gu_name = request.args.get('gu')
    if not gu_name:
        return jsonify({"error": "No gu provided"}), 400

    print(f"[DEBUG] 시설 목록 조회 요청: {gu_name}")

    try:
        local_sparql = SPARQLWrapper(GRAPHDB_URL)
        local_sparql.setReturnFormat(JSON)

        query = f"""
        SELECT ?s ?name ?lat ?lng ?category ?address
        WHERE {{
            ?s ?pName ?name .
            FILTER(STRENDS(STR(?pName), "name"))

            ?s ?pLat ?lat .
            FILTER(STRENDS(STR(?pLat), "lat") || STRENDS(STR(?pLat), "latitude"))

            ?s ?pLng ?lng .
            FILTER(STRENDS(STR(?pLng), "lng") || STRENDS(STR(?pLng), "longitude"))
            
            ?s ?pAddress ?address .
            FILTER(STRENDS(STR(?pAddress), "address") || STRENDS(STR(?pAddress), "streetAddress"))
            FILTER(CONTAINS(?address, "{gu_name}"))

            OPTIONAL {{
                ?s ?pCat ?category .
                FILTER(STRENDS(STR(?pCat), "category") || STRENDS(STR(?pCat), "type"))
            }}
        }}
        """

        local_sparql.setQuery(query)
        results = local_sparql.query().convert()

        facilities = []
        for r in results["results"]["bindings"]:
            # [수정] 카테고리 값이 URI일 경우 뒷부분만 추출 (예: http://.../동물병원 -> 동물병원)
            raw_cat = r.get("category", {}).get("value", "기타")
            category_label = raw_cat
            if "http" in raw_cat:
                category_label = raw_cat.split('/')[-1].split('#')[-1]
            
            facilities.append({
                "id": r["s"]["value"],
                "name": r["name"]["value"],
                "lat": float(r["lat"]["value"]),
                "lng": float(r["lng"]["value"]),
                "category": category_label, # 정제된 카테고리 사용
                "address": r["address"]["value"]
            })

        print(f"[DEBUG] {len(facilities)}개 시설 발견 ({gu_name})")
        return jsonify(facilities), 200

    except Exception as e:
        print(f"[ERROR] 시설 목록 조회 실패: {e}")
        return jsonify({"error": str(e)}), 500


@app.route('/api/facility/detail', methods=['GET'])
def get_facility_detail():
    facility_id = request.args.get('id')
    if not facility_id: return jsonify({"error": "No id provided"}), 400

    clean_id = facility_id.strip().strip('<').strip('>')
    print(f"[DEBUG] 조회 ID: {clean_id}")

    try:
        sparql = SPARQLWrapper(GRAPHDB_URL)
        sparql.setReturnFormat(JSON)

        # -------------------------------------------------------
        # [Step 1] 기본 정보 조회 (시간 정보 제외)
        # -------------------------------------------------------
        query_basic = f"SELECT ?p ?o WHERE {{ <{clean_id}> ?p ?o . }}"
        sparql.setQuery(query_basic)
        results_basic = sparql.query().convert()

        data = {}
        for result in results_basic["results"]["bindings"]:
            pred_uri = result["p"]["value"]
            val = result["o"]["value"]
            key = pred_uri.split('#')[-1].split('/')[-1]
            
            # 시간 관련 키는 무시 (덮어쓰기 방지)
            if key in ['opens', 'closes', 'dayOfWeek', 'hours', 'facility']:
                continue
            data[key] = val

        # -------------------------------------------------------
        # [Step 2] 운영 시간 조회
        # -------------------------------------------------------
        # 가장 단순하게 접근: "요일 정보가 있는 모든 행을 달라"
        # 단, RDF 구조상 짝이 안 맞을 수 있으므로 최대한 긁어옵니다.
        query_hours = f"""
        SELECT ?day ?open ?close
        WHERE {{
            # Case 1: 시설 자체가 속성을 가진 경우
            {{
                <{clean_id}> ?pDay ?day .
                FILTER (STRENDS(STR(?pDay), "dayOfWeek"))
                
                OPTIONAL {{ 
                    <{clean_id}> ?pOpen ?open .
                    FILTER (STRENDS(STR(?pOpen), "opens"))
                }}
                OPTIONAL {{ 
                    <{clean_id}> ?pClose ?close .
                    FILTER (STRENDS(STR(?pClose), "closes"))
                }}
            }}
            UNION
            # Case 2: 별도 노드로 연결된 경우
            {{
                ?hoursNode ?pFac <{clean_id}> .
                ?hoursNode ?pDay ?day .
                FILTER (STRENDS(STR(?pDay), "dayOfWeek"))
                
                OPTIONAL {{ 
                    ?hoursNode ?pOpen ?open .
                    FILTER (STRENDS(STR(?pOpen), "opens"))
                }}
                OPTIONAL {{ 
                    ?hoursNode ?pClose ?close .
                    FILTER (STRENDS(STR(?pClose), "closes"))
                }}
            }}
        }}
        """
        
        sparql.setQuery(query_hours)
        results_hours = sparql.query().convert()
        
        hours_list = []
        day_order = { 
            "Monday":1, "Tuesday":2, "Wednesday":3, "Thursday":4, "Friday":5, "Saturday":6, "Sunday":7,
            "Mon":1, "Tue":2, "Wed":3, "Thu":4, "Fri":5, "Sat":6, "Sun":7 
        }

        bindings = results_hours["results"]["bindings"]
        
        for res in bindings:
            day_full = res["day"]["value"]
            day = day_full.split('/')[-1] if '/' in day_full else day_full
            
            open_time = res.get("open", {}).get("value", "")[:5]
            close_time = res.get("close", {}).get("value", "")[:5]
            
            time_str = f"{open_time} ~ {close_time}" if open_time else "시간 정보 없음"
            
            hours_list.append({
                "order": day_order.get(day, 99),
                "text": f"{day}: {time_str}"
            })

        if hours_list:
            # 요일 순 정렬
            hours_list.sort(key=lambda x: x["order"])
            
            # 중복 텍스트 제거 (단순 문자열 비교)
            # RDF 쿼리 특성상 동일한 내용이 중복될 수 있으므로 제거
            unique_text_list = []
            seen = set()
            for h in hours_list:
                if h["text"] not in seen:
                    unique_text_list.append(h["text"])
                    seen.add(h["text"])
            
            data['hours'] = "\n".join(unique_text_list)
            print(f"[DEBUG] 운영 시간 {len(unique_text_list)}줄 조회 성공")
        else:
            print("[DEBUG] 운영 시간 데이터 없음")

        return jsonify(data), 200

    except Exception as e:
        print(f"[ERROR] {e}")
        return jsonify({"error": str(e)}), 500
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
        5. 대답은 6줄 이내로 핵심만 요약해서 적어줘.
        6. 의학적 진단은 피하고, 병원 방문을 권유해.
        7. 마지막에 너가 [수의학 데이터베이스 정보]에서 어떤 데이터 베이스를 참조해왔는지 꼭 말해줘
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
    
    
#====검색엔진======
@app.route('/api/search', methods=['GET'])
def search_graphdb():
    """
    링크드 데이터 기반 통합 검색 (복합 조건 지원)
    예: "강남 동물병원" → 강남구 + 동물병원 카테고리 동시 필터링
    """
    keyword = request.args.get('q', '').strip()
    
    if not keyword:
        return jsonify({"error": "검색어가 필요합니다."}), 400
    
    print(f"\n🔍 [링크드 데이터 검색] '{keyword}' 검색 시작...")
    
    # 구 이름 → Wikidata URI 매핑
    gu_map = {
        "용산구": "http://www.wikidata.org/entity/Q50429",
        "강서구": "http://www.wikidata.org/entity/Q50192",
        "관악구": "http://www.wikidata.org/entity/Q50353",
        "금천구": "http://www.wikidata.org/entity/Q50359",
        "중랑구": "http://www.wikidata.org/entity/Q50444",
        "구로구": "http://www.wikidata.org/entity/Q50356",
        "마포구": "http://www.wikidata.org/entity/Q50388",
        "양천구": "http://www.wikidata.org/entity/Q50420",
        "강남구": "http://www.wikidata.org/entity/Q20398",
        "강남": "http://www.wikidata.org/entity/Q20398", 
        "성북구": "http://www.wikidata.org/entity/Q50412",
        "강북구": "http://www.wikidata.org/entity/Q50349",
        "성동구": "http://www.wikidata.org/entity/Q50411",
        "은평구": "http://www.wikidata.org/entity/Q50432",
        "서초구": "http://www.wikidata.org/entity/Q20395",
        "서초": "http://www.wikidata.org/entity/Q20395", 
        "송파구": "http://www.wikidata.org/entity/Q50415",
        "송파": "http://www.wikidata.org/entity/Q50415", 
        "중구": "http://www.wikidata.org/entity/Q50441",
        "노원구": "http://www.wikidata.org/entity/Q50368",
        "도봉구": "http://www.wikidata.org/entity/Q50374",
        "강동구": "http://www.wikidata.org/entity/Q50348",
        "서대문구": "http://www.wikidata.org/entity/Q50408",
        "광진구": "http://www.wikidata.org/entity/Q50355",
        "영등포구": "http://www.wikidata.org/entity/Q50190",
        "종로구": "http://www.wikidata.org/entity/Q36929",
        "동작구": "http://www.wikidata.org/entity/Q50385",
        "동대문구": "http://www.wikidata.org/entity/Q50382",
    }
    
    # 카테고리 맵핑 (기존과 동일)
    category_map = {
        "공원": "koah:DogPark", "애견공원": "koah:DogPark", "반려견공원": "koah:DogPark", "반려동물공원": "koah:DogPark", "도그파크": "koah:DogPark", "강아지공원": "koah:DogPark", "펫파크": "koah:DogPark",
        "배변봉투": "koah:DogWasteBagDispenser", "배변봉지": "koah:DogWasteBagDispenser", "똥봉투": "koah:DogWasteBagDispenser", "똥봉지": "koah:DogWasteBagDispenser", "배설물봉투": "koah:DogWasteBagDispenser", "애견배변봉투": "koah:DogWasteBagDispenser", "반려견배변봉투": "koah:DogWasteBagDispenser",
        "미술관": "koah:ArtMuseum", "아트뮤지엄": "koah:ArtMuseum", "예술관": "koah:ArtMuseum", "갤러리": "koah:ArtMuseum", "전시관": "koah:ArtMuseum",
        "미용": "koah:BeautySalon", "애견미용": "koah:BeautySalon", "반려견미용": "koah:BeautySalon", "반려동물미용": "koah:BeautySalon", "펫미용": "koah:BeautySalon", "강아지미용": "koah:BeautySalon", "애견미용실": "koah:BeautySalon", "펫살롱": "koah:BeautySalon", "그루밍": "koah:BeautySalon", "펫그루밍": "koah:BeautySalon", "애견샵": "koah:BeautySalon",
        "카페": "koah:Cafe", "애견카페": "koah:Cafe", "반려견카페": "koah:Cafe", "반려동물카페": "koah:Cafe", "펫카페": "koah:Cafe", "강아지카페": "koah:Cafe", "도그카페": "koah:Cafe", "커피숍": "koah:Cafe",
        "문화센터": "koah:CulturalCenter", "문화관": "koah:CulturalCenter", "컬처센터": "koah:CulturalCenter", "커뮤니티센터": "koah:CulturalCenter", "주민센터": "koah:CulturalCenter",
        "장례식장": "koah:FuneralServicesIndustry", "장례장": "koah:FuneralServicesIndustry", "장례시설": "koah:FuneralServicesIndustry", "펫장례": "koah:FuneralServicesIndustry", "반려동물장례": "koah:FuneralServicesIndustry", "애견장례": "koah:FuneralServicesIndustry", "반려동물장례식장": "koah:FuneralServicesIndustry", "펫장례식장": "koah:FuneralServicesIndustry", "추모": "koah:FuneralServicesIndustry", "화장": "koah:FuneralServicesIndustry",
        "호텔": "koah:Hotel", "펫호텔": "koah:Hotel", "애견호텔": "koah:Hotel", "반려견호텔": "koah:Hotel", "반려동물호텔": "koah:Hotel", "강아지호텔": "koah:Hotel", "도그호텔": "koah:Hotel", "펫리조트": "koah:Hotel", "애견리조트": "koah:Hotel", "위탁": "koah:Hotel", "애견위탁": "koah:Hotel", "반려견위탁": "koah:Hotel",
        "식당": "koah:KoreanRestaurant", "음식점": "koah:KoreanRestaurant", "맛집": "koah:KoreanRestaurant", "한식당": "koah:KoreanRestaurant", "레스토랑": "koah:KoreanRestaurant", "애견식당": "koah:KoreanRestaurant", "반려견식당": "koah:KoreanRestaurant", "펫식당": "koah:KoreanRestaurant", "강아지식당": "koah:KoreanRestaurant", "반려동물식당": "koah:KoreanRestaurant",
        "박물관": "koah:MuseumBuilding", "뮤지엄": "koah:MuseumBuilding", "전시관": "koah:MuseumBuilding", "기념관": "koah:MuseumBuilding",
        "펜션": "koah:Pension", "펫펜션": "koah:Pension", "애견펜션": "koah:Pension", "반려견펜션": "koah:Pension", "반려동물펜션": "koah:Pension", "강아지펜션": "koah:Pension", "별장": "koah:Pension", "애견동반펜션": "koah:Pension", "반려견동반펜션": "koah:Pension",
        "약국": "koah:Pharmacy", "동물약국": "koah:Pharmacy", "애견약국": "koah:Pharmacy", "반려동물약국": "koah:Pharmacy", "펫약국": "koah:Pharmacy", "수의약국": "koah:Pharmacy",
        "놀이터": "koah:Playground", "애견놀이터": "koah:Playground", "반려견놀이터": "koah:Playground", "반려동물놀이터": "koah:Playground", "강아지놀이터": "koah:Playground", "도그런": "koah:Playground", "운동장": "koah:Playground", "애견운동장": "koah:Playground", "반려견운동장": "koah:Playground",
        "용품샵": "koah:Shop", "샵": "koah:Shop", "용품점": "koah:Shop", "애견용품": "koah:Shop", "반려동물용품": "koah:Shop", "펫샵": "koah:Shop", "펫용품": "koah:Shop", "강아지용품": "koah:Shop", "반려견용품": "koah:Shop", "애완용품": "koah:Shop", "동물용품": "koah:Shop", "사료": "koah:Shop", "간식": "koah:Shop",
        "여행지": "koah:Travel", "관광지": "koah:Travel", "여행": "koah:Travel", "관광": "koah:Travel", "펫여행": "koah:Travel", "애견여행": "koah:Travel", "반려견여행": "koah:Travel", "반려동물여행": "koah:Travel", "애견동반여행": "koah:Travel", "반려견동반여행": "koah:Travel", "펫투어": "koah:Travel", "애견관광": "koah:Travel",
        "배변쓰레기함": "koah:WasteContainer", "쓰레기통": "koah:WasteContainer", "휴지통": "koah:WasteContainer", "배변쓰레기통": "koah:WasteContainer", "똥쓰레기통": "koah:WasteContainer", "똥휴지통": "koah:WasteContainer", "애견쓰레기통": "koah:WasteContainer", "반려견쓰레기통": "koah:WasteContainer", "배변통": "koah:WasteContainer",
    }
    
    # 키워드 매칭 로직
    matched_gu = None
    matched_gu_uri = None
    matched_category = None
    matched_category_uri = None
    
    for gu_name, gu_uri in gu_map.items():
        if gu_name in keyword:
            matched_gu = gu_name
            matched_gu_uri = gu_uri
            break
            
    for cat_keyword, cat_uri in category_map.items():
        if cat_keyword in keyword:
            matched_category = cat_keyword
            matched_category_uri = cat_uri
            break
            
    # ============================================================
    # SPARQL 쿼리 구성
    # ============================================================
    
    # [케이스 1] 구 + 카테고리 둘 다 있음 (복합 조건)
    if matched_gu_uri and matched_category_uri:
        print(f"   🔗🔗 [복합 링크드 데이터 검색] {matched_gu} + {matched_category}")
        
        query = f"""
        PREFIX koah: <https://knowledgemap.kr/koah/def/>
        PREFIX koad: <http://vocab.datahub.kr/def/administrative-division/>
        PREFIX schema: <http://schema.org/>
        PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
        
        SELECT DISTINCT ?subject ?label ?type ?address ?tel ?description ?category
        WHERE {{
            ?subject a koah:AnimalFacility ;
                     rdfs:label ?label ;
                     koad:Gu <{matched_gu_uri}> ;
                     koah:category {matched_category_uri} ;  # 👈 [중요] 여기 세미콜론(;)으로 수정됨
                     koah:category ?actualCategory .
            
            OPTIONAL {{ ?subject schema:streetAddress ?address . }}
            OPTIONAL {{ ?subject schema:telephone ?tel . }}
            OPTIONAL {{ ?subject schema:description ?description . }}
            
            BIND("{matched_category_uri}" AS ?type)
            BIND("복합조건(위치+카테고리)" AS ?category)
        }}
        LIMIT 100
        """
    
    # [케이스 2] 카테고리만 있음
    elif matched_category_uri:
        print(f"   🔗 [카테고리 검색] {matched_category}")
        
        query = f"""
        PREFIX koah: <https://knowledgemap.kr/koah/def/>
        PREFIX koad: <http://vocab.datahub.kr/def/administrative-division/>
        PREFIX schema: <http://schema.org/>
        PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
        
        SELECT DISTINCT ?subject ?label ?type ?address ?tel ?description ?category
        WHERE {{
            ?subject a koah:AnimalFacility ;
                     rdfs:label ?label ;
                     koah:category {matched_category_uri} .
            
            OPTIONAL {{ ?subject schema:streetAddress ?address . }}
            OPTIONAL {{ ?subject schema:telephone ?tel . }}
            OPTIONAL {{ ?subject schema:description ?description . }}
            
            BIND("{matched_category_uri}" AS ?type)
            BIND("카테고리기반" AS ?category)
        }}
        LIMIT 100
        """
    
    # [케이스 3] 구 이름만 있음
    elif matched_gu_uri:
        print(f"   🔗 [지역 검색] {matched_gu}")
        
        query = f"""
        PREFIX koah: <https://knowledgemap.kr/koah/def/>
        PREFIX koad: <http://vocab.datahub.kr/def/administrative-division/>
        PREFIX schema: <http://schema.org/>
        PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
        
        SELECT DISTINCT ?subject ?label ?type ?address ?tel ?description ?category
        WHERE {{
            ?subject a koah:AnimalFacility ;
                     rdfs:label ?label ;
                     koad:Gu <{matched_gu_uri}> .
            
            OPTIONAL {{ ?subject schema:streetAddress ?address . }}
            OPTIONAL {{ ?subject schema:telephone ?tel . }}
            OPTIONAL {{ ?subject schema:description ?description . }}
            
            BIND("AnimalFacility" AS ?type)
            BIND("위치기반" AS ?category)
        }}
        LIMIT 100
        """
    
    # [케이스 4] 일반 키워드 검색
    else:
        # 안전한 검색을 위해 키워드 이스케이프 처리
        safe_keyword = keyword.replace('"', '').replace("'", "")
        
        query = f"""
        PREFIX koah: <https://knowledgemap.kr/koah/def/>
        PREFIX koad: <http://vocab.datahub.kr/def/administrative-division/>
        PREFIX schema: <http://schema.org/>
        PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
        
        SELECT DISTINCT ?subject ?label ?type ?address ?tel ?description ?category
        WHERE {{
            {{
                ?subject a koah:AnimalFacility ;
                         rdfs:label ?label .
                OPTIONAL {{ ?subject schema:streetAddress ?address . }}
                OPTIONAL {{ ?subject schema:telephone ?tel . }}
                OPTIONAL {{ ?subject schema:description ?description . }}
                BIND("직접매칭" AS ?category)
                FILTER(CONTAINS(LCASE(?label), LCASE("{safe_keyword}")))
            }}
            UNION
            {{
                ?subject a koah:AnimalFacility ;
                         rdfs:label ?label ;
                         schema:streetAddress ?address .
                OPTIONAL {{ ?subject schema:telephone ?tel . }}
                BIND("주소기반" AS ?category)
                FILTER(CONTAINS(LCASE(?address), LCASE("{safe_keyword}")))
            }}
        }}
        LIMIT 100
        """
    
    try:
        sparql.setQuery(query)
        sparql.setReturnFormat(JSON)
        results = sparql.query().convert()
        
        search_results = []
        seen_uris = set()
        
        for binding in results["results"]["bindings"]:
            uri = binding.get("subject", {}).get("value", "")
            if uri in seen_uris: continue
            seen_uris.add(uri)
            
            label = binding.get("label", {}).get("value", "이름 없음")
            type_val = binding.get("type", {}).get("value", "")
            address = binding.get("address", {}).get("value", "")
            tel = binding.get("tel", {}).get("value", "")
            description = binding.get("description", {}).get("value", "")
            category = binding.get("category", {}).get("value", "기타")
            
            if type_val.startswith("koah:"):
                type_val = type_val.replace("koah:", "")
                
            search_results.append({
                "uri": uri,
                "label": label,
                "type": type_val,
                "description": description or address,
                "category": category,
                "address": address,
                "tel": tel,
                # 지도 이동을 위해 좌표가 필요하지만 SPARQL 결과에 없다면 
                # 프론트엔드의 Geocoder가 처리하도록 둠 (address 필수)
            })
            
        print(f"✅ [검색 완료] {len(search_results)}건 발견")
        return jsonify({
            "results": search_results,
            "total": len(search_results),
            "linkedData": bool(matched_category or matched_gu)
        }), 200
        
    except Exception as e:
        print(f"❌ [검색 오류] {e}")
        # 구체적인 에러 메시지를 보기 위해 출력
        print(f"❌ 실패한 쿼리:\n{query}")
        return jsonify({"error": str(e)}), 500




if __name__ == '__main__':
    app.run(debug=True, port=5001)