import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import LoadingAtom from '../components/LoadingAtom';
import {
    FaShoppingCart,
    FaSearch,
    FaFilter,
    FaPlus,
    FaMinus,
    FaShoppingBag,
    FaEye,
    FaTag,
    FaBox
} from 'react-icons/fa';
import { apiClient } from '../utils/api';

const Products = () => {
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('');
    const [cart, setCart] = useState({});
    const [showCart, setShowCart] = useState(false);
    const [orderNotes, setOrderNotes] = useState('');

    useEffect(() => {
        fetchProducts();
        fetchCategories();
    }, []);

    const fetchProducts = async () => {
        try {
            const data = await apiClient.getProducts();
            setProducts(data.products);
        } catch (error) {
            toast.error('Failed to fetch products');
        } finally {
            setLoading(false);
        }
    };

    const fetchCategories = async () => {
        try {
            const data = await apiClient.getProductCategories();
            setCategories(data.categories);
        } catch (error) {
            console.error('Failed to fetch categories:', error);
        }
    };

    const addToCart = (productId, productName, price) => {
        setCart(prev => ({
            ...prev,
            [productId]: {
                id: productId,
                name: productName,
                price: Number(price),
                quantity: (prev[productId]?.quantity || 0) + 1
            }
        }));
        toast.success(`${productName} added to cart`);
    };

    const removeFromCart = (productId) => {
        setCart(prev => {
            const newCart = { ...prev };
            if (newCart[productId]) {
                if (newCart[productId].quantity > 1) {
                    newCart[productId].quantity -= 1;
                } else {
                    delete newCart[productId];
                }
            }
            return newCart;
        });
    };

    const updateCartQuantity = (productId, quantity) => {
        if (quantity <= 0) {
            setCart(prev => {
                const newCart = { ...prev };
                delete newCart[productId];
                return newCart;
            });
        } else {
            setCart(prev => ({
                ...prev,
                [productId]: {
                    ...prev[productId],
                    quantity: quantity
                }
            }));
        }
    };

    const getCartTotal = () => {
        return Object.values(cart).reduce((total, item) => total + (Number(item.price) * item.quantity), 0);
    };

    const getCartItemCount = () => {
        return Object.values(cart).reduce((total, item) => total + item.quantity, 0);
    };

    const handlePlaceOrder = async () => {
        try {
            const orderItems = Object.values(cart).map(item => ({
                product_id: item.id,
                quantity: item.quantity
            }));

            await apiClient.createOrder({
                items: orderItems,
                notes: orderNotes
            });

            toast.success('Order placed successfully!');
            setCart({});
            setOrderNotes('');
            setShowCart(false);
        } catch (error) {
            toast.error('Failed to place order');
        }
    };

    const filteredProducts = products.filter(product => {
        const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            product.description?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = !selectedCategory || product.category === selectedCategory;
        return matchesSearch && matchesCategory;
    });

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
                <LoadingAtom size="medium" />
                <span className="text-gray-600">Loading products...</span>
            </div>
        );
    }

    return (
        <div className="p-6 max-w-7xl mx-auto">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold text-gray-900">Products</h1>
                <div className="flex items-center space-x-4">
                    <button
                        className="flex items-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 hover:shadow-lg transition-all duration-200 font-medium shadow-md"
                        onClick={() => setShowCart(!showCart)}
                    >
                        <FaShoppingCart className="h-4 w-4" />
                        <span>Cart ({getCartItemCount()})</span>
                    </button>
                </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 mb-6">
                <div className="flex-1 relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <FaSearch className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                        type="text"
                        placeholder="Search products..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                </div>
                <div className="sm:w-48">
                    <select
                        value={selectedCategory}
                        onChange={(e) => setSelectedCategory(e.target.value)}
                        className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                        <option value="">All Categories</option>
                        {categories.map(category => (
                            <option key={category} value={category}>{category}</option>
                        ))}
                    </select>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredProducts.map(product => (
                    <div key={product.id} className="bg-white border border-gray-200 rounded-xl shadow-lg hover:shadow-xl hover:border-blue-200 transition-all duration-300 overflow-hidden group hover:scale-[1.02]">
                        <div className="aspect-square bg-gray-100 flex items-center justify-center">
                            {product.image_url ? (
                                <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
                            ) : (
                                <div className="text-gray-400">
                                    <FaBox className="text-4xl" />
                                </div>
                            )}
                        </div>

                        <div className="p-4 space-y-3">
                            <h3 className="text-lg font-semibold text-gray-900 line-clamp-2">{product.name}</h3>
                            <p className="text-sm text-gray-600 line-clamp-2">{product.description}</p>
                            <div className="flex items-center justify-between text-sm text-gray-500">
                                <span className="flex items-center gap-1">
                                    <FaTag className="h-3 w-3" />
                                    {product.category}
                                </span>
                                <span>Stock: {product.stock_quantity}</span>
                            </div>
                            <div className="text-xl font-bold text-gray-900">
                                ₹{Number(product.price).toFixed(2)}
                            </div>
                        </div>

                        <div className="p-4 border-t border-gray-200">
                            {cart[product.id] ? (
                                <div className="flex items-center justify-center space-x-3">
                                    <button
                                        className="p-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors duration-200"
                                        onClick={() => removeFromCart(product.id)}
                                    >
                                        <FaMinus className="h-4 w-4" />
                                    </button>
                                    <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-lg font-medium">{cart[product.id].quantity}</span>
                                    <button
                                        className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
                                        onClick={() => addToCart(product.id, product.name, product.price)}
                                    >
                                        <FaPlus className="h-4 w-4" />
                                    </button>
                                </div>
                            ) : (
                                <button
                                    className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                                    onClick={() => addToCart(product.id, product.name, product.price)}
                                    disabled={product.stock_quantity === 0}
                                >
                                    <FaShoppingCart className="h-4 w-4" />
                                    <span>Add to Cart</span>
                                </button>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {showCart && (
                <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4" onClick={() => setShowCart(false)}>
                    <div className="bg-white rounded-xl shadow-2xl max-h-[90vh] w-full max-w-2xl overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                        <div className="flex justify-between items-center p-6 border-b border-gray-200 bg-gray-50 rounded-t-xl">
                            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                                <FaShoppingCart className="h-6 w-6" />
                                Shopping Cart
                            </h2>
                            <button
                                className="text-gray-400 hover:text-gray-600 text-2xl font-bold p-2 hover:bg-gray-100 rounded-lg transition-colors"
                                onClick={() => setShowCart(false)}
                            >
                                ×
                            </button>
                        </div>

                        <div className="p-6">
                            {Object.values(cart).length === 0 ? (
                                <div className="text-center py-16">
                                    <div className="text-6xl mb-4">🛒</div>
                                    <h3 className="text-xl font-semibold text-gray-700 mb-2">Your cart is empty</h3>
                                    <p className="text-gray-500">Add some products to get started</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {Object.values(cart).map(item => (
                                        <div key={item.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                                            <div className="flex-1">
                                                <h4 className="font-semibold text-gray-900">{item.name}</h4>
                                                <p className="text-sm text-gray-600">₹{Number(item.price).toFixed(2)} each</p>
                                            </div>
                                            <div className="flex items-center space-x-3">
                                                <button
                                                    className="p-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors duration-200 disabled:opacity-50"
                                                    onClick={() => updateCartQuantity(item.id, item.quantity - 1)}
                                                    disabled={item.quantity <= 1}
                                                >
                                                    <FaMinus className="h-4 w-4" />
                                                </button>
                                                <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-lg font-medium">{item.quantity}</span>
                                                <button
                                                    className="p-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors duration-200"
                                                    onClick={() => updateCartQuantity(item.id, item.quantity + 1)}
                                                >
                                                    <FaPlus className="h-4 w-4" />
                                                </button>
                                            </div>
                                            <div className="ml-4">
                                                <div className="text-lg font-semibold text-gray-900">
                                                    ₹{(Number(item.price) * item.quantity).toFixed(2)}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {Object.values(cart).length > 0 && (
                            <div className="p-6 border-t border-gray-200 bg-gray-50 rounded-b-xl">
                                <div className="mb-6">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Order Notes (Optional)</label>
                                    <textarea
                                        value={orderNotes}
                                        onChange={(e) => setOrderNotes(e.target.value)}
                                        placeholder="Any special instructions for this order..."
                                        rows="3"
                                        className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    />
                                </div>

                                <div className="mb-6 p-4 bg-white rounded-lg border border-gray-200">
                                    <h3 className="text-xl font-bold text-gray-900">Total: ₹{Number(getCartTotal()).toFixed(2)}</h3>
                                </div>

                                <div className="flex gap-4">
                                    <button
                                        className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors duration-200"
                                        onClick={() => setShowCart(false)}
                                    >
                                        Continue Shopping
                                    </button>
                                    <button
                                        className="flex-1 flex items-center justify-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
                                        onClick={handlePlaceOrder}
                                    >
                                        <FaShoppingBag className="h-4 w-4" />
                                        <span>Place Order</span>
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default Products;
