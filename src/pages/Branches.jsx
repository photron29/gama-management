import React, { useState, useEffect } from 'react';
import { FaPlus, FaEdit, FaTrash, FaMapMarkerAlt, FaSearch, FaEye, FaPhone, FaEnvelope, FaUser, FaSort, FaSortUp, FaSortDown } from 'react-icons/fa';
import { toast } from 'react-toastify';
import LoadingAtom from '../components/LoadingAtom';
import { apiClient } from '../utils/api';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';

const Branches = () => {
    const [branches, setBranches] = useState([]);
    const [instructors, setInstructors] = useState([]);
    const [loading, setLoading] = useState(true);
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
        phone: '',
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
            phone: branch.phone,
            email: branch.email,
            manager_id: branch.manager_id || ''
        });
        setShowModal(true);
    };

    const handleView = (branch) => {
        setViewingBranch(branch);
        setShowViewModal(true);
    };

    const handleDelete = (branch) => {
        setDeletingBranch(branch);
        setShowDeleteConfirm(true);
    };

    const confirmDelete = async () => {
        if (!deletingBranch) return;

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
            phone: '',
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
            return <FaSort className="sort-icon" />;
        }
        return sortDirection === 'asc' ?
            <FaSortUp className="sort-icon" /> :
            <FaSortDown className="sort-icon" />;
    };

    const filteredBranches = (branches || []).filter(branch => {
        const searchLower = searchTerm.toLowerCase();
        return (
            branch.name.toLowerCase().includes(searchLower) ||
            branch.address.toLowerCase().includes(searchLower) ||
            branch.phone.includes(searchTerm) ||
            branch.email.toLowerCase().includes(searchLower) ||
            branch.manager.toLowerCase().includes(searchLower)
        );
    });

    const sortedBranches = [...filteredBranches].sort((a, b) => {
        let aValue = a[sortField];
        let bValue = b[sortField];

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
                <h1>Branches</h1>
                <button
                    className="btn btn-primary"
                    onClick={handleNewBranch}
                >
                    <FaPlus /> Add Branch
                </button>
            </div>

            <div className="table-controls">
                <div className="search-bar">
                    <FaSearch />
                    <input
                        type="text"
                        placeholder="Search branches..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            <div className="data-table-container">
                <div className="table-responsive">
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
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {sortedBranches.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="empty-state">
                                        <div className="empty-state-icon">
                                            <FaMapMarkerAlt />
                                        </div>
                                        <h3>No branches found</h3>
                                        <p>Try adjusting your search or add a new branch.</p>
                                    </td>
                                </tr>
                            ) : (
                                sortedBranches.map((branch) => (
                                    <tr key={branch.id} className="table-row">
                                        <td>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                <div
                                                    style={{
                                                        width: '32px',
                                                        height: '32px',
                                                        borderRadius: '50%',
                                                        backgroundColor: '#10b981',
                                                        color: 'white',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        fontSize: '0.875rem',
                                                        fontWeight: '600'
                                                    }}
                                                >
                                                    <FaMapMarkerAlt />
                                                </div>
                                                <div>
                                                    <div style={{ fontWeight: '600', color: 'var(--text-primary)' }}>
                                                        {branch.name}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                <FaMapMarkerAlt style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }} />
                                                <span style={{ fontSize: '0.875rem' }}>{branch.address}</span>
                                            </div>
                                        </td>
                                        <td>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                <FaPhone style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }} />
                                                {branch.phone || 'N/A'}
                                            </div>
                                        </td>
                                        <td>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                <FaEnvelope style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }} />
                                                {branch.email || 'N/A'}
                                            </div>
                                        </td>
                                        <td>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                <FaUser style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }} />
                                                {branch.manager || 'N/A'}
                                            </div>
                                        </td>
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
                                                    title="Edit Branch"
                                                >
                                                    <FaEdit />
                                                </button>
                                                <button
                                                    className="action-btn delete"
                                                    onClick={() => handleDelete(branch)}
                                                    title="Delete Branch"
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

                {/* Mobile Card View */}
                <div className="mobile-card-view">
                    {sortedBranches.length === 0 ? (
                        <div className="empty-state">
                            <div className="empty-state-icon">
                                <FaMapMarkerAlt />
                            </div>
                            <h3>No branches found</h3>
                            <p>Try adjusting your search or add a new branch.</p>
                        </div>
                    ) : (
                        sortedBranches.map((branch) => (
                            <div key={branch.id} className="mobile-card">
                                <div className="mobile-card-header">
                                    <div
                                        className="mobile-card-avatar"
                                        style={{
                                            backgroundColor: '#10b981'
                                        }}
                                    >
                                        <FaMapMarkerAlt />
                                    </div>
                                    <div>
                                        <h3 className="mobile-card-title">
                                            {branch.name}
                                        </h3>
                                    </div>
                                </div>

                                <div className="mobile-card-details">
                                    <div className="mobile-card-detail">
                                        <span className="mobile-card-detail-label">Address</span>
                                        <span className="mobile-card-detail-value">
                                            {branch.address}
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
                                        title="View Details"
                                    >
                                        <FaEye /> View
                                    </button>
                                    <button
                                        className="action-btn edit"
                                        onClick={() => handleEdit(branch)}
                                        title="Edit Branch"
                                    >
                                        <FaEdit /> Edit
                                    </button>
                                    <button
                                        className="action-btn delete"
                                        onClick={() => handleDelete(branch)}
                                        title="Delete Branch"
                                    >
                                        <FaTrash /> Delete
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
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
                        <label htmlFor="address">Address *</label>
                        <textarea
                            id="address"
                            name="address"
                            value={formData.address}
                            onChange={handleInputChange}
                            rows="3"
                            required
                        />
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label htmlFor="phone">Phone</label>
                            <input
                                type="tel"
                                id="phone"
                                name="phone"
                                value={formData.phone}
                                onChange={handleInputChange}
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
                                    {instructor.first_name} {instructor.last_name} - {instructor.branch_name}
                                </option>
                            ))}
                        </select>
                        <small className="form-help">
                            Select an instructor to manage this branch
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
                            {isSubmitting ? (
                                <>
                                    <div className="loading-spinner"></div>
                                    Saving...
                                </>
                            ) : (
                                editingBranch ? 'Update Branch' : 'Create Branch'
                            )}
                        </button>
                    </div>
                </form>
            </Modal>

            {/* View Modal */}
            <Modal
                isOpen={showViewModal}
                onClose={() => setShowViewModal(false)}
                title="Branch Details"
                size="medium"
            >
                {viewingBranch && (
                    <div>
                        <div className="form-group">
                            <label>Branch Name</label>
                            <p>{viewingBranch.name}</p>
                        </div>

                        <div className="form-group">
                            <label>Address</label>
                            <p>{viewingBranch.address}</p>
                        </div>

                        <div className="form-row">
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
                                Edit Branch
                            </button>
                        </div>
                    </div>
                )}
            </Modal>

            {/* Delete Confirmation */}
            <ConfirmDialog
                isOpen={showDeleteConfirm}
                onClose={() => {
                    setShowDeleteConfirm(false);
                    setDeletingBranch(null);
                }}
                onConfirm={confirmDelete}
                title="Delete Branch"
                message={`Are you sure you want to delete ${deletingBranch?.name}? This action cannot be undone.`}
                type="delete"
                confirmText="Delete"
                cancelText="Cancel"
            />
        </div>
    );
};

export default Branches;