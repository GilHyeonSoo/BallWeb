from SPARQLWrapper import SPARQLWrapper, JSON

# GraphDB 설정 (로컬 실행 기준)
# 저장소 이름이 'animalloo-repo'가 아니라면 본인 설정에 맞게 수정하세요.
GRAPHDB_URL = "http://localhost:7200/repositories/knowledgemap"

class KnowledgeGraph:
    def __init__(self):
        # 1. [중요] SPARQLWrapper 객체 생성 (이 줄이 없어서 에러가 난 것입니다!)
        self.sparql = SPARQLWrapper(GRAPHDB_URL)
        
        # 2. 결과 포맷 설정
        self.sparql.setReturnFormat(JSON)
        
        # 3. Prefix 설정 (http + knowledgemap.kr)
        self.prefixes = """
        PREFIX koah: <http://knowledgemap.kr/koah/def/>
        PREFIX koad: <http://vocab.datahub.kr/def/administrative-division/>
        PREFIX skos: <http://www.w3.org/2004/02/skos/core#>
        PREFIX schema: <http://schema.org/>
        PREFIX wd: <http://www.wikidata.org/entity/>
        PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
        """

    def query(self, query_body):
        """SPARQL 쿼리 실행 및 결과 파싱"""
        full_query = self.prefixes + query_body
        self.sparql.setQuery(full_query)
        
        try:
            results = self.sparql.query().convert()
            return results["results"]["bindings"]
        except Exception as e:
            print(f"GraphDB Query Error: {e}")
            return []

    def get_medical_info_by_animal(self, animal_uri):
        """동물 URI와 연관된 질병 조회 (여러 종류의 이름표를 다 찾아보도록 수정)"""
        query_body = f"""
        SELECT ?diseaseName ?symptomName WHERE {{
            # 1. 동물과 연결된 질병 찾기
            ?diseaseURI koah:animal <{animal_uri}> .

            # 2. 증상 연결 (있으면 가져오고 없으면 말고)
            OPTIONAL {{ 
                ?diseaseURI skos:broader ?symptomURI .
                ?symptomURI rdfs:label ?symptomName .
            }}
            
            # 3. [핵심 수정] 질병 이름 찾기 (COALESCE로 여러 후보를 순서대로 확인)
            OPTIONAL {{ ?diseaseURI rdfs:label ?label1 }}
            OPTIONAL {{ ?diseaseURI skos:prefLabel ?label2 }}
            OPTIONAL {{ ?diseaseURI schema:name ?label3 }}
            OPTIONAL {{ ?diseaseURI <http://knowledgemap.kr/koah/def/name> ?label4 }}
            
            # 위 후보들 중 가장 먼저 발견된 것을 ?diseaseName으로 사용
            BIND(COALESCE(?label1, ?label2, ?label3, ?label4, "이름 없음") AS ?diseaseName)
        }}
        LIMIT 10
        """
        return self.query(query_body)

    def get_facility_by_gu(self, gu_code):
        """구 코드(예: wd:Q...)에 있는 반려동물 시설 조회"""
        query_body = f"""
        SELECT ?facilityName ?type WHERE {{
            ?facilityURI koad:Gu {gu_code} ;
                         rdfs:label ?facilityName ;
                         koah:facilityType ?type .
        }}
        LIMIT 3
        """
        return self.query(query_body)
    
    def get_pet_names_by_gu(self, gu_name):
        """
        특정 구(예: '송파구')의 펫 이름 통계를 조회합니다.
        데이터 구조: koah:PetNameStatistic 사용, rdfs:label(이름), rdf:value(개수)
        """
        query_body = f"""
        SELECT ?name ?count WHERE {{
            # 1. 펫 이름 통계 데이터(?s)를 찾습니다.
            ?s a koah:PetNameStatistic ;
               rdfs:label ?name ;
               rdf:value ?count .
            
            # 2. 입력받은 '구 이름'(예: 송파구)이 주소(URI)에 포함된 것만 필터링합니다.
            # 예: <http://knowledgemap.kr/koah/stat/송파구/코코>
            FILTER(REGEX(STR(?s), "/stat/{gu_name}/", "i"))
            
            # (옵션) 숫자가 문자열로 인식될 수 있으므로 정렬을 위해 캐스팅 할 수도 있으나,
            # 보통 ORDER BY DESC(?count) 하면 자동 처리됩니다.
        }}
        ORDER BY DESC(xsd:integer(?count))
        LIMIT 10
        """
        return self.query(query_body)