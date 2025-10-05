import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import LoadingAtom from '../components/LoadingAtom';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import {
    FaPlus,
    FaEdit,
    FaTrash,
    FaSearch,
    FaEye,
    FaUser,
    FaPhone,
    FaEnvelope,
    FaCalendar,
    FaMapMarkerAlt,
    FaSort,
    FaSortUp,
    FaSortDown,
    FaFilter,
    FaSyncAlt
} from 'react-icons/fa';
import { apiClient } from '../utils/api';
import { getStudentBeltRanks, formatBeltRank } from '../utils/beltRanks';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';

const Students = () => {
    const { isDarkMode } = useTheme();
    const { user } = useAuth();
    const [students, setStudents] = useState([]);
    const [branches, setBranches] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [sortField, setSortField] = useState('last_name');
    const [sortDirection, setSortDirection] = useState('asc');

    // Filter states
    const [filters, setFilters] = useState({
        beltLevel: '',
        branch: '',
        status: '',
        ageRange: ''
    });
    const [showFilters, setShowFilters] = useState(false);

    // Modal states
    const [showModal, setShowModal] = useState(false);
    const [showViewModal, setShowViewModal] = useState(false);
    const [showDeactivateConfirm, setShowDeactivateConfirm] = useState(false);
    const [editingStudent, setEditingStudent] = useState(null);
    const [viewingStudent, setViewingStudent] = useState(null);
    const [deactivatingStudent, setDeactivatingStudent] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [formData, setFormData] = useState({
        first_name: '',
        last_name: '',
        email: '',
        phone: '',
        date_of_birth: '',
        belt_level_id: '',
        branch_id: '',
        emergency_contact_name: '',
        emergency_contact_phone: '',
        address: ''
    });

    useEffect(() => {
        fetchStudents();
    }, []);

    const fetchStudents = async () => {
        try {
            const [studentsData, branchesData] = await Promise.all([
                apiClient.getStudents(),
                apiClient.getBranches()
            ]);
            setStudents(studentsData.students || []);
            setBranches(branchesData);
        } catch (error) {
            console.error('Error fetching data:', error);
            toast.error('Failed to fetch students data');
        } finally {
            setLoading(false);
        }
    };

    const handleRefresh = async () => {
        setRefreshing(true);
        try {
            const [studentsData, branchesData] = await Promise.all([
                apiClient.getStudents(),
                apiClient.getBranches()
            ]);
            setStudents(studentsData.students || []);
            setBranches(branchesData);
            toast.success('Data refreshed successfully');
        } catch (error) {
            console.error('Error refreshing data:', error);
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

    const handleFilterChange = (filterType, value) => {
        setFilters(prev => ({
            ...prev,
            [filterType]: value
        }));
    };

    const clearFilters = () => {
        setFilters({
            beltLevel: '',
            branch: '',
            status: '',
            ageRange: ''
        });
    };

    const getAgeFromDOB = (dateOfBirth) => {
        if (!dateOfBirth) return 0;
        const today = new Date();
        const birthDate = new Date(dateOfBirth);
        let age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
            age--;
        }
        return age;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            // For instructors, don't send branch_id when updating (they can't change branches)
            let dataToSend = { ...formData };
            if (editingStudent && user?.role === 'instructor') {
                delete dataToSend.branch_id;
            }

            if (editingStudent) {
                await apiClient.updateStudent(editingStudent.id, dataToSend);
                toast.success('Student updated successfully');
            } else {
                await apiClient.createStudent(dataToSend);
                toast.success('Student created successfully');
            }

            setShowModal(false);
            setEditingStudent(null);
            resetForm();
            fetchStudents();
        } catch (error) {
            // Show user-friendly error message instead of console error
            const errorMessage = error.response?.data?.error || 'Failed to save student';
            toast.error(errorMessage);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleEdit = (student) => {
        setEditingStudent(student);
        setFormData({
            first_name: student.first_name,
            last_name: student.last_name,
            email: student.email,
            phone: student.phone,
            date_of_birth: student.date_of_birth,
            belt_level_id: student.belt_level_id,
            branch_id: student.branch_id,
            emergency_contact_name: student.emergency_contact_name,
            emergency_contact_phone: student.emergency_contact_phone,
            address: student.address
        });
        setShowModal(true);
    };

    const handleView = (student) => {
        setViewingStudent(student);
        setShowViewModal(true);
    };

    const handleDeactivate = (student) => {
        setDeactivatingStudent(student);
        setShowDeactivateConfirm(true);
    };

    const confirmDeactivate = async () => {
        if (!deactivatingStudent) return;

        try {
            await apiClient.deleteStudent(deactivatingStudent.id);
            toast.success('Student deactivated successfully');
            setShowDeactivateConfirm(false);
            setDeactivatingStudent(null);
            fetchStudents();
        } catch (error) {
            console.error('Error deactivating student:', error);
            toast.error(error.response?.data?.error || 'Failed to deactivate student');
        }
    };

    const resetForm = () => {
        setFormData({
            first_name: '',
            last_name: '',
            email: '',
            phone: '',
            date_of_birth: '',
            belt_level_id: '',
            branch_id: '',
            emergency_contact_name: '',
            emergency_contact_phone: '',
            address: ''
        });
    };

    const handleNewStudent = () => {
        setEditingStudent(null);
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

    const filteredStudents = (students || []).filter(student => {
        const searchLower = searchTerm.toLowerCase();
        const matchesSearch = (
            student.first_name.toLowerCase().includes(searchLower) ||
            student.last_name.toLowerCase().includes(searchLower) ||
            student.email.toLowerCase().includes(searchLower) ||
            student.phone.includes(searchTerm) ||
            student.branch_name.toLowerCase().includes(searchLower)
        );

        // Belt level filter
        const matchesBelt = !filters.beltLevel || student.belt_level_id === parseInt(filters.beltLevel);

        // Branch filter
        const matchesBranch = !filters.branch || student.branch_id === parseInt(filters.branch);

        // Status filter
        const matchesStatus = !filters.status ||
            (filters.status === 'active' && student.is_active) ||
            (filters.status === 'inactive' && !student.is_active);

        // Age range filter
        const age = getAgeFromDOB(student.date_of_birth);
        let matchesAge = true;
        if (filters.ageRange) {
            switch (filters.ageRange) {
                case 'children':
                    matchesAge = age < 13;
                    break;
                case 'teens':
                    matchesAge = age >= 13 && age < 18;
                    break;
                case 'adults':
                    matchesAge = age >= 18;
                    break;
                default:
                    matchesAge = true;
            }
        }

        return matchesSearch && matchesBelt && matchesBranch && matchesStatus && matchesAge;
    });

    const sortedStudents = [...filteredStudents].sort((a, b) => {
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
        // Theme-aware belt colors for better contrast
        const colors = {
            'white': isDarkMode ? '#e5e7eb' : '#6b7280', // Light gray for dark mode, darker gray for light mode
            'yellow': '#f59e0b',
            'green': '#059669',
            'blue': '#2563eb',
            'red': '#dc2626',
            'black': isDarkMode ? '#9ca3af' : '#1f2937' // Lighter for dark mode, darker for light mode
        };
        return colors[beltColor] || '#6b7280';
    };

    if (loading) {
        return (
            <div className="table-loading">
                <LoadingAtom size="medium" />
                <span>Loading students...</span>
            </div>
        );
    }

    return (
        <div className="page-content">
            <div className="page-header">
                <h1>Students</h1>
                <button
                    className="btn btn-primary"
                    onClick={handleNewStudent}
                >
                    <FaPlus /> Add Student
                </button>
            </div>

            <div className="table-controls">
                <div className="search-bar">
                    <FaSearch />
                    <input
                        type="text"
                        placeholder="Search students..."
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
                        {(filters.beltLevel || filters.branch || filters.status || filters.ageRange) && (
                            <span className="filter-badge">
                                {[filters.beltLevel, filters.branch, filters.status, filters.ageRange].filter(Boolean).length}
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
                                        {getStudentBeltRanks().map(belt => (
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

                                <div className="filter-group">
                                    <label>Status</label>
                                    <select
                                        value={filters.status}
                                        onChange={(e) => handleFilterChange('status', e.target.value)}
                                    >
                                        <option value="">All Status</option>
                                        <option value="active">Active</option>
                                        <option value="inactive">Inactive</option>
                                    </select>
                                </div>

                                <div className="filter-group">
                                    <label>Age Range</label>
                                    <select
                                        value={filters.ageRange}
                                        onChange={(e) => handleFilterChange('ageRange', e.target.value)}
                                    >
                                        <option value="">All Ages</option>
                                        <option value="children">Children (Under 13)</option>
                                        <option value="teens">Teens (13-17)</option>
                                        <option value="adults">Adults (18+)</option>
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
                            {sortedStudents.length === 0 ? (
                                <tr>
                                    <td colSpan="7" className="empty-state">
                                        <div className="empty-state-icon">
                                            <FaUser />
                                        </div>
                                        <h3>No students found</h3>
                                        <p>Try adjusting your search or add a new student.</p>
                                    </td>
                                </tr>
                            ) : (
                                sortedStudents.map((student) => (
                                    <tr key={student.id} className="table-row">
                                        <td>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                <div
                                                    style={{
                                                        width: '32px',
                                                        height: '32px',
                                                        borderRadius: '50%',
                                                        backgroundColor: '#3b82f6',
                                                        color: 'white',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        fontSize: '0.875rem',
                                                        fontWeight: '600'
                                                    }}
                                                >
                                                    {student.first_name[0]}{student.last_name[0]}
                                                </div>
                                                <div>
                                                    <div style={{ fontWeight: '600', color: 'var(--text-primary)' }}>
                                                        {student.first_name} {student.last_name}
                                                    </div>
                                                    <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                                                        DOB: {formatDate(student.date_of_birth)}
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
                                                    backgroundColor: getBeltColor(student.belt_color) + '20',
                                                    color: getBeltColor(student.belt_color),
                                                    fontSize: '0.875rem',
                                                    fontWeight: '600',
                                                    border: `1px solid ${getBeltColor(student.belt_color)}40`
                                                }}
                                            >
                                                {student.belt_name || 'Unknown'}
                                            </span>
                                        </td>
                                        <td>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                <FaMapMarkerAlt style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }} />
                                                {student.branch_name}
                                            </div>
                                        </td>
                                        <td>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                <FaPhone style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }} />
                                                {student.phone || 'N/A'}
                                            </div>
                                        </td>
                                        <td>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                <FaEnvelope style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }} />
                                                {student.email || 'N/A'}
                                            </div>
                                        </td>
                                        <td>
                                            <span
                                                style={{
                                                    display: 'inline-block',
                                                    padding: '0.25rem 0.75rem',
                                                    borderRadius: '9999px',
                                                    backgroundColor: student.is_active ? '#10b98120' : '#ef444420',
                                                    color: student.is_active ? '#059669' : '#dc2626',
                                                    fontSize: '0.875rem',
                                                    fontWeight: '600',
                                                    border: `1px solid ${student.is_active ? '#10b98140' : '#ef444440'}`
                                                }}
                                            >
                                                {student.is_active ? 'Active' : 'Inactive'}
                                            </span>
                                        </td>
                                        <td>
                                            <div className="action-buttons">
                                                <button
                                                    className="action-btn view"
                                                    onClick={() => handleView(student)}
                                                    title="View Details"
                                                >
                                                    <FaEye />
                                                </button>
                                                <button
                                                    className="action-btn edit"
                                                    onClick={() => handleEdit(student)}
                                                    title="Edit Student"
                                                >
                                                    <FaEdit />
                                                </button>
                                                <button
                                                    className="action-btn delete"
                                                    onClick={() => handleDeactivate(student)}
                                                    title="Deactivate Student"
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
                    {sortedStudents.length === 0 ? (
                        <div className="empty-state">
                            <div className="empty-state-icon">
                                <FaUser />
                            </div>
                            <h3>No students found</h3>
                            <p>Try adjusting your search or add a new student.</p>
                        </div>
                    ) : (
                        sortedStudents.map((student) => (
                            <div key={student.id} className="mobile-card">
                                <div className="mobile-card-header">
                                    <div
                                        className="mobile-card-avatar"
                                        style={{
                                            backgroundColor: '#3b82f6'
                                        }}
                                    >
                                        {student.first_name[0]}{student.last_name[0]}
                                    </div>
                                    <div>
                                        <h3 className="mobile-card-title">
                                            {student.first_name} {student.last_name}
                                        </h3>
                                        <p className="mobile-card-subtitle">
                                            DOB: {formatDate(student.date_of_birth)}
                                        </p>
                                    </div>
                                </div>

                                <div className="mobile-card-details">
                                    <div className="mobile-card-detail">
                                        <span className="mobile-card-detail-label">Belt Level</span>
                                        <span
                                            className="mobile-card-detail-value"
                                            style={{
                                                color: getBeltColor(student.belt_color),
                                                fontWeight: '600'
                                            }}
                                        >
                                            {student.belt_name || 'Unknown'}
                                        </span>
                                    </div>
                                    <div className="mobile-card-detail">
                                        <span className="mobile-card-detail-label">Branch</span>
                                        <span className="mobile-card-detail-value">
                                            {student.branch_name}
                                        </span>
                                    </div>
                                    <div className="mobile-card-detail">
                                        <span className="mobile-card-detail-label">Phone</span>
                                        <span className="mobile-card-detail-value">
                                            {student.phone || 'N/A'}
                                        </span>
                                    </div>
                                    <div className="mobile-card-detail">
                                        <span className="mobile-card-detail-label">Email</span>
                                        <span className="mobile-card-detail-value">
                                            {student.email || 'N/A'}
                                        </span>
                                    </div>
                                </div>

                                <div style={{ marginBottom: '1rem' }}>
                                    <span
                                        className={`mobile-card-status ${student.is_active ? 'active' : 'inactive'}`}
                                    >
                                        {student.is_active ? 'Active' : 'Inactive'}
                                    </span>
                                </div>

                                <div className="mobile-card-actions">
                                    <button
                                        className="action-btn view"
                                        onClick={() => handleView(student)}
                                        title="View Details"
                                    >
                                        <FaEye /> View
                                    </button>
                                    <button
                                        className="action-btn edit"
                                        onClick={() => handleEdit(student)}
                                        title="Edit Student"
                                    >
                                        <FaEdit /> Edit
                                    </button>
                                    <button
                                        className="action-btn delete"
                                        onClick={() => handleDeactivate(student)}
                                        title="Deactivate Student"
                                    >
                                        <FaTrash /> Deactivate
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
                    setEditingStudent(null);
                    resetForm();
                }}
                title={editingStudent ? 'Edit Student' : 'Add New Student'}
                size="large"
            >
                <form onSubmit={handleSubmit}>
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
                            <label htmlFor="belt_level_id">Belt Level</label>
                            <select
                                id="belt_level_id"
                                name="belt_level_id"
                                value={formData.belt_level_id}
                                onChange={handleInputChange}
                            >
                                <option value="">Select Belt Level</option>
                                {getStudentBeltRanks().map(rank => (
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
                            disabled={editingStudent && user?.role === 'instructor'}
                        >
                            <option value="">Select Branch</option>
                            {branches.map(branch => (
                                <option key={branch.id} value={branch.id}>
                                    {branch.name}
                                </option>
                            ))}
                        </select>
                        {editingStudent && user?.role === 'instructor' && (
                            <small className="form-help">
                                Branch cannot be changed for existing students
                            </small>
                        )}
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
                                setEditingStudent(null);
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
                                editingStudent ? 'Update Student' : 'Create Student'
                            )}
                        </button>
                    </div>
                </form>
            </Modal>

            {/* View Modal */}
            <Modal
                isOpen={showViewModal}
                onClose={() => setShowViewModal(false)}
                title="Student Details"
                size="medium"
            >
                {viewingStudent && (
                    <div>
                        <div className="form-row">
                            <div className="form-group">
                                <label>Name</label>
                                <p>{viewingStudent.first_name} {viewingStudent.last_name}</p>
                            </div>
                            <div className="form-group">
                                <label>Belt Level</label>
                                <p>{viewingStudent.belt_name || 'Unknown'}</p>
                            </div>
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label>Email</label>
                                <p>{viewingStudent.email || 'N/A'}</p>
                            </div>
                            <div className="form-group">
                                <label>Phone</label>
                                <p>{viewingStudent.phone || 'N/A'}</p>
                            </div>
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label>Date of Birth</label>
                                <p>{formatDate(viewingStudent.date_of_birth)}</p>
                            </div>
                            <div className="form-group">
                                <label>Branch</label>
                                <p>{viewingStudent.branch_name}</p>
                            </div>
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label>Emergency Contact</label>
                                <p>{viewingStudent.emergency_contact_name || 'N/A'}</p>
                            </div>
                            <div className="form-group">
                                <label>Emergency Phone</label>
                                <p>{viewingStudent.emergency_contact_phone || 'N/A'}</p>
                            </div>
                        </div>

                        <div className="form-group">
                            <label>Address</label>
                            <p>{viewingStudent.address || 'N/A'}</p>
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
                                    handleEdit(viewingStudent);
                                }}
                            >
                                Edit Student
                            </button>
                        </div>
                    </div>
                )}
            </Modal>

            {/* Deactivate Confirmation */}
            <ConfirmDialog
                isOpen={showDeactivateConfirm}
                onClose={() => {
                    setShowDeactivateConfirm(false);
                    setDeactivatingStudent(null);
                }}
                onConfirm={confirmDeactivate}
                title="Deactivate Student"
                message={`Are you sure you want to deactivate ${deactivatingStudent?.first_name} ${deactivatingStudent?.last_name}? The student will be moved to inactive status and can be restored later.`}
                type="warning"
                confirmText="Deactivate"
                cancelText="Cancel"
            />
        </div>
    );
};

export default Students;