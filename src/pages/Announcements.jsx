import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { apiClient } from '../utils/api';
import { toast } from 'react-hot-toast';
import { FaPlus, FaEdit, FaTrash, FaEye, FaBell, FaCalendarAlt, FaUser, FaSync } from 'react-icons/fa';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';
import LoadingAtom from '../components/LoadingAtom';

const Announcements = () => {
    const { user } = useAuth();
    const [announcements, setAnnouncements] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [showViewModal, setShowViewModal] = useState(false);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [selectedAnnouncement, setSelectedAnnouncement] = useState(null);
    const [editingAnnouncement, setEditingAnnouncement] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('');

    const [formData, setFormData] = useState({
        title: '',
        message: '',
        priority: 'normal',
        target_audience: 'all'
    });

    useEffect(() => {
        fetchAnnouncements();
    }, []);

    const fetchAnnouncements = async () => {
        try {
            setLoading(true);
            const response = await apiClient.getAnnouncements();
            setAnnouncements(response.announcements || []);
        } catch (error) {
            console.error('Error fetching announcements:', error);
            toast.error('Failed to fetch announcements');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingAnnouncement) {
                await apiClient.updateAnnouncement(editingAnnouncement.id, formData);
                toast.success('Announcement updated successfully');
            } else {
                await apiClient.createAnnouncement(formData);
                toast.success('Announcement created and sent to all instructors');
            }
            
            setShowModal(false);
            setFormData({ title: '', message: '', priority: 'normal', target_audience: 'all' });
            setEditingAnnouncement(null);
            fetchAnnouncements();
        } catch (error) {
            console.error('Error saving announcement:', error);
            toast.error('Failed to save announcement');
        }
    };

    const handleEdit = (announcement) => {
        setEditingAnnouncement(announcement);
        setFormData({
            title: announcement.title,
            message: announcement.message,
            priority: announcement.priority,
            target_audience: announcement.target_audience
        });
        setShowModal(true);
    };

    const handleView = (announcement) => {
        setSelectedAnnouncement(announcement);
        setShowViewModal(true);
    };

    const handleDelete = async () => {
        try {
            await apiClient.deleteAnnouncement(selectedAnnouncement.id);
            toast.success('Announcement deleted successfully');
            setShowDeleteDialog(false);
            setSelectedAnnouncement(null);
            fetchAnnouncements();
        } catch (error) {
            console.error('Error deleting announcement:', error);
            toast.error('Failed to delete announcement');
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const filteredAnnouncements = announcements.filter(announcement => {
        const matchesSearch = announcement.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            announcement.message.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = !filterStatus || announcement.status === filterStatus;
        return matchesSearch && matchesStatus;
    });

    const getPriorityColor = (priority) => {
        switch (priority) {
            case 'high': return 'text-red-600 bg-red-50 border-red-200';
            case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
            case 'normal': return 'text-blue-600 bg-blue-50 border-blue-200';
            default: return 'text-gray-600 bg-gray-50 border-gray-200';
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'active': return 'text-green-600 bg-green-50';
            case 'draft': return 'text-gray-600 bg-gray-50';
            case 'expired': return 'text-red-600 bg-red-50';
            default: return 'text-gray-600 bg-gray-50';
        }
    };

    if (loading) {
        return <LoadingAtom />;
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                                Announcements
                            </h1>
                            <p className="text-gray-600 dark:text-gray-400">
                                Create and manage announcements for instructors
                            </p>
                        </div>
                        <button
                            onClick={() => {
                                setEditingAnnouncement(null);
                                setFormData({ title: '', message: '', priority: 'normal', target_audience: 'all' });
                                setShowModal(true);
                            }}
                            className="flex items-center px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors shadow-lg hover:shadow-xl"
                        >
                            <FaPlus className="mr-2" />
                            Create Announcement
                        </button>
                    </div>
                </div>

                {/* Filters */}
                <div className="bg-white rounded-2xl shadow-lg p-6 mb-8 border border-gray-100">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
                            <input
                                type="text"
                                placeholder="Search announcements..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                            <select
                                value={filterStatus}
                                onChange={(e) => setFilterStatus(e.target.value)}
                                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200"
                            >
                                <option value="">All Status</option>
                                <option value="active">Active</option>
                                <option value="draft">Draft</option>
                                <option value="expired">Expired</option>
                            </select>
                        </div>
                        <div className="flex items-end">
                            <button
                                onClick={fetchAnnouncements}
                                className="ml-auto px-4 py-2 bg-blue-200 text-gray-700 rounded-lg hover:bg-blue-500 hover:text-white transition-colors"
                                >
                                    <FaSync />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Announcements List */}
                <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
                    {filteredAnnouncements.length === 0 ? (
                        <div className="text-center py-12">
                            <FaBell className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                            <h3 className="text-lg font-medium text-gray-900 mb-2">No announcements found</h3>
                            <p className="text-gray-500 mb-6">Create your first announcement to get started</p>
                            <button
                                onClick={() => {
                                    setEditingAnnouncement(null);
                                    setFormData({ title: '', message: '', priority: 'normal', target_audience: 'all' });
                                    setShowModal(true);
                                }}
                                className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
                            >
                                Create Announcement
                            </button>
                        </div>
                    ) : (
                        <div className="divide-y divide-gray-200">
                            {filteredAnnouncements.map((announcement) => (
                                <div key={announcement.id} className="p-6 hover:bg-gray-50 transition-colors">
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <div className="flex items-center space-x-3 mb-3">
                                                <h3 className="text-lg font-semibold text-gray-900">
                                                    {announcement.title}
                                                </h3>
                                                <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getPriorityColor(announcement.priority)}`}>
                                                    {announcement.priority}
                                                </span>
                                                <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(announcement.status)}`}>
                                                    {announcement.status}
                                                </span>
                                            </div>
                                            <p className="text-gray-600 mb-4 line-clamp-2">
                                                {announcement.message}
                                            </p>
                                            <div className="flex items-center space-x-4 text-sm text-gray-500">
                                                <div className="flex items-center">
                                                    <FaCalendarAlt className="mr-1" />
                                                    {new Date(announcement.created_at).toLocaleDateString()}
                                                </div>
                                                <div className="flex items-center">
                                                    <FaUser className="mr-1" />
                                                    {announcement.target_audience}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center space-x-2 ml-4">
                                            <button
                                                onClick={() => handleView(announcement)}
                                                className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                title="View"
                                            >
                                                <FaEye />
                                            </button>
                                            <button
                                                onClick={() => handleEdit(announcement)}
                                                className="p-2 text-gray-400 hover:text-yellow-600 hover:bg-yellow-50 rounded-lg transition-colors"
                                                title="Edit"
                                            >
                                                <FaEdit />
                                            </button>
                                            <button
                                                onClick={() => {
                                                    setSelectedAnnouncement(announcement);
                                                    setShowDeleteDialog(true);
                                                }}
                                                className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                title="Delete"
                                            >
                                                <FaTrash />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Create/Edit Modal */}
                <Modal
                    isOpen={showModal}
                    onClose={() => {
                        setShowModal(false);
                        setEditingAnnouncement(null);
                        setFormData({ title: '', message: '', priority: 'normal', target_audience: 'all' });
                    }}
                    title={editingAnnouncement ? 'Edit Announcement' : 'Create Announcement'}
                    size="large"
                >
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Title *
                            </label>
                            <input
                                type="text"
                                name="title"
                                value={formData.title}
                                onChange={handleInputChange}
                                required
                                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200"
                                placeholder="Enter announcement title"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Message *
                            </label>
                            <textarea
                                name="message"
                                value={formData.message}
                                onChange={handleInputChange}
                                required
                                rows={6}
                                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200"
                                placeholder="Enter announcement message"
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Priority
                                </label>
                                <select
                                    name="priority"
                                    value={formData.priority}
                                    onChange={handleInputChange}
                                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200"
                                >
                                    <option value="normal">Normal</option>
                                    <option value="medium">Medium</option>
                                    <option value="high">High</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Target Audience
                                </label>
                                <select
                                    name="target_audience"
                                    value={formData.target_audience}
                                    onChange={handleInputChange}
                                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200"
                                >
                                    <option value="all">All Instructors</option>
                                    <option value="specific">Specific Instructors</option>
                                </select>
                            </div>
                        </div>

                        <div className="flex justify-end space-x-4 pt-4">
                            <button
                                type="button"
                                onClick={() => {
                                    setShowModal(false);
                                    setEditingAnnouncement(null);
                                    setFormData({ title: '', message: '', priority: 'normal', target_audience: 'all' });
                                }}
                                className="px-6 py-3 text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
                            >
                                {editingAnnouncement ? 'Update' : 'Create & Send'}
                            </button>
                        </div>
                    </form>
                </Modal>

                {/* View Modal */}
                <Modal
                    isOpen={showViewModal}
                    onClose={() => {
                        setShowViewModal(false);
                        setSelectedAnnouncement(null);
                    }}
                    title="Announcement Details"
                    size="large"
                >
                    {selectedAnnouncement && (
                        <div className="space-y-6">
                            <div>
                                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                                    {selectedAnnouncement.title}
                                </h3>
                                <div className="flex items-center space-x-3 mb-4">
                                    <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getPriorityColor(selectedAnnouncement.priority)}`}>
                                        {selectedAnnouncement.priority}
                                    </span>
                                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedAnnouncement.status)}`}>
                                        {selectedAnnouncement.status}
                                    </span>
                                </div>
                            </div>

                            <div>
                                <h4 className="text-sm font-medium text-gray-700 mb-2">Message</h4>
                                <div className="bg-gray-50 rounded-xl p-4">
                                    <p className="text-gray-900 whitespace-pre-wrap">
                                        {selectedAnnouncement.message}
                                    </p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <h4 className="text-sm font-medium text-gray-700 mb-2">Target Audience</h4>
                                    <p className="text-gray-900">{selectedAnnouncement.target_audience}</p>
                                </div>
                                <div>
                                    <h4 className="text-sm font-medium text-gray-700 mb-2">Created</h4>
                                    <p className="text-gray-900">
                                        {new Date(selectedAnnouncement.created_at).toLocaleString()}
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}
                </Modal>

                {/* Delete Confirmation Dialog */}
                <ConfirmDialog
                    isOpen={showDeleteDialog}
                    onClose={() => {
                        setShowDeleteDialog(false);
                        setSelectedAnnouncement(null);
                    }}
                    onConfirm={handleDelete}
                    title="Delete Announcement"
                    message={`Are you sure you want to delete "${selectedAnnouncement?.title}"? This action cannot be undone.`}
                    confirmText="Delete"
                    cancelText="Cancel"
                    type="danger"
                />
            </div>
        </div>
    );
};

export default Announcements;
