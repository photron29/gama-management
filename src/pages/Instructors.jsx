import React, { useState, useEffect } from 'react';
import { FaPlus, FaSearch, FaFilter, FaEye, FaEdit, FaTrash, FaUser, FaMapMarkerAlt, FaPhone, FaEnvelope } from 'react-icons/fa';
import { apiClient } from '../utils/api';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';
import { getInstructorBeltRanks, formatBeltRank } from '../utils/beltRanks';

const Instructors = () => {
    const [instructors, setInstructors] = useState([]);
    const [branches, setBranches] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [showFilters, setShowFilters] = useState(false);
    const [filters, setFilters] = useState({
        beltLevel: '',
        branch: ''
    });
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [editingInstructor, setEditingInstructor] = useState(null);
    const [viewingInstructor, setViewingInstructor] = useState(null);
    const [deletingInstructorId, setDeletingInstructorId] = useState(null);
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        password: '',
        first_name: '',
        last_name: '',
        phone: '',
        address: '',
        date_of_birth: '',
        belt_level: '',
        specialization: '',
        certification_date: '',
        emergency_contact_name: '',
        emergency_contact_phone: '',
        branch_id: ''
    });

    useEffect(() => {
        fetchInstructors();
        fetchBranches();
    }, []);

    const fetchInstructors = async () => {
        try {
            const response = await apiClient.getInstructors();
            setInstructors(response.instructors || []);
        } catch (error) {
            console.error('Error fetching instructors:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchBranches = async () => {
        try {
            const response = await apiClient.getBranches();
            setBranches(response.branches || []);
        } catch (error) {
            console.error('Error fetching branches:', error);
        }
    };

    const handleNewInstructor = () => {
        setEditingInstructor(null);
        setFormData({
            username: '',
            email: '',
            password: '',
            first_name: '',
            last_name: '',
            phone: '',
            address: '',
            date_of_birth: '',
            belt_level: '',
            specialization: '',
            certification_date: '',
            emergency_contact_name: '',
            emergency_contact_phone: '',
            branch_id: ''
        });
        setIsModalOpen(true);
    };

    const handleEditInstructor = (instructor) => {
        setEditingInstructor(instructor);
        setFormData({
            username: instructor.username || '',
            email: instructor.email || '',
            password: '',
            first_name: instructor.first_name || '',
            last_name: instructor.last_name || '',
            phone: instructor.phone || '',
            address: instructor.address || '',
            date_of_birth: instructor.date_of_birth || '',
            belt_level: instructor.belt_level || '',
            specialization: instructor.specialization || '',
            certification_date: instructor.certification_date || '',
            emergency_contact_name: instructor.emergency_contact_name || '',
            emergency_contact_phone: instructor.emergency_contact_phone || '',
            branch_id: instructor.branch_id || ''
        });
        setIsModalOpen(true);
    };

    const handleViewInstructor = (instructor) => {
        setViewingInstructor(instructor);
        setIsViewModalOpen(true);
    };

    const handleDeleteInstructor = (instructorId) => {
        setDeletingInstructorId(instructorId);
        setIsDeleteDialogOpen(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingInstructor) {
                await apiClient.updateInstructor(editingInstructor.id, formData);
            } else {
                await apiClient.createInstructor(formData);
            }
            setIsModalOpen(false);
            fetchInstructors();
        } catch (error) {
            console.error('Error saving instructor:', error);
        }
    };

    const handleDelete = async () => {
        try {
            await apiClient.deleteInstructor(deletingInstructorId);
            setIsDeleteDialogOpen(false);
            fetchInstructors();
        } catch (error) {
            console.error('Error deleting instructor:', error);
        }
    };

    const handleFilterChange = (key, value) => {
        setFilters(prev => ({ ...prev, [key]: value }));
    };

    const filteredInstructors = instructors.filter(instructor => {
        const matchesSearch = !searchTerm || 
            instructor.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            instructor.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            instructor.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            instructor.phone?.includes(searchTerm);
        
        const matchesBelt = !filters.beltLevel || instructor.belt_level === filters.beltLevel;
        const matchesBranch = !filters.branch || instructor.branch_id === filters.branch;
        
        return matchesSearch && matchesBelt && matchesBranch;
    });

    const sortedInstructors = filteredInstructors.sort((a, b) => {
        return a.first_name?.localeCompare(b.first_name) || 0;
    });

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading instructors...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Instructor Management</h1>
                        <p className="text-gray-600 dark:text-gray-400">Manage your martial arts instructors and their profiles</p>
                    </div>
                    <button
                        className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-all duration-200 flex items-center space-x-2 shadow-md hover:shadow-lg"
                        onClick={handleNewInstructor}
                    >
                        <FaPlus className="h-4 w-4" />
                        <span>Add Instructor</span>
                    </button>
                </div>

                {/* Modern Controls */}
                <div className="bg-white rounded-2xl shadow-lg p-6 mb-8 border border-gray-100">
                    <div className="flex flex-col lg:flex-row gap-4">
                        <div className="flex-1 relative">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                <FaSearch className="h-5 w-5 text-gray-400" />
                            </div>
                            <input
                                type="text"
                                placeholder="Search instructors by name, contact, or belt..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 text-gray-700 placeholder-gray-400"
                            />
                        </div>

                        <div className="flex items-center space-x-4">
                            <button
                                className="flex items-center space-x-2 px-4 py-3 bg-gray-50 text-gray-700 rounded-xl hover:bg-gray-100 hover:shadow-md transition-all duration-200 font-medium border border-gray-200 hover:border-gray-300"
                                onClick={() => setShowFilters(!showFilters)}
                            >
                                <FaFilter className="h-4 w-4" />
                                <span>Filters</span>
                                {(filters.beltLevel || filters.branch) && (
                                    <span className="bg-blue-600 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                                        {[filters.beltLevel, filters.branch].filter(Boolean).length}
                                    </span>
                                )}
                            </button>
                        </div>
                    </div>

                    {showFilters && (
                        <div className="mt-6 p-6 bg-gray-50 rounded-xl border border-gray-200">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Belt Level</label>
                                    <select
                                        value={filters.beltLevel}
                                        onChange={(e) => handleFilterChange('beltLevel', e.target.value)}
                                        className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-gray-700"
                                    >
                                        <option value="">All Belts</option>
                                        {getInstructorBeltRanks().map(belt => (
                                            <option key={belt.id} value={belt.name}>{belt.name}</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Branch</label>
                                    <select
                                        value={filters.branch}
                                        onChange={(e) => handleFilterChange('branch', e.target.value)}
                                        className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-gray-700"
                                    >
                                        <option value="">All Branches</option>
                                        {branches.map(branch => (
                                            <option key={branch.id} value={branch.id}>{branch.name}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Instructors List */}
                <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
                    {sortedInstructors.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-16">
                            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-6">
                                <FaUser className="text-4xl text-gray-400" />
                            </div>
                            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Instructors Found</h3>
                            <p className="text-gray-600 text-center max-w-md">
                                {searchTerm || filters.beltLevel || filters.branch 
                                    ? 'No instructors match your current search criteria. Try adjusting your filters.'
                                    : 'Get started by adding your first instructor to the system.'
                                }
                            </p>
                            {!searchTerm && !filters.beltLevel && !filters.branch && (
                                <button
                                    onClick={handleNewInstructor}
                                    className="mt-6 bg-blue-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-blue-700 transition-all duration-200 flex items-center space-x-2"
                                >
                                    <FaPlus className="h-5 w-5" />
                                    <span>Add First Instructor</span>
                                </button>
                            )}
                        </div>
                    ) : (
                        <>
                            {/* Table Header */}
                            <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                                <div className="grid grid-cols-12 gap-4 text-sm font-semibold text-gray-700">
                                    <div className="col-span-3">Name</div>
                                    <div className="col-span-2">Belt Level</div>
                                    <div className="col-span-2">Branch</div>
                                    <div className="col-span-2">Phone</div>
                                    <div className="col-span-2">Status</div>
                                    <div className="col-span-1">Actions</div>
                                </div>
                            </div>

                            {/* Table Body */}
                            <div className="divide-y divide-gray-200">
                                {sortedInstructors.map((instructor) => (
                                    <div key={instructor.id} className="px-6 py-4 hover:bg-gray-50 transition-colors duration-200">
                                        <div className="grid grid-cols-12 gap-4 items-center">
                                            {/* Name */}
                                            <div className="col-span-3">
                                                <div className="flex items-center space-x-3">
                                                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">
                                                        {instructor.first_name?.charAt(0) || 'I'}
                                                    </div>
                                                    <div>
                                                        <p className="font-medium text-gray-900">
                                                            {instructor.first_name} {instructor.last_name}
                                                        </p>
                                                        <p className="text-sm text-gray-600">{instructor.email}</p>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Belt Level */}
                                            <div className="col-span-2">
                                                <div className="flex items-center space-x-2">
                                                    <div 
                                                        className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold"
                                                        style={{ backgroundColor: getInstructorBeltRanks(instructor.belt_level) }}
                                                    >
                                                        {formatBeltRank(instructor.belt_level)[0]}
                                                    </div>
                                                    <span className="text-sm text-gray-900">{formatBeltRank(instructor.belt_level)}</span>
                                                </div>
                                            </div>

                                            {/* Branch */}
                                            <div className="col-span-2">
                                                <div className="flex items-center space-x-2">
                                                    <FaMapMarkerAlt className="h-4 w-4 text-gray-400" />
                                                    <span className="text-sm text-gray-900">{instructor.branch_name || 'Not assigned'}</span>
                                                </div>
                                            </div>

                                            {/* Phone */}
                                            <div className="col-span-2">
                                                <div className="flex items-center space-x-2">
                                                    <FaPhone className="h-4 w-4 text-gray-400" />
                                                    <span className="text-sm text-gray-900">{instructor.phone || 'Not provided'}</span>
                                                </div>
                                            </div>

                                            {/* Status */}
                                            <div className="col-span-2">
                                                <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                                                    instructor.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                                }`}>
                                                    {instructor.is_active ? 'Active' : 'Inactive'}
                                                </span>
                                            </div>

                                            {/* Actions */}
                                            <div className="col-span-1">
                                                <div className="flex items-center space-x-2">
                                                    <button
                                                        onClick={() => handleViewInstructor(instructor)}
                                                        className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200"
                                                        title="View Details"
                                                    >
                                                        <FaEye className="h-4 w-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleEditInstructor(instructor)}
                                                        className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-all duration-200"
                                                        title="Edit Instructor"
                                                    >
                                                        <FaEdit className="h-4 w-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteInstructor(instructor.id)}
                                                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200"
                                                        title="Delete Instructor"
                                                    >
                                                        <FaTrash className="h-4 w-4" />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </>
                    )}
                </div>

                {/* Add/Edit Instructor Modal */}
                <Modal
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    title={editingInstructor ? 'Edit Instructor' : 'Add New Instructor'}
                    size="large"
                >
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center">
                                    <span>Username</span>
                                    <span className="text-red-500 ml-1">*</span>
                                </label>
                                <input
                                    type="text"
                                    name="username"
                                    value={formData.username}
                                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                                    required
                                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 text-gray-700"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center">
                                    <span>Email</span>
                                    <span className="text-red-500 ml-1">*</span>
                                </label>
                                <input
                                    type="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    required
                                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 text-gray-700"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">First Name</label>
                                <input
                                    type="text"
                                    name="first_name"
                                    value={formData.first_name}
                                    onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 text-gray-700"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Last Name</label>
                                <input
                                    type="text"
                                    name="last_name"
                                    value={formData.last_name}
                                    onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 text-gray-700"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Email</label>
                                <input
                                    type="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 text-gray-700"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Phone</label>
                                <input
                                    type="tel"
                                    name="phone"
                                    value={formData.phone}
                                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 text-gray-700"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Date of Birth</label>
                                <input
                                    type="date"
                                    name="date_of_birth"
                                    value={formData.date_of_birth}
                                    onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })}
                                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 text-gray-700"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Branch</label>
                                <select
                                    name="branch_id"
                                    value={formData.branch_id}
                                    onChange={(e) => setFormData({ ...formData, branch_id: e.target.value })}
                                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 text-gray-700"
                                >
                                    <option value="">Select Branch</option>
                                    {branches.map(branch => (
                                        <option key={branch.id} value={branch.id}>{branch.name}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Certification Date</label>
                                <input
                                    type="date"
                                    name="certification_date"
                                    value={formData.certification_date}
                                    onChange={(e) => setFormData({ ...formData, certification_date: e.target.value })}
                                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 text-gray-700"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Emergency Contact Phone</label>
                                <input
                                    type="tel"
                                    name="emergency_contact_phone"
                                    value={formData.emergency_contact_phone}
                                    onChange={(e) => setFormData({ ...formData, emergency_contact_phone: e.target.value })}
                                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 text-gray-700"
                                />
                            </div>
                        </div>

                        <div className="flex justify-end space-x-4">
                            <button
                                type="button"
                                onClick={() => setIsModalOpen(false)}
                                className="px-6 py-3 text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition-all duration-200 font-medium"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all duration-200 font-medium"
                            >
                                {editingInstructor ? 'Update Instructor' : 'Add Instructor'}
                            </button>
                        </div>
                    </form>
                </Modal>

                {/* View Instructor Modal */}
                <Modal
                    isOpen={isViewModalOpen}
                    onClose={() => setIsViewModalOpen(false)}
                    title="Instructor Details"
                    size="large"
                >
                    {viewingInstructor && (
                        <div className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Name</label>
                                    <p className="text-lg text-gray-900">{viewingInstructor.first_name} {viewingInstructor.last_name}</p>
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Email</label>
                                    <p className="text-lg text-gray-900">{viewingInstructor.email}</p>
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Phone</label>
                                    <p className="text-lg text-gray-900">{viewingInstructor.phone}</p>
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Branch</label>
                                    <p className="text-lg text-gray-900">{viewingInstructor.branch_name}</p>
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Belt Level</label>
                                    <p className="text-lg text-gray-900">{viewingInstructor.belt_level}</p>
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Specialization</label>
                                    <p className="text-lg text-gray-900">{viewingInstructor.specialization}</p>
                                </div>
                            </div>
                        </div>
                    )}
                </Modal>

                {/* Delete Confirmation Dialog */}
                <ConfirmDialog
                    isOpen={isDeleteDialogOpen}
                    onClose={() => setIsDeleteDialogOpen(false)}
                    onConfirm={handleDelete}
                    title="Delete Instructor"
                    message="Are you sure you want to delete this instructor? This action cannot be undone."
                    confirmText="Delete"
                    cancelText="Cancel"
                    type="danger"
                />
            </div>
        </div>
    );
};

export default Instructors;
