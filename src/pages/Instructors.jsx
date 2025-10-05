import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import LoadingAtom from '../components/LoadingAtom';
import {
    FaPlus,
    FaEdit,
    FaTrash,
    FaSearch,
    FaEye,
    FaEyeSlash,
    FaUser,
    FaPhone,
    FaEnvelope,
    FaCalendar,
    FaMapMarkerAlt,
    FaSort,
    FaSortUp,
    FaSortDown,
    FaUndo,
    FaExclamationTriangle,
    FaChevronUp,
    FaChevronDown,
    FaFilter
} from 'react-icons/fa';
import { apiClient } from '../utils/api';
import { getInstructorBeltRanks, formatBeltRank } from '../utils/beltRanks';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';

const Instructors = () => {
    const [instructors, setInstructors] = useState([]);
    const [inactiveInstructors, setInactiveInstructors] = useState([]);
    const [branches, setBranches] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [sortField, setSortField] = useState('last_name');
    const [sortDirection, setSortDirection] = useState('asc');

    // Filter states
    const [filters, setFilters] = useState({
        beltLevel: '',
        branch: ''
    });
    const [showFilters, setShowFilters] = useState(false);
    const [showInactive, setShowInactive] = useState(false);

    // Modal states
    const [showModal, setShowModal] = useState(false);
    const [showViewModal, setShowViewModal] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [showRestoreConfirm, setShowRestoreConfirm] = useState(false);
    const [showPermanentDeleteConfirm, setShowPermanentDeleteConfirm] = useState(false);
    const [editingInstructor, setEditingInstructor] = useState(null);
    const [viewingInstructor, setViewingInstructor] = useState(null);
    const [deletingInstructor, setDeletingInstructor] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const [formData, setFormData] = useState({
        username: '',
        password: '',
        first_name: '',
        last_name: '',
        email: '',
        phone: '',
        date_of_birth: '',
        belt_level_id: '',
        branch_id: '',
        specialization: '',
        certification_date: '',
        emergency_contact_name: '',
        emergency_contact_phone: '',
        address: ''
    });

    useEffect(() => {
        fetchInstructors();
    }, []);

    const fetchInstructors = async () => {
        try {
            const [instructorsData, branchesData, inactiveData] = await Promise.all([
                apiClient.getInstructors(),
                apiClient.getBranches(),
                apiClient.getInactiveInstructors()
            ]);
            setInstructors(instructorsData.instructors || []);
            setBranches(branchesData);
            setInactiveInstructors(inactiveData.instructors || []);
        } catch (error) {
            console.error('Error fetching data:', error);
            toast.error('Failed to fetch instructors data');
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

    const handleFilterChange = (filterType, value) => {
        setFilters(prev => ({
            ...prev,
            [filterType]: value
        }));
    };

    const clearFilters = () => {
        setFilters({
            beltLevel: '',
            branch: ''
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            if (editingInstructor) {
                await apiClient.updateInstructor(editingInstructor.id, formData);
                toast.success('Instructor updated successfully');
            } else {
                await apiClient.createInstructor(formData);
                toast.success('Instructor created successfully');
            }

            setShowModal(false);
            setEditingInstructor(null);
            setShowPassword(false);
            resetForm();
            fetchInstructors();
        } catch (error) {
            console.error('Error saving instructor:', error);

            // More specific error handling
            if (error.response?.data?.error) {
                const errorMessage = error.response.data.error;

                // Handle specific validation errors
                if (errorMessage.includes('Username already exists')) {
                    toast.error('Username is already taken. Please choose a different username.');
                } else if (errorMessage.includes('First name, last name, username, and password are required')) {
                    toast.error('Please fill in all required fields (First Name, Last Name, Username, and Password).');
                } else if (errorMessage.includes('Access denied')) {
                    toast.error('You do not have permission to perform this action.');
                } else {
                    toast.error(errorMessage);
                }
            } else {
                toast.error('Failed to save instructor. Please try again.');
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleEdit = (instructor) => {
        setEditingInstructor(instructor);
        setFormData({
            first_name: instructor.first_name,
            last_name: instructor.last_name,
            email: instructor.email,
            phone: instructor.phone,
            date_of_birth: instructor.date_of_birth,
            belt_level_id: instructor.belt_level_id,
            branch_id: instructor.branch_id,
            specialization: instructor.specialization || '',
            certification_date: instructor.certification_date || '',
            emergency_contact_name: instructor.emergency_contact_name,
            emergency_contact_phone: instructor.emergency_contact_phone,
            address: instructor.address
        });
        setShowModal(true);
    };

    const handleView = (instructor) => {
        setViewingInstructor(instructor);
        setShowViewModal(true);
    };

    const handleDelete = (instructor) => {
        setDeletingInstructor(instructor);
        setShowDeleteConfirm(true);
    };

    const handleRestore = (instructor) => {
        setDeletingInstructor(instructor);
        setShowRestoreConfirm(true);
    };

    const handlePermanentDelete = (instructor) => {
        setDeletingInstructor(instructor);
        setShowPermanentDeleteConfirm(true);
    };

    const confirmDelete = async () => {
        if (!deletingInstructor) return;

        try {
            await apiClient.deleteInstructor(deletingInstructor.id, false);
            toast.success('Instructor deactivated successfully');
            setShowDeleteConfirm(false);
            setDeletingInstructor(null);
            fetchInstructors();
        } catch (error) {
            console.error('Error deleting instructor:', error);
            toast.error(error.response?.data?.error || 'Failed to delete instructor');
        }
    };

    const confirmRestore = async () => {
        if (!deletingInstructor) return;

        try {
            await apiClient.restoreInstructor(deletingInstructor.id);
            toast.success('Instructor restored successfully');
            setShowRestoreConfirm(false);
            setDeletingInstructor(null);
            fetchInstructors();
        } catch (error) {
            console.error('Error restoring instructor:', error);
            toast.error(error.response?.data?.error || 'Failed to restore instructor');
        }
    };

    const confirmPermanentDelete = async () => {
        if (!deletingInstructor) return;

        try {
            await apiClient.deleteInstructor(deletingInstructor.id, true);
            toast.success('Instructor permanently deleted');
            setShowPermanentDeleteConfirm(false);
            setDeletingInstructor(null);
            fetchInstructors();
        } catch (error) {
            console.error('Error permanently deleting instructor:', error);
            toast.error(error.response?.data?.error || 'Failed to permanently delete instructor');
        }
    };

    const resetForm = () => {
        setFormData({
            username: '',
            password: '',
            first_name: '',
            last_name: '',
            email: '',
            phone: '',
            date_of_birth: '',
            belt_level_id: '17', // Default to Black Belt - 1st Dan
            branch_id: '',
            specialization: '',
            certification_date: '',
            emergency_contact_name: '',
            emergency_contact_phone: '',
            address: ''
        });
    };

    const handleNewInstructor = () => {
        setEditingInstructor(null);
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

    const filteredInstructors = (instructors || []).filter(instructor => {
        const searchLower = searchTerm.toLowerCase();
        const matchesSearch = (
            instructor.first_name.toLowerCase().includes(searchLower) ||
            instructor.last_name.toLowerCase().includes(searchLower) ||
            instructor.email.toLowerCase().includes(searchLower) ||
            instructor.phone.includes(searchTerm) ||
            instructor.branch_name.toLowerCase().includes(searchLower)
        );

        // Belt level filter
        const matchesBelt = !filters.beltLevel || instructor.belt_level_id === parseInt(filters.beltLevel);

        // Branch filter
        const matchesBranch = !filters.branch || instructor.branch_id === parseInt(filters.branch);

        // Specialization filter

        return matchesSearch && matchesBelt && matchesBranch;
    });

    const sortedInstructors = [...filteredInstructors].sort((a, b) => {
        let aValue = a[sortField];
        let bValue = b[sortField];

        if (sortField === 'branch_name') {
            aValue = a.branch_name;
            bValue = b.branch_name;
        }

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

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString();
    };

    const getBeltColor = (beltColor) => {
        const colors = {
            'blue': '#3b82f6',
            'red': '#dc2626',
            'black': '#1f2937'
        };
        return colors[beltColor] || '#6b7280';
    };

    if (loading) {
        return (
            <div className="table-loading">
                <LoadingAtom size="medium" />
                <span>Loading instructors...</span>
            </div>
        );
    }

    return (
        <div className="page-content">
            <div className="page-header">
                <h1>Instructors</h1>
                <button
                    className="btn btn-primary"
                    onClick={handleNewInstructor}
                >
                    <FaPlus /> Add Instructor
                </button>
            </div>

            <div className="table-controls">
                <div className="search-bar">
                    <FaSearch />
                    <input
                        type="text"
                        placeholder="Search instructors..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                <div className="filter-controls">
                    <button
                        className="btn btn-secondary"
                        onClick={() => setShowFilters(!showFilters)}
                    >
                        <FaFilter /> Filters
                        {(filters.beltLevel || filters.branch) && (
                            <span className="filter-badge">
                                {[filters.beltLevel, filters.branch].filter(Boolean).length}
                            </span>
                        )}
                    </button>

                    {showFilters && (
                        <div className="filter-panel">
                            <div className="filter-row">
                                <div className="filter-group">
                                    <label>Belt Level</label>
                                    <select
                                        value={filters.beltLevel}
                                        onChange={(e) => handleFilterChange('beltLevel', e.target.value)}
                                    >
                                        <option value="">All Belts</option>
                                        {getInstructorBeltRanks().map(belt => (
                                            <option key={belt.id} value={belt.id}>{belt.name}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="filter-group">
                                    <label>Branch</label>
                                    <select
                                        value={filters.branch}
                                        onChange={(e) => handleFilterChange('branch', e.target.value)}
                                    >
                                        <option value="">All Branches</option>
                                        {branches.map(branch => (
                                            <option key={branch.id} value={branch.id}>{branch.name}</option>
                                        ))}
                                    </select>
                                </div>

                            </div>

                            <div className="filter-actions">
                                <button
                                    className="btn btn-outline"
                                    onClick={clearFilters}
                                >
                                    Clear Filters
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <div className="data-table-container">
                <div className="table-responsive">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th
                                    className="sortable"
                                    onClick={() => handleSort('first_name')}
                                >
                                    Name {getSortIcon('first_name')}
                                </th>
                                <th
                                    className="sortable"
                                    onClick={() => handleSort('belt_level')}
                                >
                                    Belt Level {getSortIcon('belt_level')}
                                </th>
                                <th
                                    className="sortable"
                                    onClick={() => handleSort('branch_name')}
                                >
                                    Branch {getSortIcon('branch_name')}
                                </th>
                                <th>Phone</th>
                                <th>Email</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {sortedInstructors.length === 0 ? (
                                <tr>
                                    <td colSpan="7" className="empty-state">
                                        <div className="empty-state-icon">
                                            <FaUser />
                                        </div>
                                        <h3>No instructors found</h3>
                                        <p>Try adjusting your search or add a new instructor.</p>
                                    </td>
                                </tr>
                            ) : (
                                sortedInstructors.map((instructor) => (
                                    <tr key={instructor.id} className="table-row">
                                        <td>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                <div
                                                    style={{
                                                        width: '32px',
                                                        height: '32px',
                                                        borderRadius: '50%',
                                                        backgroundColor: '#7c3aed',
                                                        color: 'white',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        fontSize: '0.875rem',
                                                        fontWeight: '600'
                                                    }}
                                                >
                                                    {instructor.first_name[0]}{instructor.last_name[0]}
                                                </div>
                                                <div>
                                                    <div style={{ fontWeight: '600', color: 'var(--text-primary)' }}>
                                                        {instructor.first_name} {instructor.last_name}
                                                    </div>
                                                    <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                                                        DOB: {formatDate(instructor.date_of_birth)}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <span
                                                style={{
                                                    display: 'inline-block',
                                                    padding: '0.25rem 0.75rem',
                                                    borderRadius: '9999px',
                                                    backgroundColor: getBeltColor(instructor.belt_color) + '20',
                                                    color: getBeltColor(instructor.belt_color),
                                                    fontSize: '0.875rem',
                                                    fontWeight: '600',
                                                    border: `1px solid ${getBeltColor(instructor.belt_color)}40`
                                                }}
                                            >
                                                {instructor.belt_name || 'Unknown'}
                                            </span>
                                        </td>
                                        <td>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                <FaMapMarkerAlt style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }} />
                                                {instructor.branch_name}
                                            </div>
                                        </td>
                                        <td>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                <FaPhone style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }} />
                                                {instructor.phone || 'N/A'}
                                            </div>
                                        </td>
                                        <td>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                <FaEnvelope style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }} />
                                                {instructor.email || 'N/A'}
                                            </div>
                                        </td>
                                        <td>
                                            <span
                                                style={{
                                                    display: 'inline-block',
                                                    padding: '0.25rem 0.75rem',
                                                    borderRadius: '9999px',
                                                    backgroundColor: instructor.is_active ? '#10b98120' : '#ef444420',
                                                    color: instructor.is_active ? '#059669' : '#dc2626',
                                                    fontSize: '0.875rem',
                                                    fontWeight: '600',
                                                    border: `1px solid ${instructor.is_active ? '#10b98140' : '#ef444440'}`
                                                }}
                                            >
                                                {instructor.is_active ? 'Active' : 'Inactive'}
                                            </span>
                                        </td>
                                        <td>
                                            <div className="action-buttons">
                                                <button
                                                    className="action-btn view"
                                                    onClick={() => handleView(instructor)}
                                                    title="View Details"
                                                >
                                                    <FaEye />
                                                </button>
                                                <button
                                                    className="action-btn edit"
                                                    onClick={() => handleEdit(instructor)}
                                                    title="Edit Instructor"
                                                >
                                                    <FaEdit />
                                                </button>
                                                <button
                                                    className="action-btn delete"
                                                    onClick={() => handleDelete(instructor)}
                                                    title="Deactivate Instructor"
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
                    {sortedInstructors.length === 0 ? (
                        <div className="empty-state">
                            <div className="empty-state-icon">
                                <FaUser />
                            </div>
                            <h3>No instructors found</h3>
                            <p>Try adjusting your search or add a new instructor.</p>
                        </div>
                    ) : (
                        sortedInstructors.map((instructor) => (
                            <div key={instructor.id} className="mobile-card">
                                <div className="mobile-card-header">
                                    <div
                                        className="mobile-card-avatar"
                                        style={{
                                            backgroundColor: '#7c3aed'
                                        }}
                                    >
                                        {instructor.first_name[0]}{instructor.last_name[0]}
                                    </div>
                                    <div>
                                        <h3 className="mobile-card-title">
                                            {instructor.first_name} {instructor.last_name}
                                        </h3>
                                        <p className="mobile-card-subtitle">
                                            DOB: {formatDate(instructor.date_of_birth)}
                                        </p>
                                    </div>
                                </div>

                                <div className="mobile-card-details">
                                    <div className="mobile-card-detail">
                                        <span className="mobile-card-detail-label">Belt Level</span>
                                        <span
                                            className="mobile-card-detail-value"
                                            style={{
                                                color: getBeltColor(instructor.belt_color),
                                                fontWeight: '600'
                                            }}
                                        >
                                            {formatBeltRank(instructor.belt_level)}
                                        </span>
                                    </div>
                                    <div className="mobile-card-detail">
                                        <span className="mobile-card-detail-label">Branch</span>
                                        <span className="mobile-card-detail-value">
                                            {instructor.branch_name}
                                        </span>
                                    </div>
                                    <div className="mobile-card-detail">
                                        <span className="mobile-card-detail-label">Phone</span>
                                        <span className="mobile-card-detail-value">
                                            {instructor.phone || 'N/A'}
                                        </span>
                                    </div>
                                    <div className="mobile-card-detail">
                                        <span className="mobile-card-detail-label">Email</span>
                                        <span className="mobile-card-detail-value">
                                            {instructor.email || 'N/A'}
                                        </span>
                                    </div>
                                </div>

                                <div style={{ marginBottom: '1rem' }}>
                                    <span
                                        className={`mobile-card-status ${instructor.is_active ? 'active' : 'inactive'}`}
                                    >
                                        {instructor.is_active ? 'Active' : 'Inactive'}
                                    </span>
                                </div>

                                <div className="mobile-card-actions">
                                    <button
                                        className="action-btn view"
                                        onClick={() => handleView(instructor)}
                                        title="View Details"
                                    >
                                        <FaEye /> View
                                    </button>
                                    <button
                                        className="action-btn edit"
                                        onClick={() => handleEdit(instructor)}
                                        title="Edit Instructor"
                                    >
                                        <FaEdit /> Edit
                                    </button>
                                    <button
                                        className="action-btn delete"
                                        onClick={() => handleDelete(instructor)}
                                        title="Deactivate Instructor"
                                    >
                                        <FaTrash /> Deactivate
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Inactive Instructors Section */}
            {inactiveInstructors.length > 0 && (
                <div className="inactive-section">
                    <div
                        className="inactive-header"
                        onClick={() => setShowInactive(!showInactive)}
                    >
                        <div className="inactive-title">
                            <FaExclamationTriangle className="inactive-icon" />
                            <span>Inactive Instructors ({inactiveInstructors.length})</span>
                        </div>
                        {showInactive ? <FaChevronUp /> : <FaChevronDown />}
                    </div>

                    {showInactive && (
                        <div className="inactive-content">
                            <div className="data-table-container">
                                <table className="data-table">
                                    <thead>
                                        <tr>
                                            <th>Name</th>
                                            <th>Belt Level</th>
                                            <th>Branch</th>
                                            <th>Phone</th>
                                            <th>Email</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {inactiveInstructors.map((instructor) => (
                                            <tr key={instructor.id} className="table-row">
                                                <td>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                        <div
                                                            style={{
                                                                width: '32px',
                                                                height: '32px',
                                                                borderRadius: '50%',
                                                                backgroundColor: '#6b7280',
                                                                color: 'white',
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                justifyContent: 'center',
                                                                fontSize: '0.875rem',
                                                                fontWeight: '600'
                                                            }}
                                                        >
                                                            {instructor.first_name[0]}{instructor.last_name[0]}
                                                        </div>
                                                        <div>
                                                            <div style={{ fontWeight: '600', color: 'var(--text-primary)' }}>
                                                                {instructor.first_name} {instructor.last_name}
                                                            </div>
                                                            <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                                                                DOB: {formatDate(instructor.date_of_birth)}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td>
                                                    <span
                                                        style={{
                                                            display: 'inline-block',
                                                            padding: '0.25rem 0.75rem',
                                                            borderRadius: '9999px',
                                                            backgroundColor: getBeltColor(instructor.belt_color) + '20',
                                                            color: getBeltColor(instructor.belt_color),
                                                            fontSize: '0.875rem',
                                                            fontWeight: '600',
                                                            border: `1px solid ${getBeltColor(instructor.belt_color)}40`
                                                        }}
                                                    >
                                                        {instructor.belt_name || 'Unknown'}
                                                    </span>
                                                </td>
                                                <td>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                        <FaMapMarkerAlt style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }} />
                                                        {instructor.branch_name}
                                                    </div>
                                                </td>
                                                <td>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                        <FaPhone style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }} />
                                                        {instructor.phone || 'N/A'}
                                                    </div>
                                                </td>
                                                <td>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                        <FaEnvelope style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }} />
                                                        {instructor.email || 'N/A'}
                                                    </div>
                                                </td>
                                                <td>
                                                    <div className="action-buttons">
                                                        <button
                                                            className="action-btn view"
                                                            onClick={() => handleView(instructor)}
                                                            title="View Details"
                                                        >
                                                            <FaEye />
                                                        </button>
                                                        <button
                                                            className="action-btn edit"
                                                            onClick={() => handleRestore(instructor)}
                                                            title="Restore Instructor"
                                                        >
                                                            <FaUndo />
                                                        </button>
                                                        <button
                                                            className="action-btn delete"
                                                            onClick={() => handlePermanentDelete(instructor)}
                                                            title="Permanently Delete"
                                                        >
                                                            <FaTrash />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Add/Edit Modal */}
            <Modal
                isOpen={showModal}
                onClose={() => {
                    setShowModal(false);
                    setEditingInstructor(null);
                    setShowPassword(false);
                    resetForm();
                }}
                title={editingInstructor ? 'Edit Instructor' : 'Add New Instructor'}
                size="large"
            >
                <form onSubmit={handleSubmit}>
                    {!editingInstructor && (
                        <div className="form-row">
                            <div className="form-group">
                                <label htmlFor="username">Username *</label>
                                <input
                                    type="text"
                                    id="username"
                                    name="username"
                                    value={formData.username}
                                    onChange={handleInputChange}
                                    required={!editingInstructor}
                                    minLength="3"
                                    maxLength="50"
                                    pattern="[a-zA-Z0-9_]+"
                                    placeholder="Login username (letters, numbers, underscore only)"
                                />
                                <small className="form-help">
                                    Instructor will use this to login
                                </small>
                            </div>
                            <div className="form-group">
                                <label htmlFor="password">Password *</label>
                                <div className="password-input-wrapper">
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        id="password"
                                        name="password"
                                        value={formData.password}
                                        onChange={handleInputChange}
                                        required={!editingInstructor}
                                        placeholder="Login password"
                                        minLength="6"
                                        maxLength="100"
                                    />
                                    <button
                                        type="button"
                                        className="password-toggle-btn"
                                        onClick={() => setShowPassword(!showPassword)}
                                        tabIndex={-1}
                                    >
                                        {showPassword ? <FaEyeSlash /> : <FaEye />}
                                    </button>
                                </div>
                                <small className="form-help">
                                    Minimum 6 characters
                                </small>
                            </div>
                        </div>
                    )}

                    <div className="form-row">
                        <div className="form-group">
                            <label htmlFor="first_name">First Name *</label>
                            <input
                                type="text"
                                id="first_name"
                                name="first_name"
                                value={formData.first_name}
                                onChange={handleInputChange}
                                required
                                minLength="2"
                                maxLength="50"
                                placeholder="Enter first name"
                            />
                        </div>
                        <div className="form-group">
                            <label htmlFor="last_name">Last Name *</label>
                            <input
                                type="text"
                                id="last_name"
                                name="last_name"
                                value={formData.last_name}
                                onChange={handleInputChange}
                                required
                                minLength="2"
                                maxLength="50"
                                placeholder="Enter last name"
                            />
                        </div>
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label htmlFor="email">Email</label>
                            <input
                                type="email"
                                id="email"
                                name="email"
                                value={formData.email}
                                onChange={handleInputChange}
                                maxLength="100"
                                placeholder="Enter email address"
                            />
                        </div>
                        <div className="form-group">
                            <label htmlFor="phone">Phone *</label>
                            <input
                                type="tel"
                                id="phone"
                                name="phone"
                                value={formData.phone}
                                onChange={handleInputChange}
                                required
                                pattern="[0-9]{10}"
                                minLength="10"
                                maxLength="10"
                                placeholder="Enter 10-digit phone number"
                            />
                        </div>
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label htmlFor="date_of_birth">Date of Birth</label>
                            <input
                                type="date"
                                id="date_of_birth"
                                name="date_of_birth"
                                value={formData.date_of_birth}
                                onChange={handleInputChange}
                            />
                        </div>
                        <div className="form-group">
                            <label htmlFor="belt_level_id">Belt Level *</label>
                            <select
                                id="belt_level_id"
                                name="belt_level_id"
                                value={formData.belt_level_id}
                                onChange={handleInputChange}
                                required
                            >
                                <option value="">Select Belt Level</option>
                                {getInstructorBeltRanks().map(rank => (
                                    <option key={rank.id} value={rank.id}>
                                        {rank.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="form-group">
                        <label htmlFor="branch_id">Branch *</label>
                        <select
                            id="branch_id"
                            name="branch_id"
                            value={formData.branch_id}
                            onChange={handleInputChange}
                            required
                        >
                            <option value="">Select Branch</option>
                            {branches.map(branch => (
                                <option key={branch.id} value={branch.id}>
                                    {branch.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label htmlFor="specialization">Specialization</label>
                            <input
                                type="text"
                                id="specialization"
                                name="specialization"
                                value={formData.specialization}
                                onChange={handleInputChange}
                                placeholder="e.g., Taekwondo, Karate, Self-Defense"
                            />
                        </div>
                        <div className="form-group">
                            <label htmlFor="certification_date">Certification Date</label>
                            <input
                                type="date"
                                id="certification_date"
                                name="certification_date"
                                value={formData.certification_date}
                                onChange={handleInputChange}
                            />
                        </div>
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label htmlFor="emergency_contact_name">Emergency Contact Name</label>
                            <input
                                type="text"
                                id="emergency_contact_name"
                                name="emergency_contact_name"
                                value={formData.emergency_contact_name}
                                onChange={handleInputChange}
                            />
                        </div>
                        <div className="form-group">
                            <label htmlFor="emergency_contact_phone">Emergency Contact Phone</label>
                            <input
                                type="tel"
                                id="emergency_contact_phone"
                                name="emergency_contact_phone"
                                value={formData.emergency_contact_phone}
                                onChange={handleInputChange}
                                pattern="[0-9]{10}"
                                minLength="10"
                                maxLength="10"
                                placeholder="Enter 10-digit phone number"
                            />
                        </div>
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

                    <div className="modal-footer">
                        <button
                            type="button"
                            className="btn btn-secondary"
                            onClick={() => {
                                setShowModal(false);
                                setEditingInstructor(null);
                                setShowPassword(false);
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
                                editingInstructor ? 'Update Instructor' : 'Create Instructor'
                            )}
                        </button>
                    </div>
                </form>
            </Modal>

            {/* View Modal */}
            <Modal
                isOpen={showViewModal}
                onClose={() => setShowViewModal(false)}
                title="Instructor Details"
                size="medium"
            >
                {viewingInstructor && (
                    <div>
                        <div className="form-row">
                            <div className="form-group">
                                <label>Name</label>
                                <p>{viewingInstructor.first_name} {viewingInstructor.last_name}</p>
                            </div>
                            <div className="form-group">
                                <label>Belt Level</label>
                                <p>{viewingInstructor.belt_name || 'Unknown'}</p>
                            </div>
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label>Email</label>
                                <p>{viewingInstructor.email || 'N/A'}</p>
                            </div>
                            <div className="form-group">
                                <label>Phone</label>
                                <p>{viewingInstructor.phone || 'N/A'}</p>
                            </div>
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label>Date of Birth</label>
                                <p>{formatDate(viewingInstructor.date_of_birth)}</p>
                            </div>
                            <div className="form-group">
                                <label>Branch</label>
                                <p>{viewingInstructor.branch_name}</p>
                            </div>
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label>Emergency Contact</label>
                                <p>{viewingInstructor.emergency_contact_name || 'N/A'}</p>
                            </div>
                            <div className="form-group">
                                <label>Emergency Phone</label>
                                <p>{viewingInstructor.emergency_contact_phone || 'N/A'}</p>
                            </div>
                        </div>

                        <div className="form-group">
                            <label>Address</label>
                            <p>{viewingInstructor.address || 'N/A'}</p>
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
                                    handleEdit(viewingInstructor);
                                }}
                            >
                                Edit Instructor
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
                    setDeletingInstructor(null);
                }}
                onConfirm={confirmDelete}
                title="Deactivate Instructor"
                message={`Are you sure you want to deactivate ${deletingInstructor?.first_name} ${deletingInstructor?.last_name}?`}
                type="warning"
                confirmText="Deactivate"
                cancelText="Cancel"
            />

            {/* Restore Confirmation */}
            <ConfirmDialog
                isOpen={showRestoreConfirm}
                onClose={() => {
                    setShowRestoreConfirm(false);
                    setDeletingInstructor(null);
                }}
                onConfirm={confirmRestore}
                title="Restore Instructor"
                message={`Are you sure you want to restore ${deletingInstructor?.first_name} ${deletingInstructor?.last_name}?`}
                type="info"
                confirmText="Restore"
                cancelText="Cancel"
            />

            {/* Permanent Delete Confirmation */}
            <ConfirmDialog
                isOpen={showPermanentDeleteConfirm}
                onClose={() => {
                    setShowPermanentDeleteConfirm(false);
                    setDeletingInstructor(null);
                }}
                onConfirm={confirmPermanentDelete}
                title="Permanently Delete Instructor"
                message={`Are you sure you want to permanently delete ${deletingInstructor?.first_name} ${deletingInstructor?.last_name}? This action cannot be undone.`}
                type="delete"
                confirmText="Delete Forever"
                cancelText="Cancel"
            />
        </div>
    );
};

export default Instructors;