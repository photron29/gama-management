import React, { useState, useEffect } from 'react';
import { FaPlus, FaSearch, FaFilter, FaEye, FaEdit, FaTrash, FaMapMarkerAlt, FaPhone, FaEnvelope, FaUser } from 'react-icons/fa';
import { apiClient } from '../utils/api';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';

const Branches = () => {
    const [branches, setBranches] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [editingBranch, setEditingBranch] = useState(null);
    const [viewingBranch, setViewingBranch] = useState(null);
    const [deletingBranchId, setDeletingBranchId] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        address: '',
        phone: '',
        email: '',
        manager: ''
    });

    useEffect(() => {
        fetchBranches();
    }, []);

    const fetchBranches = async () => {
        try {
            const response = await apiClient.getBranches();
            setBranches(response.branches || []);
        } catch (error) {
            console.error('Error fetching branches:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleNewBranch = () => {
        setEditingBranch(null);
        setFormData({
            name: '',
            address: '',
            phone: '',
            email: '',
            manager: ''
        });
        setIsModalOpen(true);
    };

    const handleEditBranch = (branch) => {
        setEditingBranch(branch);
        setFormData({
            name: branch.name || '',
            address: branch.address || '',
            phone: branch.phone || '',
            email: branch.email || '',
            manager: branch.manager || ''
        });
        setIsModalOpen(true);
    };

    const handleViewBranch = (branch) => {
        setViewingBranch(branch);
        setIsViewModalOpen(true);
    };

    const handleDeleteBranch = (branchId) => {
        setDeletingBranchId(branchId);
        setIsDeleteDialogOpen(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingBranch) {
                await apiClient.updateBranch(editingBranch.id, formData);
            } else {
                await apiClient.createBranch(formData);
            }
            setIsModalOpen(false);
            fetchBranches();
        } catch (error) {
            console.error('Error saving branch:', error);
        }
    };

    const handleDelete = async () => {
        try {
            await apiClient.deleteBranch(deletingBranchId);
            setIsDeleteDialogOpen(false);
            fetchBranches();
        } catch (error) {
            console.error('Error deleting branch:', error);
        }
    };

    const filteredBranches = branches.filter(branch => {
        const matchesSearch = !searchTerm || 
            branch.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            branch.address?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            branch.phone?.includes(searchTerm) ||
            branch.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            branch.manager?.toLowerCase().includes(searchTerm.toLowerCase());
        
        return matchesSearch;
    });

    const sortedBranches = filteredBranches.sort((a, b) => {
        return a.name?.localeCompare(b.name) || 0;
    });

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading branches...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex flex-col">
            <div className="max-w-7xl mx-auto p-6 flex-1 w-full">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Branch Management</h1>
                        <p className="text-gray-600 dark:text-gray-400">Manage your martial arts school branches and locations</p>
                    </div>
                    <button
                        className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-all duration-200 flex items-center space-x-2 shadow-md hover:shadow-lg"
                        onClick={handleNewBranch}
                    >
                        <FaPlus className="h-4 w-4" />
                        <span>Add Branch</span>
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
                                placeholder="Search branches by name, address, or contact..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 text-gray-700 placeholder-gray-400"
                            />
                        </div>
                    </div>
                </div>

                {/* Branches List */}
                <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
                    {sortedBranches.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-16">
                            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-6">
                                <FaMapMarkerAlt className="text-4xl text-gray-400" />
                            </div>
                            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Branches Found</h3>
                            <p className="text-gray-600 text-center max-w-md">
                                {searchTerm 
                                    ? 'No branches match your current search criteria. Try adjusting your search.'
                                    : 'Get started by adding your first branch to the system.'
                                }
                            </p>
                            {!searchTerm && (
                                <button
                                    onClick={handleNewBranch}
                                    className="mt-6 bg-blue-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-blue-700 transition-all duration-200 flex items-center space-x-2"
                                >
                                    <FaPlus className="h-5 w-5" />
                                    <span>Add First Branch</span>
                                </button>
                            )}
                        </div>
                    ) : (
                        <>
                            {/* Table Header */}
                            <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                                <div className="grid grid-cols-12 gap-4 text-sm font-semibold text-gray-700">
                                    <div className="col-span-3">Name</div>
                                    <div className="col-span-3">Address</div>
                                    <div className="col-span-2">Phone</div>
                                    <div className="col-span-2">Manager</div>
                                    <div className="col-span-1">Status</div>
                                    <div className="col-span-1">Actions</div>
                                </div>
                            </div>

                            {/* Table Body */}
                            <div className="divide-y divide-gray-200">
                                {sortedBranches.map((branch) => (
                                    <div key={branch.id} className="px-6 py-4 hover:bg-gray-50 transition-colors duration-200">
                                        <div className="grid grid-cols-12 gap-4 items-center">
                                            {/* Name */}
                                            <div className="col-span-3">
                                                <div className="flex items-center space-x-3">
                                                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-white">
                                                        <FaMapMarkerAlt className="h-5 w-5" />
                                                    </div>
                                                    <div>
                                                        <p className="font-medium text-gray-900">{branch.name}</p>
                                                        <p className="text-sm text-gray-600">ID: {branch.id}</p>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Address */}
                                            <div className="col-span-3">
                                                <div className="flex items-start space-x-2">
                                                    <FaMapMarkerAlt className="h-4 w-4 text-gray-400 mt-1" />
                                                    <span className="text-sm text-gray-900">{branch.address || 'Not provided'}</span>
                                                </div>
                                            </div>

                                            {/* Phone */}
                                            <div className="col-span-2">
                                                <div className="flex items-center space-x-2">
                                                    <FaPhone className="h-4 w-4 text-gray-400" />
                                                    <span className="text-sm text-gray-900">{branch.phone || 'Not provided'}</span>
                                                </div>
                                            </div>

                                            {/* Manager */}
                                            <div className="col-span-2">
                                                <div className="flex items-center space-x-2">
                                                    <FaUser className="h-4 w-4 text-gray-400" />
                                                    <span className="text-sm text-gray-900">{branch.manager || 'Not assigned'}</span>
                                                </div>
                                            </div>

                                            {/* Status */}
                                            <div className="col-span-1">
                                                <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                                                    Active
                                                </span>
                                            </div>

                                            {/* Actions */}
                                            <div className="col-span-1">
                                                <div className="flex items-center space-x-2">
                                                    <button
                                                        onClick={() => handleViewBranch(branch)}
                                                        className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200"
                                                        title="View Details"
                                                    >
                                                        <FaEye className="h-4 w-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleEditBranch(branch)}
                                                        className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-all duration-200"
                                                        title="Edit Branch"
                                                    >
                                                        <FaEdit className="h-4 w-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteBranch(branch.id)}
                                                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200"
                                                        title="Delete Branch"
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

                {/* Add/Edit Branch Modal */}
                <Modal
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    title={editingBranch ? 'Edit Branch' : 'Add New Branch'}
                    size="large"
                >
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center">
                                    <span>Branch Name</span>
                                    <span className="text-red-500 ml-1">*</span>
                                </label>
                                <input
                                    type="text"
                                    name="name"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    required
                                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 text-gray-700"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Manager</label>
                                <input
                                    type="text"
                                    name="manager"
                                    value={formData.manager}
                                    onChange={(e) => setFormData({ ...formData, manager: e.target.value })}
                                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 text-gray-700"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center">
                                <span>Address</span>
                                <span className="text-red-500 ml-1">*</span>
                            </label>
                            <textarea
                                name="address"
                                value={formData.address}
                                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                required
                                rows={3}
                                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 text-gray-700"
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                                {editingBranch ? 'Update Branch' : 'Add Branch'}
                            </button>
                        </div>
                    </form>
                </Modal>

                {/* View Branch Modal */}
                <Modal
                    isOpen={isViewModalOpen}
                    onClose={() => setIsViewModalOpen(false)}
                    title="Branch Details"
                    size="large"
                >
                    {viewingBranch && (
                        <div className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Branch Name</label>
                                    <p className="text-lg text-gray-900">{viewingBranch.name}</p>
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Manager</label>
                                    <p className="text-lg text-gray-900">{viewingBranch.manager || 'Not assigned'}</p>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Address</label>
                                <p className="text-lg text-gray-900">{viewingBranch.address}</p>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Phone</label>
                                    <p className="text-lg text-gray-900">{viewingBranch.phone || 'Not provided'}</p>
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Email</label>
                                    <p className="text-lg text-gray-900">{viewingBranch.email || 'Not provided'}</p>
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
                    title="Delete Branch"
                    message="Are you sure you want to delete this branch? This action cannot be undone."
                    confirmText="Delete"
                    cancelText="Cancel"
                    type="danger"
                />
            </div>
        </div>
    );
};

export default Branches;
