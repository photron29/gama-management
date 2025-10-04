import React, { useState, useEffect } from 'react';
import { FaPlus, FaEdit, FaTrash, FaMapMarkerAlt, FaSearch, FaEye, FaPhone, FaEnvelope, FaUser, FaSort, FaSortUp, FaSortDown, FaSyncAlt } from 'react-icons/fa';
import { toast } from 'react-toastify';
import LoadingAtom from '../components/LoadingAtom';
import { apiClient } from '../utils/api';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';

const Schools = () => {
    const [branches, setBranches] = useState([]);
    const [instructors, setInstructors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [sortField, setSortField] = useState('name');
    const [sortDirection, setSortDirection] = useState('asc');

    // Modal states
    const [showModal, setShowModal] = useState(false);
    const [showViewModal, setShowViewModal] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [editingBranch, setEditingBranch] = useState(null);
    const [viewingBranch, setViewingBranch] = useState(null);
    const [deletingBranch, setDeletingBranch] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [formData, setFormData] = useState({
        name: '',
        address: '',
        email: '',
        manager_id: ''
    });

    useEffect(() => {
        fetchBranches();
    }, []);

    const fetchBranches = async () => {
        try {
            setLoading(true);
            const [branchesData, instructorsData] = await Promise.all([
                apiClient.getBranches(),
                apiClient.getInstructors()
            ]);
            setBranches(branchesData || []);
            setInstructors(instructorsData.instructors || []);
        } catch (error) {
            console.error('Error fetching branches:', error);
            toast.error('Failed to fetch branches');
        } finally {
            setLoading(false);
        }
    };

    const handleRefresh = async () => {
        setRefreshing(true);
        try {
            await fetchBranches();
            toast.success('Data refreshed successfully');
        } catch (error) {
            toast.error('Failed to refresh data');
        } finally {
            setRefreshing(false);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            if (editingBranch) {
                await apiClient.updateBranch(editingBranch.id, formData);
                toast.success('Branch updated successfully');
            } else {
                await apiClient.createBranch(formData);
                toast.success('Branch added successfully');
            }

            setShowModal(false);
            setEditingBranch(null);
            resetForm();
            fetchBranches();
        } catch (error) {
            console.error('Error saving branch:', error);
            toast.error(error.response?.data?.error || 'Failed to save branch');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleEdit = (branch) => {
        setEditingBranch(branch);
        setFormData({
            name: branch.name,
            address: branch.address,
            email: branch.email,
            manager_id: branch.manager_id || ''
        });
        setShowModal(true);
    };

    const handleView = (branch) => {
        setViewingBranch(branch);
        setShowViewModal(true);
    };

    const handleDeleteClick = (branch) => {
        setDeletingBranch(branch);
        setShowDeleteConfirm(true);
    };

    const handleDeleteConfirm = async () => {
        try {
            await apiClient.deleteBranch(deletingBranch.id);
            toast.success('Branch deleted successfully');
            setShowDeleteConfirm(false);
            setDeletingBranch(null);
            fetchBranches();
        } catch (error) {
            console.error('Error deleting branch:', error);
            toast.error(error.response?.data?.error || 'Failed to delete branch');
        }
    };

    const resetForm = () => {
        setFormData({
            name: '',
            address: '',
            email: '',
            manager_id: ''
        });
    };

    const handleNewBranch = () => {
        setEditingBranch(null);
        resetForm();
        setShowModal(true);
    };

    const handleSort = (field) => {
        if (sortField === field) {
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(field);
            setSortDirection('asc');
        }
    };

    const getSortIcon = (field) => {
        if (sortField !== field) {
            return <FaSort />;
        }
        return sortDirection === 'asc' ? <FaSortUp /> : <FaSortDown />;
    };

    const filteredBranches = branches.filter(branch =>
        branch.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (branch.address && branch.address.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (branch.manager && branch.manager.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    const sortedBranches = [...filteredBranches].sort((a, b) => {
        let aValue = a[sortField] || '';
        let bValue = b[sortField] || '';

        if (typeof aValue === 'string') {
            aValue = aValue.toLowerCase();
            bValue = bValue.toLowerCase();
        }

        if (sortDirection === 'asc') {
            return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
        } else {
            return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
        }
    });

    if (loading) {
        return (
            <div className="table-loading">
                <LoadingAtom size="medium" />
                <span>Loading branches...</span>
            </div>
        );
    }

    return (
        <div className="page-content">
            <div className="page-header">
                <h1>Schools</h1>
                <div className="header-actions">
                    <button
                        className="btn btn-icon"
                        onClick={handleRefresh}
                        disabled={refreshing}
                        title="Refresh data"
                    >
                        <FaSyncAlt className={refreshing ? 'spinning' : ''} />
                    </button>
                    <button className="btn btn-primary" onClick={handleNewBranch}>
                        <FaPlus /> Add Branch
                    </button>
                </div>
            </div>

            {/* Search Bar */}
            <div className="search-bar">
                <FaSearch />
                <input
                    type="text"
                    placeholder="Search branches..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            {/* Desktop Table */}
            <div className="table-container desktop-only">
                <table className="data-table">
                    <thead>
                        <tr>
                            <th
                                className="sortable"
                                onClick={() => handleSort('name')}
                            >
                                Name {getSortIcon('name')}
                            </th>
                            <th>Address</th>
                            <th>Phone</th>
                            <th>Email</th>
                            <th>Manager</th>
                            <th>Students</th>
                            <th>Instructors</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {sortedBranches.length === 0 ? (
                            <tr>
                                <td colSpan="8" className="empty-state">
                                    <div className="empty-state-icon">
                                        <FaMapMarkerAlt />
                                    </div>
                                    <p>No branches found</p>
                                </td>
                            </tr>
                        ) : (
                            sortedBranches.map((branch) => (
                                <tr key={branch.id}>
                                    <td className="table-cell-bold">{branch.name}</td>
                                    <td>{branch.address || 'N/A'}</td>
                                    <td>{branch.phone || 'N/A'}</td>
                                    <td>{branch.email || 'N/A'}</td>
                                    <td>{branch.manager || 'N/A'}</td>
                                    <td className="text-center">{branch.students || 0}</td>
                                    <td className="text-center">{branch.instructors || 0}</td>
                                    <td>
                                        <div className="action-buttons">
                                            <button
                                                className="action-btn view"
                                                onClick={() => handleView(branch)}
                                                title="View Details"
                                            >
                                                <FaEye />
                                            </button>
                                            <button
                                                className="action-btn edit"
                                                onClick={() => handleEdit(branch)}
                                                title="Edit"
                                            >
                                                <FaEdit />
                                            </button>
                                            <button
                                                className="action-btn delete"
                                                onClick={() => handleDeleteClick(branch)}
                                                title="Delete"
                                            >
                                                <FaTrash />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Mobile Cards */}
            <div className="mobile-cards mobile-only">
                {sortedBranches.length === 0 ? (
                    <div className="empty-state">
                        <FaMapMarkerAlt className="empty-icon" />
                        <p>No branches found</p>
                    </div>
                ) : (
                    sortedBranches.map((branch) => (
                        <div key={branch.id} className="mobile-card">
                            <div className="mobile-card-header">
                                <h3>{branch.name}</h3>
                                <div className="mobile-card-stats">
                                    <span className="stat-badge">{branch.students || 0} Students</span>
                                    <span className="stat-badge">{branch.instructors || 0} Instructors</span>
                                </div>
                            </div>

                            <div className="mobile-card-body">
                                <div className="mobile-card-detail">
                                    <span className="mobile-card-detail-label">Address</span>
                                    <span className="mobile-card-detail-value">
                                        {branch.address || 'N/A'}
                                    </span>
                                </div>
                                <div className="mobile-card-detail">
                                    <span className="mobile-card-detail-label">Phone</span>
                                    <span className="mobile-card-detail-value">
                                        {branch.phone || 'N/A'}
                                    </span>
                                </div>
                                <div className="mobile-card-detail">
                                    <span className="mobile-card-detail-label">Email</span>
                                    <span className="mobile-card-detail-value">
                                        {branch.email || 'N/A'}
                                    </span>
                                </div>
                                <div className="mobile-card-detail">
                                    <span className="mobile-card-detail-label">Manager</span>
                                    <span className="mobile-card-detail-value">
                                        {branch.manager || 'N/A'}
                                    </span>
                                </div>
                            </div>

                            <div className="mobile-card-actions">
                                <button
                                    className="action-btn view"
                                    onClick={() => handleView(branch)}
                                    title="View"
                                >
                                    <FaEye />
                                </button>
                                <button
                                    className="action-btn edit"
                                    onClick={() => handleEdit(branch)}
                                    title="Edit"
                                >
                                    <FaEdit />
                                </button>
                                <button
                                    className="action-btn delete"
                                    onClick={() => handleDeleteClick(branch)}
                                    title="Delete"
                                >
                                    <FaTrash />
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Add/Edit Modal */}
            <Modal
                isOpen={showModal}
                onClose={() => {
                    setShowModal(false);
                    setEditingBranch(null);
                    resetForm();
                }}
                title={editingBranch ? 'Edit Branch' : 'Add New Branch'}
                size="medium"
            >
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label htmlFor="name">Branch Name *</label>
                        <input
                            type="text"
                            id="name"
                            name="name"
                            value={formData.name}
                            onChange={handleInputChange}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="address">Address</label>
                        <textarea
                            id="address"
                            name="address"
                            value={formData.address}
                            onChange={handleInputChange}
                            rows="3"
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="email">Email</label>
                        <input
                            type="email"
                            id="email"
                            name="email"
                            value={formData.email}
                            onChange={handleInputChange}
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="manager_id">Manager</label>
                        <select
                            id="manager_id"
                            name="manager_id"
                            value={formData.manager_id}
                            onChange={handleInputChange}
                        >
                            <option value="">Select Manager</option>
                            {instructors.map(instructor => (
                                <option key={instructor.id} value={instructor.id}>
                                    {instructor.first_name} {instructor.last_name}
                                    {instructor.branch_name && ` - ${instructor.branch_name}`}
                                </option>
                            ))}
                        </select>
                        <small className="form-help">
                            Select an instructor to manage this branch. Phone will be auto-filled from instructor.
                        </small>
                    </div>

                    <div className="modal-footer">
                        <button
                            type="button"
                            className="btn btn-secondary"
                            onClick={() => {
                                setShowModal(false);
                                setEditingBranch(null);
                                resetForm();
                            }}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="btn btn-primary"
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? 'Saving...' : editingBranch ? 'Update Branch' : 'Add Branch'}
                        </button>
                    </div>
                </form>
            </Modal>

            {/* View Modal */}
            {viewingBranch && (
                <Modal
                    isOpen={showViewModal}
                    onClose={() => setShowViewModal(false)}
                    title="Branch Details"
                    size="medium"
                >
                    <div className="view-details">
                        <div className="detail-row">
                            <div className="form-group">
                                <label>Branch Name</label>
                                <p>{viewingBranch.name}</p>
                            </div>
                        </div>

                        <div className="detail-row">
                            <div className="form-group">
                                <label>Address</label>
                                <p>{viewingBranch.address || 'N/A'}</p>
                            </div>
                        </div>

                        <div className="detail-row">
                            <div className="form-group">
                                <label>Phone</label>
                                <p>{viewingBranch.phone || 'N/A'}</p>
                            </div>
                            <div className="form-group">
                                <label>Email</label>
                                <p>{viewingBranch.email || 'N/A'}</p>
                            </div>
                        </div>

                        <div className="form-group">
                            <label>Manager</label>
                            <p>{viewingBranch.manager || 'N/A'}</p>
                        </div>

                        <div className="detail-row">
                            <div className="form-group">
                                <label>Total Students</label>
                                <p>{viewingBranch.students || 0}</p>
                            </div>
                            <div className="form-group">
                                <label>Total Instructors</label>
                                <p>{viewingBranch.instructors || 0}</p>
                            </div>
                        </div>

                        <div className="modal-footer">
                            <button
                                type="button"
                                className="btn btn-secondary"
                                onClick={() => setShowViewModal(false)}
                            >
                                Close
                            </button>
                            <button
                                type="button"
                                className="btn btn-primary"
                                onClick={() => {
                                    setShowViewModal(false);
                                    handleEdit(viewingBranch);
                                }}
                            >
                                <FaEdit /> Edit
                            </button>
                        </div>
                    </div>
                </Modal>
            )}

            {/* Delete Confirmation */}
            <ConfirmDialog
                isOpen={showDeleteConfirm}
                title="Delete Branch"
                message={`Are you sure you want to delete "${deletingBranch?.name}"? This action cannot be undone.`}
                confirmText="Delete"
                cancelText="Cancel"
                onConfirm={handleDeleteConfirm}
                onCancel={() => {
                    setShowDeleteConfirm(false);
                    setDeletingBranch(null);
                }}
                type="danger"
            />
        </div>
    );
};

export default Schools;
