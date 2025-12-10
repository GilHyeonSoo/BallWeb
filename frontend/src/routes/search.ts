// backend/src/routes/search.ts
import express from 'express';
import axios from 'axios';

const router = express.Router();

// GraphDB 설정
const GRAPHDB_URL = process.env.GRAPHDB_URL || 'http://localhost:7200';
const REPOSITORY = process.env.GRAPHDB_REPOSITORY || 'your-repo-name';

// 검색 API
router.get('/api/search', async (req, res) => {
  const { q: query } = req.query;
  
  if (!query) {
    return res.status(400).json({ error: 'Query parameter is required' });
  }

  // SPARQL 쿼리 작성 (예시)
  const sparqlQuery = `
    PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
    PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
    
    SELECT DISTINCT ?subject ?label ?type ?description
    WHERE {
      ?subject rdfs:label ?label .
      OPTIONAL { ?subject rdf:type ?type . }
      OPTIONAL { ?subject rdfs:comment ?description . }
      
      FILTER(
        CONTAINS(LCASE(STR(?label)), LCASE("${query}")) ||
        CONTAINS(LCASE(STR(?description)), LCASE("${query}"))
      )
    }
    LIMIT 50
  `;

  try {
    const response = await axios.post(
      `${GRAPHDB_URL}/repositories/${REPOSITORY}`,
      `query=${encodeURIComponent(sparqlQuery)}`,
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/sparql-results+json'
        }
      }
    );

    // 결과 변환
    const results = response.data.results.bindings.map((item: any) => ({
      uri: item.subject?.value,
      label: item.label?.value,
      type: item.type?.value,
      description: item.description?.value
    }));

    res.json({ results, total: results.length });
  } catch (error) {
    console.error('GraphDB query error:', error);
    res.status(500).json({ error: 'Search failed' });
  }
});

export default router;
