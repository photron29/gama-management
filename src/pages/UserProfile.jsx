import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import { apiClient } from '../utils/api';
import LoadingAtom from '../components/LoadingAtom';
import AdminProfile from './AdminProfile';
import {
    FaUser,
    FaPhone,
    FaEdit,
    FaSave,
    FaTimes,
    FaShieldAlt,
    FaGraduationCap,
    FaBuilding,
    FaIdCard,
    FaCalendar
} from 'react-icons/fa';

// Helper function to safely initialize state from the user object
const initializeProfileData = (user) => ({
    // Use optional chaining (?.) and default to empty string ('')
    // This prevents errors if 'user' is null/undefined on initial render
    first_name: user?.first_name || '',
    last_name: user?.last_name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    address: user?.address || '',
    date_of_birth: user?.date_of_birth || '',
    belt_level: user?.belt_level || '',
    branch_id: user?.branch_id || '',
    specialization: user?.specialization || '',
    certification_date: user?.certification_date || '',
    emergency_contact_name: user?.emergency_contact_name || '',
    emergency_contact_phone: user?.emergency_contact_phone || ''
});

const UserProfile = () => {
    // Assuming useAuth returns { user, setUser, loading }
    const { user, setUser, loading: authLoading } = useAuth();
    
    const [isEditing, setIsEditing] = useState(false);
    const [loading, setLoading] = useState(false);
    const [branches, setBranches] = useState([]);
    
    // 🎯 FIX 1: Initialize local state directly using the helper function.
    // This is the fastest way to set the initial state if 'user' is available right away.
    const [profileData, setProfileData] = useState(() => initializeProfileData(user));

    // 🎯 FIX 2: useEffect to synchronize local state whenever the global 'user' object changes.
    // This handles the data loading later (e.g., from localStorage check/API fetch in AuthContext).
    useEffect(() => {
        if (user) {
            setProfileData(initializeProfileData(user));
        }
        // NOTE: We only need to run this when the user object changes.
    }, [user]);

    // Fetch branches for dropdown (remains unchanged)
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
        // Prevent saving if the user object isn't fully loaded yet
        if (!user) return;

        try {
            setLoading(true);
            
            let updatedData;
            
            if (user.role === 'instructor') {
                // Instructors can only update personal details
                const personalData = {
                    first_name: profileData.first_name,
                    last_name: profileData.last_name,
                    email: profileData.email,
                    phone: profileData.phone,
                    address: profileData.address,
                    date_of_birth: profileData.date_of_birth,
                    emergency_contact_name: profileData.emergency_contact_name,
                    emergency_contact_phone: profileData.emergency_contact_phone
                };
                // API call: Returns the complete updated user object
                const response = await apiClient.updateOwnProfile(personalData);
                updatedData = response.user;
            } else if (user.role === 'admin') {
                // Admins can update all fields
                const response = await apiClient.updateInstructor(user.id, profileData);
                updatedData = response.instructor;
            }
            
            // Update local user context with the complete user data from the API
            setUser(updatedData);
            
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
        // Revert local state to the current context state on cancel
        setProfileData(initializeProfileData(user));
        setIsEditing(false);
    };

    const formatDate = (dateString) => {
        if (!dateString) return <span className="text-gray-500 dark:text-gray-400">Not provided</span>;
        // Handle common date formats
        const date = new Date(dateString);
        // Check if the date is valid before formatting
        if (isNaN(date.getTime())) return dateString; 
        return date.toLocaleDateString();
    };

    const formatValue = (value) => {
        if (!value) return <span className="text-gray-500 dark:text-gray-400">Not provided</span>;
        return value;
    };

    // Use the combined loading state
    if (authLoading || loading) {
        return <LoadingAtom />;
    }

    // This handles the case where the context is done loading but found no user
    if (!user) {
        // Redirect to login or show an error
        return <p>Error: User data could not be loaded.</p>;
    }

    // Render admin profile for admins
    if (user.role === 'admin') {
        return <AdminProfile />;
    }

    // If the user object is available but fields are still missing, 
    // it means your AuthContext's initial fetch is incomplete.
    // The component structure below correctly uses profileData.

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            <div className="max-w-4xl mx-auto p-6">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">User Profile</h1>
                        <p className="text-gray-600 dark:text-gray-400">Manage your account information and preferences</p>
                    </div>
                    <div className="flex items-center space-x-3">
                        {!isEditing ? (
                            <button
                                onClick={() => setIsEditing(true)}
                                className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-all duration-200 flex items-center space-x-2 shadow-md hover:shadow-lg"
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
                    {/* Personal Information */}
                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center">
                            <FaUser className="h-5 w-5 mr-2 text-blue-600" />
                            Personal Information
                        </h2>
                        <div className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">First Name</label>
                                    {isEditing ? (
                                        <input
                                            type="text"
                                            name="first_name"
                                            value={profileData.first_name}
                                            onChange={handleInputChange}
                                            className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 text-gray-700 dark:text-white placeholder-gray-400 hover:border-gray-300 dark:bg-gray-700"
                                            placeholder="Enter your first name"
                                        />
                                    ) : (
                                        <p className="text-gray-900 dark:text-white text-lg">{formatValue(profileData.first_name)}</p>
                                    )}
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Last Name</label>
                                    {isEditing ? (
                                        <input
                                            type="text"
                                            name="last_name"
                                            value={profileData.last_name}
                                            onChange={handleInputChange}
                                            className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 text-gray-700 dark:text-white placeholder-gray-400 hover:border-gray-300 dark:bg-gray-700"
                                            placeholder="Enter your last name"
                                        />
                                    ) : (
                                        <p className="text-gray-900 dark:text-white text-lg">{formatValue(profileData.last_name)}</p>
                                    )}
                                </div>
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
                                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Phone Number</label>
                                {isEditing ? (
                                    <input
                                        type="tel"
                                        name="phone"
                                        value={profileData.phone}
                                        onChange={handleInputChange}
                                        className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 text-gray-700 dark:text-white placeholder-gray-400 hover:border-gray-300 dark:bg-gray-700"
                                        placeholder="Enter your phone number"
                                    />
                                ) : (
                                    <p className="text-gray-900 dark:text-white text-lg">{formatValue(profileData.phone)}</p>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Date of Birth</label>
                                {isEditing ? (
                                    <input
                                        type="date"
                                        name="date_of_birth"
                                        value={profileData.date_of_birth}
                                        onChange={handleInputChange}
                                        className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 text-gray-700 dark:text-white hover:border-gray-300 dark:bg-gray-700"
                                    />
                                ) : (
                                    <p className="text-gray-900 dark:text-white text-lg">{profileData.date_of_birth ? formatDate(profileData.date_of_birth) : <span className="text-gray-500 dark:text-gray-400">Not provided</span>}</p>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Address</label>
                                {isEditing ? (
                                    <textarea
                                        name="address"
                                        value={profileData.address}
                                        onChange={handleInputChange}
                                        rows={3}
                                        className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 text-gray-700 dark:text-white placeholder-gray-400 hover:border-gray-300 dark:bg-gray-700 resize-none"
                                        placeholder="Enter your address"
                                    />
                                ) : (
                                    <p className="text-gray-900 dark:text-white text-lg">{formatValue(profileData.address)}</p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Professional Information */}
                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center">
                            <FaShieldAlt className="h-5 w-5 mr-2 text-green-600" />
                            Professional Information
                        </h2>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Role</label>
                                <div className="flex items-center space-x-2">
                                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                                        user.role === 'admin' 
                                            ? 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400' 
                                            : 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400'
                                    }`}>
                                        <FaShieldAlt className="h-3 w-3 mr-1" />
                                        {user.role?.charAt(0).toUpperCase() + user.role?.slice(1) || 'Not assigned'}
                                    </span>
                                </div>
                            </div>

                            {(user.role === 'instructor' || user.role === 'admin') && (
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Belt Level</label>
                                    {isEditing ? (
                                        <select
                                            name="belt_level"
                                            value={profileData.belt_level}
                                            onChange={handleInputChange}
                                            className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 text-gray-700 dark:text-white hover:border-gray-300 dark:bg-gray-700"
                                        >
                                            <option value="">Select belt level</option>
                                            <option value="White Belt">White Belt</option>
                                            <option value="Yellow Belt">Yellow Belt</option>
                                            <option value="Orange Belt">Orange Belt</option>
                                            <option value="Green Belt">Green Belt</option>
                                            <option value="Blue Belt">Blue Belt</option>
                                            <option value="Brown Belt">Brown Belt</option>
                                            <option value="Black Belt">Black Belt</option>
                                            <option value="1st Dan">1st Dan</option>
                                            <option value="2nd Dan">2nd Dan</option>
                                            <option value="3rd Dan">3rd Dan</option>
                                            <option value="4th Dan">4th Dan</option>
                                            <option value="5th Dan">5th Dan</option>
                                        </select>
                                    ) : (
                                        <div className="flex items-center space-x-2">
                                            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400">
                                                <FaGraduationCap className="h-3 w-3 mr-1" />
                                                {profileData.belt_level || 'Not assigned'}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            )}

                            {(user.role === 'instructor' || user.role === 'admin') && (
                                <>
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
                                                {branches.find(b => b.id === profileData.branch_id)?.name || 'Not assigned'}
                                            </p>
                                        )}
                                    </div>

                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Specialization</label>
                                        {isEditing ? (
                                            <input
                                                type="text"
                                                name="specialization"
                                                value={profileData.specialization}
                                                onChange={handleInputChange}
                                                className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 text-gray-700 dark:text-white placeholder-gray-400 hover:border-gray-300 dark:bg-gray-700"
                                                placeholder="Enter your specialization"
                                            />
                                        ) : (
                                            <p className="text-gray-900 dark:text-white text-lg">{profileData.specialization || 'Not specified'}</p>
                                        )}
                                    </div>

                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Certification Date</label>
                                        {isEditing ? (
                                            <input
                                                type="date"
                                                name="certification_date"
                                                value={profileData.certification_date}
                                                onChange={handleInputChange}
                                                className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 text-gray-700 dark:text-white hover:border-gray-300 dark:bg-gray-700"
                                            />
                                        ) : (
                                            <p className="text-gray-900 dark:text-white text-lg">{formatDate(profileData.certification_date)}</p>
                                        )}
                                    </div>
                                </>
                            )}

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Account Status</label>
                                <div className="flex items-center space-x-2">
                                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400">
                                        <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                                        Active
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Emergency Contact Information */}
                <div className="mt-8 bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center">
                        <FaPhone className="h-5 w-5 mr-2 text-red-600" />
                        Emergency Contact Information
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Emergency Contact Name</label>
                            {isEditing ? (
                                <input
                                    type="text"
                                    name="emergency_contact_name"
                                    value={profileData.emergency_contact_name}
                                    onChange={handleInputChange}
                                    className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 text-gray-700 dark:text-white placeholder-gray-400 hover:border-gray-300 dark:bg-gray-700"
                                    placeholder="Enter emergency contact name"
                                />
                            ) : (
                                <p className="text-gray-900 dark:text-white text-lg">{formatValue(profileData.emergency_contact_name)}</p>
                            )}
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Emergency Contact Phone</label>
                            {isEditing ? (
                                <input
                                    type="tel"
                                    name="emergency_contact_phone"
                                    value={profileData.emergency_contact_phone}
                                    onChange={handleInputChange}
                                    className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 text-gray-700 dark:text-white placeholder-gray-400 hover:border-gray-300 dark:bg-gray-700"
                                    placeholder="Enter emergency contact phone"
                                />
                            ) : (
                                <p className="text-gray-900 dark:text-white text-lg">{formatValue(profileData.emergency_contact_phone)}</p>
                            )}
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
                                <FaGraduationCap className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Belt Level</h3>
                            <p className="text-gray-600 dark:text-gray-400">{profileData.belt_level || 'Not assigned'}</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default UserProfile;