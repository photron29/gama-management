import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import { apiClient } from '../utils/api';
import LoadingAtom from '../components/LoadingAtom';
import {
    FaUser,
    FaEnvelope,
    FaPhone,
    FaMapMarkerAlt,
    FaCalendar,
    FaEdit,
    FaSave,
    FaTimes,
    FaShieldAlt,
    FaBuilding,
    FaIdCard
} from 'react-icons/fa';

const AdminProfile = () => {
    const { user, setUser } = useAuth();
    const [isEditing, setIsEditing] = useState(false);
    const [loading, setLoading] = useState(false);
    const [branches, setBranches] = useState([]);
    const [profileData, setProfileData] = useState({
        username: '',
        name: '',
        email: '',
        branch_id: ''
    });

    useEffect(() => {
        if (user) {
            setProfileData({
                username: user.username || '',
                name: user.name || '',
                email: user.email || '',
                branch_id: user.branch_id || ''
            });
        }
    }, [user]);

    // Fetch branches for dropdown
    useEffect(() => {
        const fetchBranches = async () => {
            try {
                const branchesData = await apiClient.getBranches();
                setBranches(branchesData.branches || []);
            } catch (error) {
                console.error('Error fetching branches:', error);
            }
        };
        fetchBranches();
    }, []);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setProfileData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSave = async () => {
        try {
            setLoading(true);
            
            // Update user profile via API
            const response = await apiClient.updateUser(profileData);
            
            // Update local user context
            setUser(prev => ({
                ...prev,
                ...response.user
            }));
            
            toast.success('Profile updated successfully');
            setIsEditing(false);
        } catch (error) {
            console.error('Error updating profile:', error);
            toast.error('Failed to update profile');
        } finally {
            setLoading(false);
        }
    };

    const handleCancel = () => {
        setProfileData({
            username: user.username || '',
            name: user.name || '',
            email: user.email || '',
            branch_id: user.branch_id || ''
        });
        setIsEditing(false);
    };

    const formatDate = (dateString) => {
        if (!dateString) return <span className="text-gray-500 dark:text-gray-400">Not provided</span>;
        return new Date(dateString).toLocaleDateString();
    };

    const formatValue = (value) => {
        if (!value) return <span className="text-gray-500 dark:text-gray-400">Not provided</span>;
        return value;
    };

    if (loading && !user) {
        return <LoadingAtom />;
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            <div className="max-w-4xl mx-auto p-6">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Admin Profile</h1>
                        <p className="text-gray-600 dark:text-gray-400">Manage your administrator account information</p>
                    </div>
                    <div className="flex items-center space-x-3">
                        {!isEditing ? (
                            <button
                                onClick={() => setIsEditing(true)}
                                className="bg-red-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-red-700 transition-all duration-200 flex items-center space-x-2 shadow-md hover:shadow-lg"
                            >
                                <FaEdit className="h-4 w-4" />
                                <span>Edit Profile</span>
                            </button>
                        ) : (
                            <div className="flex items-center space-x-3">
                                <button
                                    onClick={handleSave}
                                    disabled={loading}
                                    className="bg-green-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-700 transition-all duration-200 flex items-center space-x-2 shadow-md hover:shadow-lg disabled:opacity-50"
                                >
                                    <FaSave className="h-4 w-4" />
                                    <span>{loading ? 'Saving...' : 'Save Changes'}</span>
                                </button>
                                <button
                                    onClick={handleCancel}
                                    className="bg-gray-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-gray-700 transition-all duration-200 flex items-center space-x-2 shadow-md hover:shadow-lg"
                                >
                                    <FaTimes className="h-4 w-4" />
                                    <span>Cancel</span>
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Profile Information */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Account Information */}
                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center">
                            <FaUser className="h-5 w-5 mr-2 text-blue-600" />
                            Account Information
                        </h2>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Username</label>
                                {isEditing ? (
                                    <input
                                        type="text"
                                        name="username"
                                        value={profileData.username}
                                        onChange={handleInputChange}
                                        className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 text-gray-700 dark:text-white placeholder-gray-400 hover:border-gray-300 dark:bg-gray-700"
                                        placeholder="Enter username"
                                    />
                                ) : (
                                    <p className="text-gray-900 dark:text-white text-lg">{formatValue(profileData.username)}</p>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Full Name</label>
                                {isEditing ? (
                                    <input
                                        type="text"
                                        name="name"
                                        value={profileData.name}
                                        onChange={handleInputChange}
                                        className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 text-gray-700 dark:text-white placeholder-gray-400 hover:border-gray-300 dark:bg-gray-700"
                                        placeholder="Enter full name"
                                    />
                                ) : (
                                    <p className="text-gray-900 dark:text-white text-lg">{formatValue(profileData.name)}</p>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Email Address</label>
                                {isEditing ? (
                                    <input
                                        type="email"
                                        name="email"
                                        value={profileData.email}
                                        onChange={handleInputChange}
                                        className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 text-gray-700 dark:text-white placeholder-gray-400 hover:border-gray-300 dark:bg-gray-700"
                                        placeholder="Enter your email"
                                    />
                                ) : (
                                    <p className="text-gray-900 dark:text-white text-lg">{formatValue(profileData.email)}</p>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Branch</label>
                                {isEditing ? (
                                    <select
                                        name="branch_id"
                                        value={profileData.branch_id}
                                        onChange={handleInputChange}
                                        className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 text-gray-700 dark:text-white hover:border-gray-300 dark:bg-gray-700"
                                    >
                                        <option value="">Select branch</option>
                                        {branches.map(branch => (
                                            <option key={branch.id} value={branch.id}>
                                                {branch.name}
                                            </option>
                                        ))}
                                    </select>
                                ) : (
                                    <p className="text-gray-900 dark:text-white text-lg">
                                        {branches.find(b => b.id === profileData.branch_id)?.name || <span className="text-gray-500 dark:text-gray-400">Not assigned</span>}
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* System Information */}
                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center">
                            <FaShieldAlt className="h-5 w-5 mr-2 text-green-600" />
                            System Information
                        </h2>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Role</label>
                                <div className="flex items-center space-x-2">
                                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400">
                                        <FaShieldAlt className="h-3 w-3 mr-1" />
                                        Administrator
                                    </span>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Account Status</label>
                                <div className="flex items-center space-x-2">
                                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400">
                                        <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                                        Active
                                    </span>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Member Since</label>
                                <p className="text-gray-900 dark:text-white text-lg">
                                    {user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'Unknown'}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Account Statistics */}
                <div className="mt-8 bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center">
                        <FaIdCard className="h-5 w-5 mr-2 text-purple-600" />
                        Account Statistics
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
                            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-800 rounded-full flex items-center justify-center mx-auto mb-3">
                                <FaCalendar className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Member Since</h3>
                            <p className="text-gray-600 dark:text-gray-400">
                                {user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'Unknown'}
                            </p>
                        </div>
                        <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-xl">
                            <div className="w-12 h-12 bg-green-100 dark:bg-green-800 rounded-full flex items-center justify-center mx-auto mb-3">
                                <FaBuilding className="h-6 w-6 text-green-600 dark:text-green-400" />
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Branch</h3>
                            <p className="text-gray-600 dark:text-gray-400">
                                {branches.find(b => b.id === profileData.branch_id)?.name || 'Not assigned'}
                            </p>
                        </div>
                        <div className="text-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-xl">
                            <div className="w-12 h-12 bg-purple-100 dark:bg-purple-800 rounded-full flex items-center justify-center mx-auto mb-3">
                                <FaShieldAlt className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Role</h3>
                            <p className="text-gray-600 dark:text-gray-400">Administrator</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminProfile;
