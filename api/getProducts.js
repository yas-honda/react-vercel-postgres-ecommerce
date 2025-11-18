
import { sql } from '@vercel/postgres';

function setCorsHeaders(response) {
    response.setHeader('Access-Control-Allow-Origin', '*');
    response.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    response.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

export default async function handler(request, response) {
    // Handle preflight request for CORS
    if (request.method === 'OPTIONS') {
        setCorsHeaders(response);
        return response.status(204).end();
    }
    
    // Set CORS headers for the actual request
    setCorsHeaders(response);

    if (request.method !== 'GET') {
        return response.status(405).json({ error: 'Method Not Allowed' });
    }

    try {
        const { rows } = await sql`SELECT * FROM products ORDER BY created_at DESC;`;
        return response.status(200).json({ products: rows });
    } catch (error) {
        console.error('Database Error:', error);
        return response.status(500).json({ error: 'Failed to fetch products', details: error.message });
    }
}
