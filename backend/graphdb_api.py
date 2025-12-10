from flask import Blueprint, request, jsonify
import requests

graphdb_bp = Blueprint("graphdb", __name__)

GRAPHDB_ENDPOINT = "http://localhost:7200/repositories/knowledgemap"

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
    "성북구": "http://www.wikidata.org/entity/Q50412",
    "강북구": "http://www.wikidata.org/entity/Q50349",
    "성동구": "http://www.wikidata.org/entity/Q50411",
    "은평구": "http://www.wikidata.org/entity/Q50432",
    "서초구": "http://www.wikidata.org/entity/Q20395",
    "송파구": "http://www.wikidata.org/entity/Q50415",
    "중구":  "http://www.wikidata.org/entity/Q50441",
    "노원구": "http://www.wikidata.org/entity/Q50368",
    "도봉구": "http://www.wikidata.org/entity/Q50374",
    "강동구": "http://www.wikidata.org/entity/Q50348",
    "서대문구": "http://www.wikidata.org/entity/Q50408",
    "광진구": "http://www.wikidata.org/entity/Q50355",
    "영등포구": "http://www.wikidata.org/entity/Q50190",
    "종로구": "http://www.wikidata.org/entity/Q36929",
    "동작구": "http://www.wikidata.org/entity/Q50385",
    "동대문구": "http://www.wikidata.org/entity/Q50382",
    "대구": "http://www.wikidata.org/entity/Q50370",
    "서구": "http://www.wikidata.org/entity/Q50407",
}

@graphdb_bp.route("/api/facilities")
def get_facilities():
    gu = request.args.get("gu")

    if not gu or gu not in gu_map:
        return jsonify([]), 200

    gu_uri = gu_map[gu]

    query = f"""
    PREFIX schema: <http://schema.org/>
    PREFIX koad: <http://vocab.datahub.kr/def/administrative-division/>
    PREFIX koah: <https://knowledgemap.kr/koah/def/>
    PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>

    SELECT ?facility ?name ?address ?tel ?lat ?long ?desc
    WHERE {{
        ?facility a koah:AnimalFacility ;
                  rdfs:label ?name ;
                  schema:streetAddress ?address ;
                  schema:telephone ?tel ;
                  schema:latitude ?lat ;
                  schema:longitude ?long ;
                  schema:description ?desc ;
                  koad:Gu <{gu_uri}> .
    }}
    """

    res = requests.get(
        GRAPHDB_ENDPOINT,
        params={"query": query},
        headers={"Accept": "application/sparql-results+json"}
    )

    data = res.json()

    bindings = data["results"]["bindings"]

    facilities = [
        {
            "id": row["facility"]["value"],
            "name": row["name"]["value"],
            "address": row["address"]["value"],
            "tel": row["tel"]["value"],
            "lat": float(row["lat"]["value"]),
            "lng": float(row["long"]["value"]),
            "desc": row["desc"]["value"],
        }
        for row in bindings
    ]

    return jsonify(facilities)
