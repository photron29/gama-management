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
    FaTimesCircle
} from 'react-icons/fa';
import { apiClient } from '../utils/api';

const MyOrders = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [showOrderDetails, setShowOrderDetails] = useState(false);

    useEffect(() => {
        fetchOrders();
    }, []);

    const fetchOrders = async () => {
        try {
            const data = await apiClient.getMyOrders();
            setOrders(data.orders);
        } catch (error) {
            toast.error('Failed to fetch orders');
        } finally {
            setLoading(false);
        }
    };

    const getOrderDetails = async (orderId) => {
        try {
            const data = await apiClient.getOrder(orderId);
            setSelectedOrder(data);
            setShowOrderDetails(true);
        } catch (error) {
            toast.error('Failed to fetch order details');
        }
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'pending':
                return <FaClock className="status-icon pending" />;
            case 'approved':
                return <FaCheckCircle className="status-icon approved" />;
            case 'processing':
                return <FaBox className="status-icon processing" />;
            case 'shipped':
                return <FaTruck className="status-icon shipped" />;
            case 'delivered':
                return <FaCheckCircle className="status-icon delivered" />;
            case 'cancelled':
                return <FaTimesCircle className="status-icon cancelled" />;
            default:
                return <FaClock className="status-icon" />;
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'pending':
                return 'orange';
            case 'approved':
                return 'blue';
            case 'processing':
                return 'purple';
            case 'shipped':
                return 'green';
            case 'delivered':
                return 'green';
            case 'cancelled':
                return 'red';
            default:
                return 'gray';
        }
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    if (loading) {
        return (
            <div className="table-loading">
                <LoadingAtom size="medium" />
                <span>Loading orders...</span>
            </div>
        );
    }

    return (
        <div className="orders-page">
            <div className="page-header">
                <h1>My Orders</h1>
            </div>

            {orders.length === 0 ? (
                <div className="orders-empty-state">
                    <FaShoppingBag className="orders-empty-icon" />
                    <h3>No Orders Yet</h3>
                    <p>You haven't placed any orders yet. Start shopping to see your orders here.</p>
                </div>
            ) : (
                <div className="orders-list">
                    {orders.map(order => (
                        <div key={order.id} className="instructor-order-card">
                            <div className="instructor-order-header">
                                <div className="instructor-order-info">
                                    <h3>Order #{order.order_number}</h3>
                                    <p className="instructor-order-branch">{order.branch_name}</p>
                                    <p className="instructor-order-date">
                                        <FaCalendar /> {formatDate(order.created_at)}
                                    </p>
                                </div>
                                <div className="instructor-order-status">
                                    <div className={`instructor-status-badge ${order.status}`}>
                                        {getStatusIcon(order.status)}
                                        {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                                    </div>
                                </div>
                            </div>

                            <div className="instructor-order-details">
                                <div className="instructor-order-summary">
                                    <div className="instructor-summary-item">
                                        <FaBox />
                                        <span>{order.item_count} item{order.item_count !== 1 ? 's' : ''}</span>
                                    </div>
                                    <div className="instructor-summary-item">
                                        <FaDollarSign />
                                        <span>${Number(order.total || 0).toFixed(2)}</span>
                                    </div>
                                </div>

                                <div className="instructor-order-actions">
                                    <button
                                        className="btn btn-secondary"
                                        onClick={() => getOrderDetails(order.id)}
                                    >
                                        <FaEye /> View Details
                                    </button>
                                </div>
                            </div>

                            {order.notes && (
                                <div className="instructor-order-notes">
                                    <strong>Notes:</strong> {order.notes}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {showOrderDetails && selectedOrder && (
                <div className="modal-overlay" onClick={() => setShowOrderDetails(false)}>
                    <div className="modal instructor-order-details-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>Order Details - #{selectedOrder.order.order_number}</h2>
                            <button
                                className="modal-close"
                                onClick={() => setShowOrderDetails(false)}
                            >
                                ×
                            </button>
                        </div>

                        <div className="instructor-order-details-content">
                            <div className="instructor-order-info-section">
                                <h3>Order Information</h3>
                                <div className="instructor-info-grid">
                                    <div className="instructor-info-item">
                                        <strong>Order Number:</strong> #{selectedOrder.order.order_number}
                                    </div>
                                    <div className="instructor-info-item">
                                        <strong>Status:</strong>
                                        <span className={`instructor-status-badge ${selectedOrder.order.status}`}>
                                            {getStatusIcon(selectedOrder.order.status)}
                                            {selectedOrder.order.status.charAt(0).toUpperCase() + selectedOrder.order.status.slice(1)}
                                        </span>
                                    </div>
                                    <div className="instructor-info-item">
                                        <strong>Branch:</strong> {selectedOrder.order.branch_name}
                                    </div>
                                    <div className="instructor-info-item">
                                        <strong>Order Date:</strong> {formatDate(selectedOrder.order.created_at)}
                                    </div>
                                    <div className="instructor-info-item">
                                        <strong>Total Amount:</strong> ${Number(selectedOrder.order.total || 0).toFixed(2)}
                                    </div>
                                </div>
                            </div>

                            <div className="instructor-order-items-section">
                                <h3>Order Items</h3>
                                <div className="instructor-items-list">
                                    {selectedOrder.items.map(item => (
                                        <div key={item.id} className="instructor-order-item">
                                            <div className="instructor-item-info">
                                                <h4>{item.product_name}</h4>
                                                <p className="instructor-item-category">{item.product_category}</p>
                                                {item.product_description && (
                                                    <p className="instructor-item-description">{item.product_description}</p>
                                                )}
                                            </div>
                                            <div className="instructor-item-quantity">
                                                <span>Qty: {item.quantity}</span>
                                            </div>
                                            <div className="instructor-item-price">
                                                <span>${Number(item.price || 0).toFixed(2)} each</span>
                                                <strong>${(Number(item.price || 0) * item.quantity).toFixed(2)}</strong>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {selectedOrder.order.notes && (
                                <div className="instructor-order-notes-section">
                                    <h3>Order Notes</h3>
                                    <p>{selectedOrder.order.notes}</p>
                                </div>
                            )}
                        </div>

                        <div className="modal-actions">
                            <button
                                className="btn btn-secondary"
                                onClick={() => setShowOrderDetails(false)}
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

export default MyOrders;
