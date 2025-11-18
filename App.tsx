
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Product } from './types';

// A simple shopping cart icon component
const ShoppingCartIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
    </svg>
);

// A simple loader component
const Loader = () => (
    <div className="flex justify-center items-center p-8">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500"></div>
    </div>
);

// Define API base URL - Vercel automatically routes /api to functions
const API_BASE_URL = '';

const App: React.FC = () => {
    const [products, setProducts] = useState<Product[]>([]);
    const [cart, setCart] = useState<Product[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [isCheckingOut, setIsCheckingOut] = useState<boolean>(false);

    useEffect(() => {
        const fetchProducts = async () => {
            try {
                setLoading(true);
                setError(null);
                const response = await fetch(`${API_BASE_URL}/api/getProducts`);
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                const data = await response.json();
                setProducts(data.products || []);
            } catch (e) {
                if (e instanceof Error) {
                    setError(`Failed to fetch products: ${e.message}`);
                } else {
                    setError('An unknown error occurred.');
                }
                console.error(e);
            } finally {
                setLoading(false);
            }
        };

        fetchProducts();
    }, []);

    const handleAddToCart = useCallback((product: Product) => {
        setCart(prevCart => [...prevCart, product]);
    }, []);

    const handleCheckout = async () => {
        if (cart.length === 0) {
            alert('Your cart is empty.');
            return;
        }
        setIsCheckingOut(true);
        try {
            const response = await fetch(`${API_BASE_URL}/api/createOrder`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ cartItems: cart }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to create order.');
            }
            
            const result = await response.json();
            alert(`Order created successfully! Order ID: ${result.orderId}`);
            setCart([]);
        } catch (e) {
            if (e instanceof Error) {
                alert(`Error: ${e.message}`);
            } else {
                alert('An unknown error occurred during checkout.');
            }
            console.error(e);
        } finally {
            setIsCheckingOut(false);
        }
    };

    const cartTotal = useMemo(() => {
        return cart.reduce((total, item) => total + item.price, 0);
    }, [cart]);

    return (
        <div className="min-h-screen bg-gray-100 font-sans">
            <header className="bg-white shadow-md sticky top-0 z-10">
                <nav className="container mx-auto px-6 py-4 flex justify-between items-center">
                    <h1 className="text-2xl font-bold text-gray-800">Vercel Store</h1>
                    <div className="relative">
                        <ShoppingCartIcon />
                        {cart.length > 0 && (
                            <span className="absolute -top-2 -right-2 bg-blue-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                                {cart.length}
                            </span>
                        )}
                    </div>
                </nav>
            </header>

            <main className="container mx-auto px-6 py-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Products Section */}
                    <div className="lg:col-span-2">
                        <h2 className="text-3xl font-semibold text-gray-700 mb-6">Products</h2>
                        {loading && <Loader />}
                        {error && <p className="text-red-500 bg-red-100 p-4 rounded-lg">{error}</p>}
                        {!loading && !error && (
                            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                                {products.map((product) => (
                                    <div key={product.id} className="bg-white rounded-lg shadow-lg overflow-hidden transform hover:scale-105 transition-transform duration-300">
                                        <img src={`https://picsum.photos/seed/${product.id}/400/300`} alt={product.name} className="w-full h-48 object-cover"/>
                                        <div className="p-4">
                                            <h3 className="text-lg font-semibold text-gray-800">{product.name}</h3>
                                            <p className="text-gray-600 mt-1">${(product.price / 100).toFixed(2)}</p>
                                            <button 
                                                onClick={() => handleAddToCart(product)}
                                                className="mt-4 w-full bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition-colors"
                                            >
                                                Add to Cart
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Cart Section */}
                    <div className="lg:col-span-1">
                        <div className="bg-white p-6 rounded-lg shadow-lg sticky top-24">
                            <h2 className="text-2xl font-semibold text-gray-700 mb-4 border-b pb-4">My Cart</h2>
                            {cart.length === 0 ? (
                                <p className="text-gray-500">Your cart is empty.</p>
                            ) : (
                                <>
                                    <ul className="space-y-4 mb-6 max-h-80 overflow-y-auto">
                                        {cart.map((item, index) => (
                                            <li key={`${item.id}-${index}`} className="flex justify-between items-center text-gray-700">
                                                <span>{item.name}</span>
                                                <span className="font-medium">${(item.price / 100).toFixed(2)}</span>
                                            </li>
                                        ))}
                                    </ul>
                                    <div className="border-t pt-4">
                                        <div className="flex justify-between items-center font-bold text-lg text-gray-800">
                                            <span>Total:</span>
                                            <span>${(cartTotal / 100).toFixed(2)}</span>
                                        </div>
                                        <button 
                                            onClick={handleCheckout}
                                            disabled={isCheckingOut}
                                            className="mt-6 w-full bg-green-500 text-white py-3 px-4 rounded-md hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-opacity-50 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                                        >
                                            {isCheckingOut ? 'Processing...' : 'Confirm Order'}
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default App;
