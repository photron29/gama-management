import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FaUsers, FaUserGraduate, FaChalkboardTeacher, FaMoneyBillWave, FaCalendar, FaClock, FaCheckCircle, FaExclamationTriangle, FaClipboardList } from 'react-icons/fa';
import { FaArrowTrendUp, FaArrowTrendDown } from 'react-icons/fa6';
import { apiClient } from '../utils/api';
import LoadingAtom from '../components/LoadingAtom';

const Dashboard = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [stats, setStats] = useState({});
    const [recentAttendance, setRecentAttendance] = useState([]);
    const [recentFees, setRecentFees] = useState([]);
    const [loading, setLoading] = useState(true);

    // Utility function to format currency in INR
    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(amount);
    };

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        try {
            // For instructors, get personalized data based on their assigned branches
            const params = user?.role === 'instructor' ? { instructor_id: user.id } : {};

            const [statsData, attendanceData, feesData] = await Promise.all([
                apiClient.getDashboardStats(params).catch(() => ({})),
                apiClient.getAttendance({ ...params, limit: 5 }).catch(() => ({ attendance: [] })),
                apiClient.getFees(params).catch(() => ({ fees: [] }))
            ]);

            setStats(statsData);
            setRecentAttendance(attendanceData.attendance || []);
            setRecentFees(feesData.fees || []);
        } catch (error) {
            console.error('Error fetching dashboard data:', error);
        } finally {
            setLoading(false);
        }
    };

    // Get stat cards based on user role
    const getStatCards = () => {
        if (user?.role === 'instructor') {
            return [
                {
                    title: 'My Students',
                    value: stats.students?.total_students || 0,
                    icon: FaUserGraduate,
                    color: 'from-blue-500 to-blue-600',
                    bgColor: 'bg-blue-50 dark:bg-blue-900/20',
                    iconColor: 'text-blue-600 dark:text-blue-400',
                    change: '+12%',
                    changeType: 'positive'
                },
                {
                    title: 'Today\'s Attendance',
                    value: stats.attendance?.present_count || 0,
                    icon: FaCalendar,
                    color: 'from-green-500 to-green-600',
                    bgColor: 'bg-green-50 dark:bg-green-900/20',
                    iconColor: 'text-green-600 dark:text-green-400',
                    change: '+8%',
                    changeType: 'positive'
                },
                {
                    title: 'Pending Fees',
                    value: stats.fees?.pending_fees || 0,
                    icon: FaMoneyBillWave,
                    color: 'from-yellow-500 to-yellow-600',
                    bgColor: 'bg-yellow-50',
                    iconColor: 'text-yellow-600',
                    change: '-5%',
                    changeType: 'negative'
                },
                {
                    title: 'My Orders',
                    value: stats.my_orders || 0,
                    icon: FaClipboardList,
                    color: 'from-purple-500 to-purple-600',
                    bgColor: 'bg-purple-50 dark:bg-purple-900/20',
                    iconColor: 'text-purple-600 dark:text-purple-400',
                    change: '+3%',
                    changeType: 'positive'
                }
            ];
        } else {
            return [
                {
                    title: 'Total Students',
                    value: stats.students?.total_students || 0,
                    icon: FaUserGraduate,
                    color: 'from-blue-500 to-blue-600',
                    bgColor: 'bg-blue-50 dark:bg-blue-900/20',
                    iconColor: 'text-blue-600 dark:text-blue-400',
                    change: '+12%',
                    changeType: 'positive'
                },
                {
                    title: 'Total Instructors',
                    value: stats.instructors?.total_instructors || 0,
                    icon: FaChalkboardTeacher,
                    color: 'from-green-500 to-green-600',
                    bgColor: 'bg-green-50 dark:bg-green-900/20',
                    iconColor: 'text-green-600 dark:text-green-400',
                    change: '+8%',
                    changeType: 'positive'
                },
                {
                    title: 'Total Branches',
                    value: stats.branches?.total_branches || 0,
                    icon: FaUsers,
                    color: 'from-purple-500 to-purple-600',
                    bgColor: 'bg-purple-50 dark:bg-purple-900/20',
                    iconColor: 'text-purple-600 dark:text-purple-400',
                    change: '+2%',
                    changeType: 'positive'
                },
                {
                    title: 'Pending Orders',
                    value: stats.pending_orders || 0,
                    icon: FaClipboardList,
                    color: 'from-yellow-500 to-yellow-600',
                    bgColor: 'bg-yellow-50',
                    iconColor: 'text-yellow-600',
                    change: '-5%',
                    changeType: 'negative'
                }
            ];
        }
    };

    if (loading) {
        return <LoadingAtom />;
    }

    const statCards = getStatCards();

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6">
            <div className="max-w-7xl mx-auto">
                {/* Welcome Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                        Welcome back, {user?.name?.split(' ')[0] || user?.username || 'User'} Ji!
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400">
                        {user?.role === 'instructor'
                            ? 'Here\'s an overview of your students and activities'
                            : 'Here\'s what\'s happening in your martial arts school'
                        }
                    </p>
                </div>

                {/* Quick Actions */}
                <div className="mb-8">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">Quick Actions</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {user?.role === 'instructor' ? (
                            // Instructor quick actions
                            <>
                                <button
                                    onClick={() => navigate('/students')}
                                    className="flex items-center justify-center p-6 bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 hover:shadow-xl hover:border-blue-200 transition-all duration-300 group cursor-pointer"
                                >
                                    <div className="w-12 h-12 bg-blue-50 dark:bg-blue-900/20 rounded-xl flex items-center justify-center group-hover:bg-blue-100 dark:group-hover:bg-blue-800/30 transition-colors">
                                        <FaUserGraduate className="h-6 w-6 text-blue-600" />
                                    </div>
                                    <div className="ml-4 text-left">
                                        <p className="font-medium text-gray-900">View Students</p>
                                        <p className="text-sm text-gray-500">Manage your students</p>
                                    </div>
                                </button>

                                <button
                                    onClick={() => navigate('/attendance')}
                                    className="flex items-center justify-center p-6 bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 hover:shadow-xl hover:border-blue-200 transition-all duration-300 group cursor-pointer"
                                >
                                    <div className="w-12 h-12 bg-green-50 dark:bg-green-900/20 rounded-xl flex items-center justify-center group-hover:bg-green-100 dark:group-hover:bg-green-800/30 transition-colors">
                                        <FaClipboardList className="h-6 w-6 text-green-600" />
                                    </div>
                                    <div className="ml-4 text-left">
                                        <p className="font-medium text-gray-900">Mark Attendance</p>
                                        <p className="text-sm text-gray-500">Record today's attendance</p>
                                    </div>
                                </button>

                                <button
                                    onClick={() => navigate('/fees')}
                                    className="flex items-center justify-center p-6 bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 hover:shadow-xl hover:border-blue-200 transition-all duration-300 group cursor-pointer"
                                >
                                    <div className="w-12 h-12 bg-purple-50 dark:bg-purple-900/20 rounded-xl flex items-center justify-center group-hover:bg-purple-100 dark:group-hover:bg-purple-800/30 transition-colors">
                                        <FaMoneyBillWave className="h-6 w-6 text-purple-600" />
                                    </div>
                                    <div className="ml-4 text-left">
                                        <p className="font-medium text-gray-900">Collect Fees</p>
                                        <p className="text-sm text-gray-500">Process fee payments</p>
                                    </div>
                                </button>
                            </>
                        ) : (
                            // Admin quick actions
                            <>
                                <button
                                    onClick={() => navigate('/students')}
                                    className="flex items-center justify-center p-6 bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 hover:shadow-xl hover:border-blue-200 transition-all duration-300 group cursor-pointer"
                                >
                                    <div className="w-12 h-12 bg-blue-50 dark:bg-blue-900/20 rounded-xl flex items-center justify-center group-hover:bg-blue-100 dark:group-hover:bg-blue-800/30 transition-colors">
                                        <FaUserGraduate className="h-6 w-6 text-blue-600" />
                                    </div>
                                    <div className="ml-4 text-left">
                                        <p className="font-medium text-gray-900">Add Student</p>
                                        <p className="text-sm text-gray-500">Register new student</p>
                                    </div>
                                </button>

                                <button
                                    onClick={() => navigate('/attendance')}
                                    className="flex items-center justify-center p-6 bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 hover:shadow-xl hover:border-blue-200 transition-all duration-300 group cursor-pointer"
                                >
                                    <div className="w-12 h-12 bg-green-50 dark:bg-green-900/20 rounded-xl flex items-center justify-center group-hover:bg-green-100 dark:group-hover:bg-green-800/30 transition-colors">
                                        <FaClipboardList className="h-6 w-6 text-green-600" />
                                    </div>
                                    <div className="ml-4 text-left">
                                        <p className="font-medium text-gray-900">Mark Attendance</p>
                                        <p className="text-sm text-gray-500">Record today's attendance</p>
                                    </div>
                                </button>

                                <button
                                    onClick={() => navigate('/fees')}
                                    className="flex items-center justify-center p-6 bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 hover:shadow-xl hover:border-blue-200 transition-all duration-300 group cursor-pointer"
                                >
                                    <div className="w-12 h-12 bg-purple-50 dark:bg-purple-900/20 rounded-xl flex items-center justify-center group-hover:bg-purple-100 dark:group-hover:bg-purple-800/30 transition-colors">
                                        <FaMoneyBillWave className="h-6 w-6 text-purple-600" />
                                    </div>
                                    <div className="ml-4 text-left">
                                        <p className="font-medium text-gray-900">Collect Fees</p>
                                        <p className="text-sm text-gray-500">Process fee payments</p>
                                    </div>
                                </button>
                            </>
                        )}
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    {statCards.map((card, index) => (
                        <div key={index} className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 border border-gray-100 dark:border-gray-700 hover:shadow-xl transition-all duration-300">
                            <div className="flex items-center justify-between mb-4">
                                <div className={`w-12 h-12 ${card.bgColor} rounded-xl flex items-center justify-center`}>
                                    <card.icon className={`h-6 w-6 ${card.iconColor}`} />
                                </div>
                                <div className="flex items-center space-x-1">
                                    {card.changeType === 'positive' ? (
                                        <FaArrowTrendUp className="h-4 w-4 text-green-500" />
                                    ) : (
                                        <FaArrowTrendDown className="h-4 w-4 text-red-500" />
                                    )}
                                    <span className={`text-sm font-medium ${card.changeType === 'positive' ? 'text-green-600' : 'text-red-600'
                                        }`}>
                                        {card.change}
                                    </span>
                                </div>
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-gray-900 dark:text-white mb-1">{card.value}</p>
                                <p className="text-sm text-gray-600 dark:text-gray-400">{card.title}</p>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Recent Activity */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                    {/* Recent Attendance */}
                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 border border-gray-100 dark:border-gray-700">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Recent Attendance</h3>
                            <button
                                onClick={() => navigate('/attendance')}
                                className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                            >
                                View All
                            </button>
                        </div>
                        <div className="space-y-4">
                            {recentAttendance.length > 0 ? (
                                recentAttendance.map((record, index) => (
                                    <div key={index} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-xl">
                                        <div className="flex items-center space-x-3">
                                            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                                                <FaUserGraduate className="h-5 w-5 text-blue-600" />
                                            </div>
                                            <div>
                                                <p className="font-medium text-gray-900 dark:text-white">
                                                    {record.student_name || 'Unknown Student'}
                                                </p>
                                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                                    {record.date || 'Today'}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            {record.status === 'present' ? (
                                                <FaCheckCircle className="h-5 w-5 text-green-500" />
                                            ) : (
                                                <FaExclamationTriangle className="h-5 w-5 text-red-500" />
                                            )}
                                            <span className={`text-sm font-medium ${record.status === 'present' ? 'text-green-600' : 'text-red-600'
                                                }`}>
                                                {record.status === 'present' ? 'Present' : 'Absent'}
                                            </span>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="text-center py-8">
                                    <FaCalendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                                    <p className="text-gray-500 dark:text-gray-400">No recent attendance records</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Recent Fees */}
                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 border border-gray-100 dark:border-gray-700">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Recent Fees</h3>
                            <button
                                onClick={() => navigate('/fees')}
                                className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                            >
                                View All
                            </button>
                        </div>
                        <div className="space-y-4">
                            {recentFees.length > 0 ? (
                                recentFees.map((fee, index) => (
                                    <div key={index} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-xl">
                                        <div className="flex items-center space-x-3">
                                            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                                                <FaMoneyBillWave className="h-5 w-5 text-green-600" />
                                            </div>
                                            <div>
                                                <p className="font-medium text-gray-900 dark:text-white">
                                                    {fee.student_name || 'Unknown Student'}
                                                </p>
                                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                                    {fee.month || 'Current Month'}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-semibold text-gray-900 dark:text-white">
                                                {formatCurrency(fee.amount || 0)}
                                            </p>
                                            <p className={`text-sm font-medium ${fee.status === 'paid' ? 'text-green-600' : 'text-red-600'
                                                }`}>
                                                {fee.status === 'paid' ? 'Paid' : 'Pending'}
                                            </p>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="text-center py-8">
                                    <FaMoneyBillWave className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                                    <p className="text-gray-500 dark:text-gray-400">No recent fee records</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default Dashboard;
