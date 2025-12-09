# 기존 한글 키워드에 영어 키워드(DOG, CAT)를 추가합니다.
ANIMAL_MAP = {
    # 기존 한글 정의
    "개": "http://www.wikidata.org/entity/Q144",
    "강아지": "http://www.wikidata.org/entity/Q144",
    "[개]": "http://www.wikidata.org/entity/Q144",
    
    # [추가] 영어 정의 (로그에 찍힌 그대로 대문자 입력)
    "DOG": "http://www.wikidata.org/entity/Q144",
    
    # 기존 한글 정의
    "고양이": "http://www.wikidata.org/entity/Q146",
    "[고양이]": "http://www.wikidata.org/entity/Q146",
    "길냥이": "http://www.wikidata.org/entity/Q146",

    # [추가] 영어 정의
    "CAT": "http://www.wikidata.org/entity/Q146"
}

GU_MAP = {
    "강남구": "wd:Q11201", # 예시 위키데이터 ID
    "노원구": "wd:Q12591",
    # ... 25개 구 매핑
}

def map_text_to_uri(text, map_dict):
    """텍스트에 키워드가 포함되어 있으면 URI 반환"""
    if not text: return None
    
    for key, uri in map_dict.items():
        # "개"가 "[개] 믹스견" 안에 포함되어 있으면 성공!
        if key in text: 
            return uri
    return None