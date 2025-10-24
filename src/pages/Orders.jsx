import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import LoadingAtom from '../components/LoadingAtom';
import {
    FaEye,
    FaCalendar,
    FaBox,
    FaShoppingBag,
    FaCheckCircle,
    FaClock,
    FaTruck,
    FaTimesCircle,
    FaUser,
    FaSearch,
    FaFilter,
    FaSyncAlt,
    FaRupeeSign
} from 'react-icons/fa';
import { apiClient } from '../utils/api';
// 👇 NEW: Import the auth hook
import { useAuth } from '../context/AuthContext'; 

// Helper function to safely capitalize status strings
const capitalizeStatus = (status) => {
    // Check if status is a valid string before operating on it
    if (!status || typeof status !== 'string' || status.length === 0) {
        return 'N/A';
    }
    return status.charAt(0).toUpperCase() + status.slice(1);
};


const Orders = () => {
    const { user } = useAuth(); 
    
    // 👇 FIX 1: Safely determine admin status using optional chaining (?.), 
    // preventing the crash if `user` is undefined during initial render.
    const isAdmin = user?.role?.toLowerCase() === 'admin';

    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('');
    const [refreshing, setRefreshing] = useState(false);
    const [pendingCount, setPendingCount] = useState(0);

    useEffect(() => {
        // Only fetch orders if the user object has loaded
        if (user) {
            fetchOrders();
        }
    }, [user]); // Re-run when user object is available/changes

    const fetchOrders = async () => {
        if (!user) return; // Prevent API call if user is null

        try {
            setLoading(true);
            
            let response;
            
            if (isAdmin) {
                // Admin gets all orders
                response = await apiClient.getAllOrders(); 
            } else {
                // Instructor gets their own orders
                response = await apiClient.getMyOrders(); 
            }
            
            const ordersData = response.orders || [];
            
            // Construct full instructor name for display purposes
            const sanitizedOrders = ordersData.map(order => ({
                ...order,
                instructor_name: order.instructor_name || 
                                 (order.instructor_first_name && order.instructor_last_name 
                                    ? `${order.instructor_first_name} ${order.instructor_last_name}` 
                                    : 'Unknown Instructor')
            }));

            setOrders(sanitizedOrders);

            // Count pending orders (Admin view only)
            if (isAdmin) {
                const pendingOrders = sanitizedOrders.filter(order => order.status === 'pending');
                setPendingCount(pendingOrders.length);
            } else {
                setPendingCount(0); 
            }

        } catch (error) {
            console.error('Error fetching orders:', error);
            toast.error(`Failed to fetch orders: ${error.message || 'Check your network and backend logs.'}`);
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
    
    // This logic is safe because we default to empty strings
    const filteredOrders = orders.filter(order => {
        const orderNumber = order.order_number || '';
        const instructorName = order.instructor_name || '';

        const matchesSearch = orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
            instructorName.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = filterStatus === '' || order.status === filterStatus;
        return matchesSearch && matchesStatus;
    });

    // 👇 RENDER GUARD: Check if user object is loading or null first
    if (!user || loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
                <LoadingAtom size="medium" />
                <p className="text-gray-600">{!user ? 'Authenticating permissions...' : 'Loading orders...'}</p>
            </div>
        );
    }
    
    const pageTitle = isAdmin ? 'Order Management (Admin)' : 'My Orders';
    const pageDescription = isAdmin ? 'Manage and track all orders from instructors' : 'Track the status of your submitted orders';


    return (
        <div className="p-6 max-w-7xl mx-auto">
            <div className="flex justify-between items-start mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">{pageTitle}</h1>
                    <p className="text-gray-600">{pageDescription}</p>
                </div>
                <div className="flex items-center space-x-4">
                    <button
                        onClick={handleRefresh}
                        disabled={refreshing}
                        className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors duration-200"
                        title="Refresh orders"
                    >
                        <FaSyncAlt className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
                        <span>{refreshing ? 'Refreshing...' : 'Refresh'}</span>
                    </button>
                    {isAdmin && pendingCount > 0 && (
                        <div className="flex items-center space-x-2 bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full">
                            <span className="bg-yellow-600 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">{pendingCount}</span>
                            <span className="text-sm font-medium">Pending</span>
                        </div>
                    )}
                </div>
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
                <div className="flex-1 relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <FaSearch className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                        type="text"
                        placeholder="Search by order number or instructor..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                </div>

                <div className="sm:w-48">
                    <select
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                        className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
            <div className="space-y-4">
                {filteredOrders.length === 0 ? (
                    <div className="text-center py-16">
                        <FaShoppingBag className="text-6xl text-gray-300 mx-auto mb-4" />
                        <h3 className="text-xl font-semibold text-gray-700 mb-2">No orders found</h3>
                        <p className="text-gray-500">No orders match your current filters</p>
                    </div>
                ) : (
                    filteredOrders.map((order) => (
                        <div key={order.id} className="bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden">
                            <div className="flex justify-between items-start p-6 bg-gray-50 border-b border-gray-200">
                                <div className="space-y-2">
                                    <h3 className="text-xl font-semibold text-gray-900">Order #{order.order_number}</h3>
                                    <p className="text-sm text-gray-600 flex items-center gap-2">
                                        <FaUser className="text-gray-400" />
                                        {order.instructor_name || `${order.instructor_first_name || ''} ${order.instructor_last_name || ''}`}
                                    </p>
                                    <p className="text-sm text-gray-600 flex items-center gap-2">
                                        <FaCalendar className="text-gray-400" />
                                        {new Date(order.created_at).toLocaleDateString()}
                                    </p>
                                </div>
                                <div className="flex items-center">
                                    <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm ${
                                        order.status === 'pending' ? 'bg-yellow-100 text-yellow-800 border border-yellow-200' :
                                        order.status === 'processing' ? 'bg-blue-100 text-blue-800 border border-blue-200' :
                                        order.status === 'shipped' ? 'bg-purple-100 text-purple-800 border border-purple-200' :
                                        order.status === 'delivered' ? 'bg-green-100 text-green-800 border border-green-200' :
                                        order.status === 'cancelled' ? 'bg-red-100 text-red-800 border border-red-200' :
                                        'bg-gray-100 text-gray-800 border border-gray-200'
                                    }`}>
                                        {getStatusIcon(order.status)}
                                        {capitalizeStatus(order.status)} 
                                    </span>
                                </div>
                            </div>

                            <div className="p-6 flex justify-between items-center">
                                <div className="flex gap-8">
                                    <div className="flex items-center gap-2 text-sm text-gray-600">
                                        <FaBox className="text-gray-400" />
                                        <span>Items ({order.item_count || '...'})</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-sm text-gray-600">
                                        <FaRupeeSign className="text-gray-400" />
                                        <span className="font-semibold text-gray-900">₹{parseFloat(order.total_amount).toFixed(2)}</span>
                                    </div>
                                </div>

                                <div className="flex gap-3">
                                    <button
                                        onClick={() => setSelectedOrder(order)}
                                        className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors duration-200 flex items-center gap-2"
                                    >
                                        <FaEye className="h-4 w-4" />
                                        View Details
                                    </button>
                                    
                                    {/* ADMIN ONLY ACTIONS */}
                                    {isAdmin && order.status === 'pending' && (
                                        <button
                                            onClick={() => updateOrderStatus(order.id, 'processing')}
                                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
                                        >
                                            Start Processing
                                        </button>
                                    )}

                                    {isAdmin && order.status === 'processing' && (
                                        <button
                                            onClick={() => updateOrderStatus(order.id, 'shipped')}
                                            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors duration-200"
                                        >
                                            Mark as Shipped
                                        </button>
                                    )}

                                    {isAdmin && order.status === 'shipped' && (
                                        <button
                                            onClick={() => updateOrderStatus(order.id, 'delivered')}
                                            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors duration-200"
                                        >
                                            Mark as Delivered
                                        </button>
                                    )}

                                    {isAdmin && (order.status === 'pending' || order.status === 'processing') && (
                                        <button
                                            onClick={() => updateOrderStatus(order.id, 'cancelled')}
                                            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors duration-200"
                                        >
                                            Cancel Order
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Order Details Modal */}
            {selectedOrder && (
                <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4" onClick={() => setSelectedOrder(null)}>
                    <div className="bg-white rounded-xl shadow-2xl max-h-[90vh] w-full max-w-4xl overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                        <div className="flex justify-between items-center p-6 border-b border-gray-200 bg-gray-50 rounded-t-xl">
                            <h2 className="text-2xl font-bold text-gray-900">Order Details - #{selectedOrder.order_number}</h2>
                            <button
                                onClick={() => setSelectedOrder(null)}
                                className="text-gray-400 hover:text-gray-600 text-2xl font-bold p-2 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                                ×
                            </button>
                        </div>

                        <div className="p-6">
                            <div className="mb-8">
                                <h3 className="text-xl font-semibold text-gray-900 mb-4 border-b-2 border-gray-200 pb-2">Order Information</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                    <div className="flex flex-col gap-1 p-4 bg-gray-50 rounded-lg border border-gray-200">
                                        <strong className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Order Number</strong>
                                        <span className="text-gray-900">#{selectedOrder.order_number}</span>
                                    </div>
                                    <div className="flex flex-col gap-1 p-4 bg-gray-50 rounded-lg border border-gray-200">
                                        <strong className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Instructor</strong>
                                        <span className="text-gray-900">{selectedOrder.instructor_name}</span>
                                    </div>
                                    <div className="flex flex-col gap-1 p-4 bg-gray-50 rounded-lg border border-gray-200">
                                        <strong className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Order Date</strong>
                                        <span className="text-gray-900">{new Date(selectedOrder.created_at).toLocaleDateString()}</span>
                                    </div>
                                    <div className="flex flex-col gap-1 p-4 bg-gray-50 rounded-lg border border-gray-200">
                                        <strong className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</strong>
                                        <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-lg font-medium text-sm w-fit ${
                                            selectedOrder.status === 'pending' ? 'bg-yellow-100 text-yellow-800 border border-yellow-200' :
                                            selectedOrder.status === 'processing' ? 'bg-blue-100 text-blue-800 border border-blue-200' :
                                            selectedOrder.status === 'shipped' ? 'bg-purple-100 text-purple-800 border border-purple-200' :
                                            selectedOrder.status === 'delivered' ? 'bg-green-100 text-green-800 border border-green-200' :
                                            selectedOrder.status === 'cancelled' ? 'bg-red-100 text-red-800 border border-red-200' :
                                            'bg-gray-100 text-gray-800 border border-gray-200'
                                        }`}>
                                            {getStatusIcon(selectedOrder.status)}
                                            {capitalizeStatus(selectedOrder.status)}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="mb-8">
                                <h3 className="text-xl font-semibold text-gray-900 mb-4 border-b-2 border-gray-200 pb-2">Order Items</h3>
                                <div className="space-y-4">
                                    {selectedOrder.items?.map((item, index) => (
                                        <div key={index} className="grid grid-cols-1 md:grid-cols-3 gap-4 p-6 bg-white border border-gray-200 rounded-lg shadow-sm">
                                            <div className="space-y-2">
                                                <h4 className="text-lg font-semibold text-gray-900">{item.product_name}</h4>
                                                <p className="text-sm text-gray-600">Category: {item.category || item.product_category || 'N/A'}</p>
                                                <p className="text-sm text-gray-500 italic">Description: {item.description || item.product_description || 'N/A'}</p>
                                            </div>
                                            <div className="flex items-center justify-center">
                                                <span className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium">Qty: {item.quantity}</span>
                                            </div>
                                            <div className="flex flex-col items-end gap-1">
                                                <span className="text-sm text-gray-600">₹{item.price} each</span>
                                                <strong className="text-lg font-semibold text-gray-900">₹{(parseFloat(item.quantity) * parseFloat(item.price)).toFixed(2)}</strong>
                                            </div>
                                        </div>
                                    )) || <p className="text-center py-8 text-gray-500 italic">No items found for this order.</p>}
                                </div>
                            </div>

                            <div className="mb-8">
                                <h3 className="text-xl font-semibold text-gray-900 mb-4 border-b-2 border-gray-200 pb-2">Order Summary</h3>
                                <div className="bg-gray-50 rounded-lg p-4">
                                    <div className="flex justify-between items-center">
                                        <span className="text-lg font-medium text-gray-700">Total:</span>
                                        <span className="text-2xl font-bold text-gray-900">₹{parseFloat(selectedOrder.total_amount || selectedOrder.total).toFixed(2)}</span>
                                    </div>
                                </div>
                            </div>

                            {selectedOrder.notes && (
                                <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Notes</h3>
                                    <p className="text-gray-700 leading-relaxed">{selectedOrder.notes}</p>
                                </div>
                            )}
                        </div>

                        <div className="flex justify-end gap-4 p-6 border-t border-gray-200 bg-gray-50 rounded-b-xl">
                            <button
                                onClick={() => setSelectedOrder(null)}
                                className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors duration-200"
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