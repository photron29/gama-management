import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { apiClient } from '../utils/api';
import {
    FaUsers,
    FaUserTie,
    FaBuilding,
    FaRupeeSign,
    FaChartLine,
    FaCalendarAlt,
    FaMoneyBillWave
} from 'react-icons/fa';

const Dashboard = () => {
    const { user } = useAuth();
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showAllAttendance, setShowAllAttendance] = useState(false);
    const [showAllFees, setShowAllFees] = useState(false);

    useEffect(() => {
        fetchDashboardStats();
    }, []);

    const fetchDashboardStats = async () => {
        try {
            const data = await apiClient.getDashboardStats();
            setStats(data);
        } catch (error) {
            console.error('Error fetching dashboard stats:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="dashboard-loading">
                <div className="loading-spinner"></div>
                <p>Loading dashboard...</p>
            </div>
        );
    }

    const StatCard = ({ title, value, icon: Icon, color, subtitle }) => (
        <div className={`stat-card ${color}`}>
            <div className="stat-icon">
                <Icon />
            </div>
            <div className="stat-content">
                <h3>{value}</h3>
                <p>{title}</p>
                {subtitle && <small>{subtitle}</small>}
            </div>
        </div>
    );

    return (
        <div className="dashboard">
            <div className="dashboard-header">
                <h1>Welcome back, {user?.first_name}!</h1>
                <p>Here's what's happening at your martial arts school.</p>
            </div>

            <div className="stats-grid">
                <StatCard
                    title="Total Students"
                    value={stats?.students?.total_students || 0}
                    icon={FaUsers}
                    color="blue"
                    subtitle={`${stats?.students?.active_students || 0} active`}
                />

                {user?.role === 'admin' && (
                    <>
                        <StatCard
                            title="Instructors"
                            value={stats?.instructors?.total_instructors || 0}
                            icon={FaUserTie}
                            color="green"
                            subtitle={`${stats?.instructors?.active_instructors || 0} active`}
                        />
                        <StatCard
                            title="Branches"
                            value={stats?.branches?.total_branches || 0}
                            icon={FaBuilding}
                            color="purple"
                        />
                    </>
                )}

                <StatCard
                    title="Total Fees"
                    value={stats?.fees?.total_fees || 0}
                    icon={FaRupeeSign}
                    color="red"
                    subtitle={`₹${stats?.fees?.total_collected || 0} collected`}
                />
            </div>

            <div className="dashboard-content">
                <div className="dashboard-section">
                    <h2>Recent Attendance</h2>
                    <div className="recent-list">
                        {stats?.recent_attendance?.length > 0 ? (
                            <>
                                {(showAllAttendance ? stats.recent_attendance : stats.recent_attendance.slice(0, 5)).map((record) => (
                                    <div key={record.id} className="recent-item">
                                        <div className="recent-info">
                                            <span className="student-name">
                                                {record.first_name} {record.last_name}
                                            </span>
                                            <span className="branch-name">{record.branch_name}</span>
                                        </div>
                                        <div className={`status-badge ${record.status}`}>
                                            {record.status}
                                        </div>
                                        <div className="recent-date">
                                            {new Date(record.class_date).toLocaleDateString()}
                                        </div>
                                    </div>
                                ))}
                                {stats.recent_attendance.length > 5 && (
                                    <button
                                        className="btn btn-secondary show-more-btn"
                                        onClick={() => setShowAllAttendance(!showAllAttendance)}
                                    >
                                        {showAllAttendance ? 'Show Less' : `Show More (${stats.recent_attendance.length - 5} more)`}
                                    </button>
                                )}
                            </>
                        ) : (
                            <p className="no-data">No recent attendance records</p>
                        )}
                    </div>
                </div>

                <div className="dashboard-section">
                    <h2>Recent Fees</h2>
                    <div className="recent-list">
                        {stats?.recent_fees?.length > 0 ? (
                            <>
                                {(showAllFees ? stats.recent_fees : stats.recent_fees.slice(0, 5)).map((fee) => (
                                    <div key={fee.id} className="recent-item">
                                        <div className="recent-info">
                                            <span className="student-name">
                                                {fee.first_name} {fee.last_name}
                                            </span>
                                            <span className="fee-type">{fee.fee_type}</span>
                                        </div>
                                        <div className="fee-amount">₹{fee.amount}</div>
                                        <div className={`status-badge ${fee.status}`}>
                                            {fee.status}
                                        </div>
                                    </div>
                                ))}
                                {stats.recent_fees.length > 5 && (
                                    <button
                                        className="btn btn-secondary show-more-btn"
                                        onClick={() => setShowAllFees(!showAllFees)}
                                    >
                                        {showAllFees ? 'Show Less' : `Show More (${stats.recent_fees.length - 5} more)`}
                                    </button>
                                )}
                            </>
                        ) : (
                            <p className="no-data">No recent fee records</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
