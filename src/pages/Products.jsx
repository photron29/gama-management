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
            <div className="table-loading">
                <LoadingAtom size="medium" />
                <span>Loading products...</span>
            </div>
        );
    }

    return (
        <div className="products-page">
            <div className="page-header">
                <h1>Products</h1>
                <div className="header-actions">
                    <button
                        className="btn btn-primary"
                        onClick={() => setShowCart(!showCart)}
                    >
                        <FaShoppingCart /> Cart ({getCartItemCount()})
                    </button>
                </div>
            </div>

            <div className="products-filters">
                <div className="search-input">
                    <FaSearch className="search-icon" />
                    <input
                        type="text"
                        placeholder="Search products..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="filter-select"
                >
                    <option value="">All Categories</option>
                    {categories.map(category => (
                        <option key={category} value={category}>{category}</option>
                    ))}
                </select>
            </div>

            <div className="products-grid">
                {filteredProducts.map(product => (
                    <div key={product.id} className="product-card">
                        <div className="product-image">
                            {product.image_url ? (
                                <img src={product.image_url} alt={product.name} />
                            ) : (
                                <div className="product-placeholder">
                                    <FaBox />
                                </div>
                            )}
                        </div>

                        <div className="product-info">
                            <h3>{product.name}</h3>
                            <p className="product-description">{product.description}</p>
                            <div className="product-meta">
                                <span className="product-category">
                                    <FaTag /> {product.category}
                                </span>
                                <span className="product-stock">
                                    Stock: {product.stock_quantity}
                                </span>
                            </div>
                            <div className="product-price">
                                ${Number(product.price).toFixed(2)}
                            </div>
                        </div>

                        <div className="product-actions">
                            {cart[product.id] ? (
                                <div className="cart-controls">
                                    <button
                                        className="btn btn-sm btn-secondary"
                                        onClick={() => removeFromCart(product.id)}
                                    >
                                        <FaMinus />
                                    </button>
                                    <span className="quantity">{cart[product.id].quantity}</span>
                                    <button
                                        className="btn btn-sm btn-primary"
                                        onClick={() => addToCart(product.id, product.name, product.price)}
                                    >
                                        <FaPlus />
                                    </button>
                                </div>
                            ) : (
                                <button
                                    className="btn btn-primary"
                                    onClick={() => addToCart(product.id, product.name, product.price)}
                                    disabled={product.stock_quantity === 0}
                                >
                                    <FaShoppingCart /> Add to Cart
                                </button>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {showCart && (
                <div className="cart-overlay" onClick={() => setShowCart(false)}>
                    <div className="cart-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="cart-header">
                            <h2 className="cart-title">
                                <FaShoppingCart /> Shopping Cart
                            </h2>
                            <button
                                className="cart-close"
                                onClick={() => setShowCart(false)}
                            >
                                ×
                            </button>
                        </div>

                        <div className="cart-items">
                            {Object.values(cart).length === 0 ? (
                                <div className="empty-cart">
                                    <div className="empty-cart-icon">🛒</div>
                                    <h3>Your cart is empty</h3>
                                    <p>Add some products to get started</p>
                                </div>
                            ) : (
                                Object.values(cart).map(item => (
                                    <div key={item.id} className="cart-item">
                                        <div className="item-info">
                                            <h4>{item.name}</h4>
                                            <p>${Number(item.price).toFixed(2)} each</p>
                                        </div>
                                        <div className="item-controls">
                                            <button
                                                onClick={() => updateCartQuantity(item.id, item.quantity - 1)}
                                                disabled={item.quantity <= 1}
                                            >
                                                <FaMinus />
                                            </button>
                                            <span className="item-quantity">{item.quantity}</span>
                                            <button
                                                onClick={() => updateCartQuantity(item.id, item.quantity + 1)}
                                            >
                                                <FaPlus />
                                            </button>
                                        </div>
                                        <div className="item-right">
                                            <div className="item-total">
                                                ${(Number(item.price) * item.quantity).toFixed(2)}
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        {Object.values(cart).length > 0 && (
                            <div className="cart-footer">
                                <div className="cart-notes">
                                    <label>Order Notes (Optional)</label>
                                    <textarea
                                        value={orderNotes}
                                        onChange={(e) => setOrderNotes(e.target.value)}
                                        placeholder="Any special instructions for this order..."
                                        rows="3"
                                    />
                                </div>

                                <div className="cart-total">
                                    <h3>Total: ${Number(getCartTotal()).toFixed(2)}</h3>
                                </div>

                                <div className="cart-actions">
                                    <button
                                        className="btn btn-secondary"
                                        onClick={() => setShowCart(false)}
                                    >
                                        Continue Shopping
                                    </button>
                                    <button
                                        className="btn btn-primary"
                                        onClick={handlePlaceOrder}
                                    >
                                        <FaShoppingBag /> Place Order
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
