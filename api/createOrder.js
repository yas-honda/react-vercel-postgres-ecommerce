
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

    if (request.method !== 'POST') {
        return response.status(405).json({ error: 'Method Not Allowed' });
    }

    try {
        const { cartItems } = request.body;

        if (!cartItems || !Array.isArray(cartItems) || cartItems.length === 0) {
            return response.status(400).json({ error: 'Cart items are required and must be a non-empty array.' });
        }

        // Calculate total price on the server-side for security
        const productIds = cartItems.map(item => item.id);
        const { rows: productsFromDb } = await sql`SELECT id, price FROM products WHERE id = ANY(${productIds});`;

        const priceMap = new Map(productsFromDb.map(p => [p.id, p.price]));
        
        let totalPrice = 0;
        for(const item of cartItems) {
            if(!priceMap.has(item.id)) {
                 return response.status(400).json({ error: `Product with id ${item.id} not found.` });
            }
            totalPrice += priceMap.get(item.id);
        }

        // Using a transaction to ensure atomicity
        const client = await sql.connect();
        let newOrderId;

        try {
            await client.query('BEGIN');
            
            // 1. Insert into orders table
            const orderResult = await client.query('INSERT INTO orders (total_price) VALUES ($1) RETURNING id;', [totalPrice]);
            newOrderId = orderResult.rows[0].id;
            
            if (!newOrderId) {
                throw new Error('Failed to create order record.');
            }

            // 2. Insert each item into order_items table
            const orderItemsPromises = cartItems.map(item => {
                const itemPrice = priceMap.get(item.id);
                // Assuming quantity is 1 for each item added to the cart
                const quantity = 1; 
                return client.query(
                    'INSERT INTO order_items (order_id, product_id, quantity, price) VALUES ($1, $2, $3, $4);',
                    [newOrderId, item.id, quantity, itemPrice]
                );
            });
            
            await Promise.all(orderItemsPromises);

            await client.query('COMMIT');
        } catch (error) {
            await client.query('ROLLBACK');
            throw error; // Rethrow to be caught by outer catch block
        } finally {
            client.release();
        }

        return response.status(201).json({ message: 'Order created successfully', orderId: newOrderId });

    } catch (error) {
        console.error('Order Creation Error:', error);
        return response.status(500).json({ error: 'Failed to create order', details: error.message });
    }
}
