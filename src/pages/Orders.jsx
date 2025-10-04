import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import LoadingAtom from '../components/LoadingAtom';
import {
    FaEye,
    FaCalendar,
    FaBox,
    FaDollarSign,
    FaShoppingBag,
    FaCheckCircle,
    FaClock,
    FaTruck,
    FaTimesCircle,
    FaUser,
    FaSearch,
    FaFilter,
    FaSyncAlt
} from 'react-icons/fa';
import { apiClient } from '../utils/api';

const Orders = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('');
    const [refreshing, setRefreshing] = useState(false);
    const [pendingCount, setPendingCount] = useState(0);

    useEffect(() => {
        fetchOrders();
    }, []);

    const fetchOrders = async () => {
        try {
            setLoading(true);
            const response = await apiClient.getOrders();
            const ordersData = response.orders || [];
            setOrders(ordersData);

            // Count pending orders for notification badge
            const pendingOrders = ordersData.filter(order => order.status === 'pending');
            setPendingCount(pendingOrders.length);
        } catch (error) {
            console.error('Error fetching orders:', error);
            toast.error('Failed to fetch orders');
        } finally {
            setLoading(false);
        }
    };

    const handleRefresh = async () => {
        setRefreshing(true);
        await fetchOrders();
        setRefreshing(false);
    };

    const updateOrderStatus = async (orderId, newStatus) => {
        try {
            await apiClient.updateOrderStatus(orderId, { status: newStatus });
            toast.success(`Order status updated to ${newStatus}`);
            await fetchOrders();
            setSelectedOrder(null);
        } catch (error) {
            console.error('Error updating order status:', error);
            toast.error('Failed to update order status');
        }
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'pending':
                return <FaClock className="text-yellow-500" />;
            case 'processing':
                return <FaBox className="text-blue-500" />;
            case 'shipped':
                return <FaTruck className="text-purple-500" />;
            case 'delivered':
                return <FaCheckCircle className="text-green-500" />;
            case 'cancelled':
                return <FaTimesCircle className="text-red-500" />;
            default:
                return <FaClock className="text-gray-500" />;
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'pending':
                return 'bg-yellow-100 text-yellow-800 border-yellow-200';
            case 'processing':
                return 'bg-blue-100 text-blue-800 border-blue-200';
            case 'shipped':
                return 'bg-purple-100 text-purple-800 border-purple-200';
            case 'delivered':
                return 'bg-green-100 text-green-800 border-green-200';
            case 'cancelled':
                return 'bg-red-100 text-red-800 border-red-200';
            default:
                return 'bg-gray-100 text-gray-800 border-gray-200';
        }
    };

    const filteredOrders = orders.filter(order => {
        const matchesSearch = order.order_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
            order.instructor_name.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = filterStatus === '' || order.status === filterStatus;
        return matchesSearch && matchesStatus;
    });

    if (loading) {
        return (
            <div className="loading-container">
                <LoadingAtom size="medium" />
                <p>Loading orders...</p>
            </div>
        );
    }

    return (
        <div className="page-content">
            <div className="page-header">
                <div className="header-content">
                    <h1>Order Management</h1>
                    <p>Manage and track all orders from instructors</p>
                </div>
                <div className="header-actions">
                    <div className="refresh-container">
                        <button
                            onClick={handleRefresh}
                            disabled={refreshing}
                            className="refresh-btn"
                            title="Refresh orders"
                        >
                            <FaSyncAlt className={refreshing ? 'spinning' : ''} />
                            {refreshing ? 'Refreshing...' : 'Refresh'}
                        </button>
                        {pendingCount > 0 && (
                            <div className="notification-badge">
                                <span className="badge-count">{pendingCount}</span>
                                <span className="badge-text">Pending</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="filters-section">
                <div className="search-bar">
                    <FaSearch className="search-icon" />
                    <input
                        type="text"
                        placeholder="Search by order number or instructor..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                <div className="filter-controls">
                    <select
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                        className="filter-select"
                    >
                        <option value="">All Status</option>
                        <option value="pending">Pending</option>
                        <option value="processing">Processing</option>
                        <option value="shipped">Shipped</option>
                        <option value="delivered">Delivered</option>
                        <option value="cancelled">Cancelled</option>
                    </select>
                </div>
            </div>

            {/* Orders List */}
            <div className="orders-list">
                {filteredOrders.length === 0 ? (
                    <div className="empty-state">
                        <FaShoppingBag className="empty-icon" />
                        <h3>No orders found</h3>
                        <p>No orders match your current filters</p>
                    </div>
                ) : (
                    filteredOrders.map((order) => (
                        <div key={order.id} className="order-card">
                            <div className="order-header">
                                <div className="order-info">
                                    <h3>Order #{order.order_number}</h3>
                                    <p className="instructor-name">
                                        <FaUser className="icon" />
                                        {order.instructor_name}
                                    </p>
                                    <p className="order-date">
                                        <FaCalendar className="icon" />
                                        {new Date(order.created_at).toLocaleDateString()}
                                    </p>
                                </div>
                                <div className="order-status">
                                    <span className={`status-badge ${getStatusColor(order.status)}`}>
                                        {getStatusIcon(order.status)}
                                        {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                                    </span>
                                </div>
                            </div>

                            <div className="order-details">
                                <div className="order-items">
                                    <h4>Items ({order.items.length})</h4>
                                    {order.items.map((item, index) => (
                                        <div key={index} className="order-item">
                                            <span className="item-name">{item.product_name}</span>
                                            <span className="item-quantity">Qty: {item.quantity}</span>
                                            <span className="item-price">₹{item.price}</span>
                                        </div>
                                    ))}
                                </div>

                                <div className="order-total">
                                    <div className="total-row">
                                        <span>Subtotal:</span>
                                        <span>₹{order.subtotal}</span>
                                    </div>
                                    <div className="total-row">
                                        <span>Tax:</span>
                                        <span>₹{order.tax || 0}</span>
                                    </div>
                                    <div className="total-row total-final">
                                        <span>Total:</span>
                                        <span>₹{order.total}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="order-actions">
                                <button
                                    onClick={() => setSelectedOrder(order)}
                                    className="btn btn-outline"
                                >
                                    <FaEye className="icon" />
                                    View Details
                                </button>

                                {order.status === 'pending' && (
                                    <button
                                        onClick={() => updateOrderStatus(order.id, 'processing')}
                                        className="btn btn-primary"
                                    >
                                        Start Processing
                                    </button>
                                )}

                                {order.status === 'processing' && (
                                    <button
                                        onClick={() => updateOrderStatus(order.id, 'shipped')}
                                        className="btn btn-success"
                                    >
                                        Mark as Shipped
                                    </button>
                                )}

                                {order.status === 'shipped' && (
                                    <button
                                        onClick={() => updateOrderStatus(order.id, 'delivered')}
                                        className="btn btn-success"
                                    >
                                        Mark as Delivered
                                    </button>
                                )}

                                {(order.status === 'pending' || order.status === 'processing') && (
                                    <button
                                        onClick={() => updateOrderStatus(order.id, 'cancelled')}
                                        className="btn btn-danger"
                                    >
                                        Cancel Order
                                    </button>
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Order Details Modal */}
            {selectedOrder && (
                <div className="modal-overlay" onClick={() => setSelectedOrder(null)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>Order Details - #{selectedOrder.order_number}</h2>
                            <button
                                onClick={() => setSelectedOrder(null)}
                                className="btn-close"
                            >
                                ×
                            </button>
                        </div>

                        <div className="modal-body">
                            <div className="order-info-section">
                                <h3>Order Information</h3>
                                <div className="info-grid">
                                    <div className="info-item">
                                        <label>Order Number:</label>
                                        <span>{selectedOrder.order_number}</span>
                                    </div>
                                    <div className="info-item">
                                        <label>Instructor:</label>
                                        <span>{selectedOrder.instructor_name}</span>
                                    </div>
                                    <div className="info-item">
                                        <label>Order Date:</label>
                                        <span>{new Date(selectedOrder.created_at).toLocaleDateString()}</span>
                                    </div>
                                    <div className="info-item">
                                        <label>Status:</label>
                                        <span className={`status-badge ${getStatusColor(selectedOrder.status)}`}>
                                            {getStatusIcon(selectedOrder.status)}
                                            {selectedOrder.status.charAt(0).toUpperCase() + selectedOrder.status.slice(1)}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="order-items-section">
                                <h3>Order Items</h3>
                                <div className="items-list">
                                    {selectedOrder.items.map((item, index) => (
                                        <div key={index} className="item-detail">
                                            <div className="item-info">
                                                <h4>{item.product_name}</h4>
                                                <p>Category: {item.category}</p>
                                                <p>Description: {item.description}</p>
                                            </div>
                                            <div className="item-quantity">
                                                <span>Quantity: {item.quantity}</span>
                                            </div>
                                            <div className="item-price">
                                                <span>Price: ₹{item.price}</span>
                                                <span>Total: ₹{item.quantity * item.price}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="order-total-section">
                                <h3>Order Summary</h3>
                                <div className="total-breakdown">
                                    <div className="total-row">
                                        <span>Subtotal:</span>
                                        <span>₹{selectedOrder.subtotal}</span>
                                    </div>
                                    <div className="total-row">
                                        <span>Tax:</span>
                                        <span>₹{selectedOrder.tax || 0}</span>
                                    </div>
                                    <div className="total-row total-final">
                                        <span>Total:</span>
                                        <span>₹{selectedOrder.total}</span>
                                    </div>
                                </div>
                            </div>

                            {selectedOrder.notes && (
                                <div className="order-notes">
                                    <h3>Notes</h3>
                                    <p>{selectedOrder.notes}</p>
                                </div>
                            )}
                        </div>

                        <div className="modal-footer">
                            <button
                                onClick={() => setSelectedOrder(null)}
                                className="btn btn-secondary"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Orders;
