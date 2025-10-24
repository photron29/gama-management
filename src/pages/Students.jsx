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
    FaFilter
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
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [editingStudent, setEditingStudent] = useState(null);
    const [viewingStudent, setViewingStudent] = useState(null);
    const [deletingStudent, setDeletingStudent] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        date_of_birth: '',
        belt_level: '',
        branch_id: '',
        emergency_contact_name: '',
        emergency_contact_phone: '',
        address: '',
        notes: ''
    });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            // For instructors, get only students from their assigned branches
            const params = user?.role === 'instructor' ? { instructor_id: user.id } : {};
            
            const [studentsData, branchesData] = await Promise.all([
                apiClient.getStudents(params),
                apiClient.getBranches()
            ]);
            setStudents(studentsData.students || []);
            setBranches(branchesData.branches || []);
        } catch (error) {
            console.error('Error fetching data:', error);
            toast.error('Failed to fetch students data');
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

    const handleFilterChange = (field, value) => {
        setFilters(prev => ({
            ...prev,
            [field]: value
        }));
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
        if (sortField !== field) return <FaSort className="text-gray-400" />;
        return sortDirection === 'asc' ? <FaSortUp /> : <FaSortDown />;
    };

    const filteredStudents = students.filter(student => {
        const matchesSearch = !searchTerm || 
            student.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            student.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            student.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
            student.phone.includes(searchTerm);
        
        const matchesBelt = !filters.beltLevel || student.belt_level === filters.beltLevel;
        const matchesBranch = !filters.branch || student.branch_id === filters.branch;
        const matchesStatus = !filters.status || (filters.status === 'active' ? student.is_active : !student.is_active);
        
        return matchesSearch && matchesBelt && matchesBranch && matchesStatus;
    });

    const sortedStudents = [...filteredStudents].sort((a, b) => {
        let aValue = a[sortField];
        let bValue = b[sortField];
        
        if (sortField === 'branch_name') {
            aValue = a.branch_name || '';
            bValue = b.branch_name || '';
        }
        
        if (typeof aValue === 'string') {
            aValue = aValue.toLowerCase();
            bValue = bValue.toLowerCase();
        }
        
        if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
        return 0;
    });

    const handleNewStudent = () => {
        setFormData({
            name: '',
            email: '',
            phone: '',
            date_of_birth: '',
            belt_level: '',
            branch_id: '',
            emergency_contact_name: '',
            emergency_contact_phone: '',
            address: '',
            notes: ''
        });
        setEditingStudent(null);
        setShowModal(true);
    };

    const handleEditStudent = (student) => {
        setFormData({
            name: `${student.first_name} ${student.last_name}`,
            email: student.email || '',
            phone: student.phone || '',
            date_of_birth: student.date_of_birth || '',
            belt_level: student.belt_level || '',
            branch_id: student.branch_id || '',
            emergency_contact_name: student.emergency_contact_name || '',
            emergency_contact_phone: student.emergency_contact_phone || '',
            address: student.address || '',
            notes: student.notes || ''
        });
        setEditingStudent(student);
        setShowModal(true);
    };

    const handleViewStudent = (student) => {
        setViewingStudent(student);
        setShowViewModal(true);
    };

    const handleDeleteStudent = (student) => {
        setDeletingStudent(student);
        setShowDeleteConfirm(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            const [firstName, ...lastNameParts] = formData.name.split(' ');
            const lastName = lastNameParts.join(' ');

            const dataToSubmit = {
                first_name: firstName,
                last_name: lastName,
                email: formData.email,
                phone: formData.phone,
                date_of_birth: formData.date_of_birth,
                belt_level: formData.belt_level,
                branch_id: formData.branch_id,
                emergency_contact_name: formData.emergency_contact_name,
                emergency_contact_phone: formData.emergency_contact_phone,
                address: formData.address,
                notes: formData.notes
            };

            if (editingStudent) {
                await apiClient.updateStudent(editingStudent.id, dataToSubmit);
                toast.success('Student updated successfully');
            } else {
                await apiClient.createStudent(dataToSubmit);
                toast.success('Student created successfully');
            }

            setShowModal(false);
            fetchData();
        } catch (error) {
            console.error('Error saving student:', error);
            toast.error(error.message || 'Failed to save student');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async () => {
        try {
            await apiClient.deleteStudent(deletingStudent.id);
            toast.success('Student deleted successfully');
            setShowDeleteConfirm(false);
            fetchData();
        } catch (error) {
            console.error('Error deleting student:', error);
            toast.error('Failed to delete student');
        }
    };

    const resetForm = () => {
        setFormData({
            name: '',
            email: '',
            phone: '',
            date_of_birth: '',
            belt_level: '',
            branch_id: '',
            emergency_contact_name: '',
            emergency_contact_phone: '',
            address: '',
            notes: ''
        });
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString();
    };

    const getBeltColor = (beltLevel) => {
        const colors = {
            'white': 'from-gray-100 to-gray-200',
            'yellow': 'from-yellow-400 to-yellow-500',
            'orange': 'from-orange-400 to-orange-500',
            'green': 'from-green-400 to-green-500',
            'blue': 'from-blue-400 to-blue-500',
            'brown': 'from-amber-600 to-amber-700',
            'black': 'from-gray-800 to-gray-900'
        };
        return colors[beltLevel] || 'from-gray-400 to-gray-500';
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <LoadingAtom size="large" />
                    <p className="mt-4 text-lg text-gray-600 font-medium">Loading students...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Modern Header */}
                <div className="mb-8">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">Student Management</h1>
                            <p className="text-gray-600 mt-2">Manage your martial arts students and their progress</p>
                        </div>
                        <button
                            className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-xl font-semibold hover:from-blue-700 hover:to-purple-700 transition-all duration-200 flex items-center space-x-2 shadow-lg hover:shadow-xl"
                            onClick={handleNewStudent}
                        >
                            <FaPlus className="h-5 w-5" />
                            <span>Add Student</span>
                        </button>
                    </div>
                </div>

                {/* Modern Controls */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-8">
                    <div className="flex flex-col lg:flex-row gap-4">
                        <div className="flex-1 relative">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                <FaSearch className="h-5 w-5 text-gray-400" />
                            </div>
                            <input
                                type="text"
                                placeholder="Search students by name, contact, or belt..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-gray-700 placeholder-gray-400"
                            />
                        </div>

                        <div className="flex items-center space-x-4">
                            <button
                                className="flex items-center space-x-2 px-4 py-3 bg-gray-50 text-gray-700 rounded-xl hover:bg-gray-100 hover:shadow-md transition-all duration-200 font-medium border border-gray-200 hover:border-gray-300"
                                onClick={() => setShowFilters(!showFilters)}
                            >
                                <FaFilter className="h-4 w-4" />
                                <span>Filters</span>
                                {(filters.beltLevel || filters.branch || filters.status) && (
                                    <span className="bg-blue-600 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                                        {[filters.beltLevel, filters.branch, filters.status].filter(Boolean).length}
                                    </span>
                                )}
                            </button>
                        </div>
                    </div>

                    {showFilters && (
                        <div className="mt-6 p-6 bg-gray-50 rounded-xl border border-gray-200">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Belt Level</label>
                                    <select
                                        value={filters.beltLevel}
                                        onChange={(e) => handleFilterChange('beltLevel', e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-gray-700"
                                    >
                                        <option value="">All Belts</option>
                                        {getStudentBeltRanks().map(belt => (
                                            <option key={belt.id} value={belt.name}>{belt.name}</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Branch</label>
                                    <select
                                        value={filters.branch}
                                        onChange={(e) => handleFilterChange('branch', e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-gray-700"
                                    >
                                        <option value="">All Branches</option>
                                        {branches.map(branch => (
                                            <option key={branch.id} value={branch.id}>{branch.name}</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Status</label>
                                    <select
                                        value={filters.status}
                                        onChange={(e) => handleFilterChange('status', e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-gray-700"
                                    >
                                        <option value="">All Status</option>
                                        <option value="active">Active</option>
                                        <option value="inactive">Inactive</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Age Range</label>
                                    <select
                                        value={filters.ageRange}
                                        onChange={(e) => handleFilterChange('ageRange', e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-gray-700"
                                    >
                                        <option value="">All Ages</option>
                                        <option value="5-10">5-10 years</option>
                                        <option value="11-15">11-15 years</option>
                                        <option value="16-20">16-20 years</option>
                                        <option value="21+">21+ years</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Modern Student Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {sortedStudents.length === 0 ? (
                        <div className="col-span-full flex flex-col items-center justify-center py-16">
                            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-6">
                                <FaUser className="text-4xl text-gray-400" />
                            </div>
                            <h3 className="text-xl font-semibold text-gray-700 mb-2">No students found</h3>
                            <p className="text-gray-500">Try adjusting your search or add a new student.</p>
                        </div>
                    ) : (
                        sortedStudents.map((student) => (
                            <div key={student.id} className="group bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden border border-gray-200 hover:border-blue-300 hover:scale-[1.02]">
                                {/* Card Header */}
                                <div className="bg-gradient-to-r from-blue-500 to-purple-500 p-6 text-white">
                                    <div className="flex items-center space-x-4">
                                        <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                                            <span className="text-lg font-bold">
                                                {student.first_name[0]}{student.last_name[0]}
                                            </span>
                                        </div>
                                        <div className="flex-1">
                                            <h3 className="text-xl font-bold">{student.first_name} {student.last_name}</h3>
                                            <p className="text-blue-100 text-sm">DOB: {formatDate(student.date_of_birth)}</p>
                                        </div>
                                        <div className="text-right">
                                            <span className={`inline-block px-3 py-1 bg-white/20 rounded-full text-sm font-medium backdrop-blur-sm ${
                                                student.is_active ? 'text-green-100' : 'text-red-100'
                                            }`}>
                                                {student.is_active ? 'Active' : 'Inactive'}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Card Details */}
                                <div className="p-6 space-y-4">
                                    {/* Belt Level */}
                                    <div className="flex items-center space-x-3 p-3 bg-blue-50 rounded-xl">
                                        <div className={`w-8 h-8 rounded-full bg-gradient-to-r ${getBeltColor(student.belt_level)} flex items-center justify-center text-white text-sm font-bold`}>
                                            {formatBeltRank(student.belt_level)[0]}
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-gray-600">Belt Level</p>
                                            <p className="text-lg font-semibold text-gray-900">{formatBeltRank(student.belt_level)}</p>
                                        </div>
                                    </div>

                                    {/* Branch */}
                                    <div className="flex items-center space-x-3 p-3 bg-green-50 rounded-xl">
                                        <FaMapMarkerAlt className="h-5 w-5 text-green-600" />
                                        <div>
                                            <p className="text-sm font-medium text-gray-600">Branch</p>
                                            <p className="text-lg font-semibold text-gray-900">{student.branch_name}</p>
                                        </div>
                                    </div>

                                    {/* Contact Info */}
                                    <div className="space-y-2">
                                        <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-xl">
                                            <FaPhone className="h-4 w-4 text-gray-600" />
                                            <span className="text-sm text-gray-700">{student.phone}</span>
                                        </div>
                                        <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-xl">
                                            <FaEnvelope className="h-4 w-4 text-gray-600" />
                                            <span className="text-sm text-gray-700">{student.email}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Action Buttons */}
                                <div className="p-6 pt-0 flex space-x-2">
                                    <button
                                        className="flex-1 flex items-center justify-center space-x-2 px-4 py-3 bg-blue-50 text-blue-700 rounded-xl hover:bg-blue-100 hover:shadow-md transition-all duration-200 font-medium border border-blue-200 hover:border-blue-300"
                                        onClick={() => handleViewStudent(student)}
                                    >
                                        <FaEye className="h-4 w-4" />
                                        <span>View</span>
                                    </button>
                                    <button
                                        className="flex-1 flex items-center justify-center space-x-2 px-4 py-3 bg-green-50 text-green-700 rounded-xl hover:bg-green-100 hover:shadow-md transition-all duration-200 font-medium border border-green-200 hover:border-green-300"
                                        onClick={() => handleEditStudent(student)}
                                    >
                                        <FaEdit className="h-4 w-4" />
                                        <span>Edit</span>
                                    </button>
                                    <button
                                        className="flex-1 flex items-center justify-center space-x-2 px-4 py-3 bg-red-50 text-red-700 rounded-xl hover:bg-red-100 hover:shadow-md transition-all duration-200 font-medium border border-red-200 hover:border-red-300"
                                        onClick={() => handleDeleteStudent(student)}
                                    >
                                        <FaTrash className="h-4 w-4" />
                                        <span>Delete</span>
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
                        setEditingStudent(null);
                        resetForm();
                    }}
                    title={editingStudent ? 'Edit Student' : 'Add New Student'}
                    size="large"
                >
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center">
                                    <span>Full Name</span>
                                    <span className="text-red-500 ml-1">*</span>
                                </label>
                                <input
                                    type="text"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleInputChange}
                                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 text-gray-700 placeholder-gray-400 hover:border-gray-300"
                                    placeholder="Enter full name"
                                    required
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
                                    onChange={handleInputChange}
                                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 text-gray-700 placeholder-gray-400 hover:border-gray-300"
                                    placeholder="Enter email address"
                                    required
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Phone</label>
                                <input
                                    type="tel"
                                    name="phone"
                                    value={formData.phone}
                                    onChange={handleInputChange}
                                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 text-gray-700 placeholder-gray-400 hover:border-gray-300"
                                    placeholder="Enter phone number"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Date of Birth</label>
                                <input
                                    type="date"
                                    name="date_of_birth"
                                    value={formData.date_of_birth}
                                    onChange={handleInputChange}
                                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 text-gray-700 hover:border-gray-300"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Belt Level</label>
                                <select
                                    name="belt_level"
                                    value={formData.belt_level}
                                    onChange={handleInputChange}
                                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 text-gray-700 hover:border-gray-300 bg-white"
                                >
                                    <option value="">Select Belt Level</option>
                                    {getStudentBeltRanks().map(belt => (
                                        <option key={belt.id} value={belt.name}>{belt.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center">
                                    <span>Branch</span>
                                    <span className="text-red-500 ml-1">*</span>
                                </label>
                                <select
                                    name="branch_id"
                                    value={formData.branch_id}
                                    onChange={handleInputChange}
                                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 text-gray-700 hover:border-gray-300 bg-white"
                                    required
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
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Emergency Contact Name</label>
                                <input
                                    type="text"
                                    name="emergency_contact_name"
                                    value={formData.emergency_contact_name}
                                    onChange={handleInputChange}
                                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 text-gray-700 placeholder-gray-400 hover:border-gray-300"
                                    placeholder="Enter emergency contact name"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Emergency Contact Phone</label>
                                <input
                                    type="tel"
                                    name="emergency_contact_phone"
                                    value={formData.emergency_contact_phone}
                                    onChange={handleInputChange}
                                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 text-gray-700 placeholder-gray-400 hover:border-gray-300"
                                    placeholder="Enter emergency contact phone"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Address</label>
                            <input
                                type="text"
                                name="address"
                                value={formData.address}
                                onChange={handleInputChange}
                                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 text-gray-700 placeholder-gray-400 hover:border-gray-300"
                                placeholder="Enter address"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Notes</label>
                            <textarea
                                name="notes"
                                value={formData.notes}
                                onChange={handleInputChange}
                                rows={3}
                                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 text-gray-700 placeholder-gray-400 hover:border-gray-300 resize-none"
                                placeholder="Enter any additional notes"
                            />
                        </div>

                        <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
                            <button
                                type="button"
                                onClick={() => {
                                    setShowModal(false);
                                    setEditingStudent(null);
                                    resetForm();
                                }}
                                className="px-6 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-all duration-200 font-medium border border-gray-200 hover:border-gray-300"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all duration-200 font-medium disabled:opacity-50 shadow-lg hover:shadow-xl disabled:shadow-none"
                            >
                                {isSubmitting ? 'Saving...' : (editingStudent ? 'Update Student' : 'Create Student')}
                            </button>
                        </div>
                    </form>
                </Modal>

                {/* View Modal */}
                <Modal
                    isOpen={showViewModal}
                    onClose={() => setShowViewModal(false)}
                    title="Student Details"
                >
                    {viewingStudent && (
                        <div className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Name</label>
                                    <p className="text-lg text-gray-900">{viewingStudent.first_name} {viewingStudent.last_name}</p>
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Email</label>
                                    <p className="text-lg text-gray-900">{viewingStudent.email}</p>
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Phone</label>
                                    <p className="text-lg text-gray-900">{viewingStudent.phone}</p>
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Belt Level</label>
                                    <p className="text-lg text-gray-900">{formatBeltRank(viewingStudent.belt_level)}</p>
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Branch</label>
                                    <p className="text-lg text-gray-900">{viewingStudent.branch_name}</p>
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Status</label>
                                    <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                                        viewingStudent.is_active 
                                            ? 'bg-green-100 text-green-800' 
                                            : 'bg-red-100 text-red-800'
                                    }`}>
                                        {viewingStudent.is_active ? 'Active' : 'Inactive'}
                                    </span>
                                </div>
                            </div>
                        </div>
                    )}
                </Modal>

                {/* Delete Confirmation */}
                <ConfirmDialog
                    isOpen={showDeleteConfirm}
                    onClose={() => setShowDeleteConfirm(false)}
                    onConfirm={handleDelete}
                    title="Delete Student"
                    message={`Are you sure you want to delete ${deletingStudent?.first_name} ${deletingStudent?.last_name}?`}
                    confirmText="Delete"
                    cancelText="Cancel"
                    type="delete"
                />
            </div>
        </div>
    );
};

export default Students;