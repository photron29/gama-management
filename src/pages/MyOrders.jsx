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

// 👇 FIX: Helper function to safely capitalize status strings
const capitalizeStatus = (status) => {
    // Check if status is a valid string before trying to use charAt()
    if (!status || typeof status !== 'string' || status.length === 0) {
        return 'N/A';
    }
    return status.charAt(0).toUpperCase() + status.slice(1);
};
// ---

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
            console.log('Order details response:', data); // Debug log
            setSelectedOrder(data);
            setShowOrderDetails(true);
        } catch (error) {
            console.error('Error fetching order details:', error);
            toast.error('Failed to fetch order details');
        }
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'pending':
                return <FaClock className="text-yellow-600" />;
            case 'approved':
                return <FaCheckCircle className="text-blue-600" />;
            case 'processing':
                return <FaBox className="text-blue-600" />;
            case 'shipped':
                return <FaTruck className="text-purple-600" />;
            case 'delivered':
                return <FaCheckCircle className="text-green-600" />;
            case 'cancelled':
                return <FaTimesCircle className="text-red-600" />;
            default:
                return <FaClock className="text-gray-600" />;
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
            <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
                <LoadingAtom size="medium" />
                <span className="text-gray-600">Loading orders...</span>
            </div>
        );
    }

    return (
        <div className="p-6 max-w-6xl mx-auto">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900">My Orders</h1>
            </div>

            {orders.length === 0 ? (
                <div className="text-center py-16">
                    <FaShoppingBag className="text-6xl text-gray-300 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-gray-700 mb-2">No Orders Yet</h3>
                    <p className="text-gray-500">You haven't placed any orders yet. Start shopping to see your orders here.</p>
                </div>
            ) : (
                <div className="space-y-6">
                    {orders.map(order => (
                        <div key={order.id} className="bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden">
                            <div className="flex justify-between items-start p-6 bg-gray-50 border-b border-gray-200">
                                <div className="space-y-2">
                                    <h3 className="text-xl font-semibold text-gray-900">Order #{order.order_number || order.id}</h3>
                                    <p className="text-sm text-gray-600">{order.branch_name}</p>
                                    <p className="text-sm text-gray-600 flex items-center gap-2">
                                        <FaCalendar className="text-gray-400" /> {formatDate(order.created_at)}
                                    </p>
                                </div>
                                <div className="flex items-center">
                                    <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm ${
                                        order.status === 'pending' ? 'bg-yellow-100 text-yellow-800 border border-yellow-200' :
                                        order.status === 'processing' ? 'bg-blue-100 text-blue-800 border border-blue-200' :
                                        order.status === 'shipped' ? 'bg-purple-100 text-purple-800 border border-purple-200' :
                                        order.status === 'delivered' ? 'bg-green-100 text-green-800 border border-green-200' :
                                        order.status === 'cancelled' ? 'bg-red-100 text-red-800 border border-red-200' :
                                        'bg-gray-100 text-gray-800 border border-gray-200'
                                    }`}>
                                        {getStatusIcon(order.status || 'pending')}
                                        {capitalizeStatus(order.status || 'pending')}
                                    </div>
                                </div>
                            </div>

                            <div className="p-6 flex justify-between items-center">
                                <div className="flex gap-8">
                                    <div className="flex items-center gap-2 text-sm text-gray-600">
                                        <FaBox className="text-gray-400" />
                                        <span>{order.item_count} item{order.item_count !== 1 ? 's' : ''}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-sm text-gray-600">
                                        <FaDollarSign className="text-gray-400" />
                                        <span>₹{Number(order.total_amount || order.total || 0).toFixed(2)}</span>
                                    </div>
                                </div>

                                <div className="flex gap-3">
                                    <button
                                        className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors duration-200 flex items-center gap-2"
                                        onClick={() => getOrderDetails(order.id)}
                                    >
                                        <FaEye /> View Details
                                    </button>
                                </div>
                            </div>

                            {order.notes && (
                                <div className="px-6 py-3 bg-gray-50 border-t border-gray-200 text-sm text-gray-600">
                                    <strong>Notes:</strong> {order.notes}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {showOrderDetails && selectedOrder && (
                <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4" onClick={() => setShowOrderDetails(false)}>
                    <div className="bg-white rounded-xl shadow-2xl max-h-[90vh] w-full max-w-4xl overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                        
                        {/* Define order data safely, assuming it's nested like { order: {...}, items: [...] } */}
                        {/* This line is the key to simplifying and safeguarding access */}
                        {(() => {
                            const orderDetails = selectedOrder.order || selectedOrder || {};
                            console.log('Order details for display:', orderDetails); // Debug log
                            
                            return (
                                <>
                                    <div className="flex justify-between items-center p-6 border-b border-gray-200 bg-gray-50 rounded-t-xl">
                                        <h2 className="text-2xl font-bold text-gray-900">Order Details - #{orderDetails.order_number || orderDetails.id || 'N/A'}</h2>
                                        <button
                                            className="text-gray-400 hover:text-gray-600 text-2xl font-bold p-2 hover:bg-gray-100 rounded-lg transition-colors"
                                            onClick={() => setShowOrderDetails(false)}
                                        >
                                            ×
                                        </button>
                                    </div>

                                    <div className="p-6">
                                        <div className="mb-8">
                                            <h3 className="text-xl font-semibold text-gray-900 mb-4 border-b-2 border-gray-200 pb-2">Order Information</h3>
                                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                                <div className="flex flex-col gap-1 p-4 bg-gray-50 rounded-lg border border-gray-200">
                                                    <strong className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Order Number</strong>
                                                    <span className="text-gray-900">#{orderDetails.order_number || orderDetails.id || 'N/A'}</span>
                                                </div>
                                                <div className="flex flex-col gap-1 p-4 bg-gray-50 rounded-lg border border-gray-200">
                                                    <strong className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</strong>
                                                    <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-lg font-medium text-sm w-fit ${
                                                        orderDetails.status === 'pending' ? 'bg-yellow-100 text-yellow-800 border border-yellow-200' :
                                                        orderDetails.status === 'processing' ? 'bg-blue-100 text-blue-800 border border-blue-200' :
                                                        orderDetails.status === 'shipped' ? 'bg-purple-100 text-purple-800 border border-purple-200' :
                                                        orderDetails.status === 'delivered' ? 'bg-green-100 text-green-800 border border-green-200' :
                                                        orderDetails.status === 'cancelled' ? 'bg-red-100 text-red-800 border border-red-200' :
                                                        'bg-gray-100 text-gray-800 border border-gray-200'
                                                    }`}>
                                                        {getStatusIcon(orderDetails.status || 'pending')}
                                                        {capitalizeStatus(orderDetails.status || 'pending')}
                                                    </div>
                                                </div>
                                                <div className="flex flex-col gap-1 p-4 bg-gray-50 rounded-lg border border-gray-200">
                                                    <strong className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Branch</strong>
                                                    <span className="text-gray-900">{orderDetails.branch_name || 'N/A'}</span>
                                                </div>
                                                <div className="flex flex-col gap-1 p-4 bg-gray-50 rounded-lg border border-gray-200">
                                                    <strong className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Order Date</strong>
                                                    <span className="text-gray-900">{formatDate(orderDetails.created_at)}</span>
                                                </div>
                                                <div className="flex flex-col gap-1 p-4 bg-gray-50 rounded-lg border border-gray-200">
                                                    <strong className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Total Amount</strong>
                                                    <span className="text-gray-900 font-semibold">₹{Number(orderDetails.total_amount || orderDetails.total || 0).toFixed(2)}</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="mb-8">
                                            <h3 className="text-xl font-semibold text-gray-900 mb-4 border-b-2 border-gray-200 pb-2">Order Items</h3>
                                            <div className="space-y-4">
                                                {selectedOrder.items && selectedOrder.items.length > 0 ? selectedOrder.items.map(item => (
                                                    <div key={item.id} className="grid grid-cols-1 md:grid-cols-3 gap-4 p-6 bg-white border border-gray-200 rounded-lg shadow-sm">
                                                        <div className="space-y-2">
                                                            <h4 className="text-lg font-semibold text-gray-900">{item.product_name}</h4>
                                                            <p className="text-sm text-gray-600">{item.product_category}</p>
                                                            {item.product_description && (
                                                                <p className="text-sm text-gray-500 italic">{item.product_description}</p>
                                                            )}
                                                        </div>
                                                        <div className="flex items-center justify-center">
                                                            <span className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium">Qty: {item.quantity}</span>
                                                        </div>
                                                        <div className="flex flex-col items-end gap-1">
                                                            <span className="text-sm text-gray-600">₹{Number(item.price || 0).toFixed(2)} each</span>
                                                            <strong className="text-lg font-semibold text-gray-900">₹{(Number(item.price || 0) * item.quantity).toFixed(2)}</strong>
                                                        </div>
                                                    </div>
                                                )) : (
                                                    <div className="text-center py-8 text-gray-500 italic">
                                                        <p>No items found for this order.</p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {orderDetails.notes && (
                                            <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                                                <h3 className="text-lg font-semibold text-gray-900 mb-2">Order Notes</h3>
                                                <p className="text-gray-700 leading-relaxed">{orderDetails.notes}</p>
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex justify-end gap-4 p-6 border-t border-gray-200 bg-gray-50 rounded-b-xl">
                                        <button
                                            className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors duration-200"
                                            onClick={() => setShowOrderDetails(false)}
                                        >
                                            Close
                                        </button>
                                    </div>
                                </>
                            );
                        })()}
                    </div>
                </div>
            )}
        </div>
    );
};

export default MyOrders;