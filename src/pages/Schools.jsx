import React, { useState, useEffect } from 'react';
import { FaPlus, FaEdit, FaTrash, FaSchool, FaUsers, FaMapMarkerAlt } from 'react-icons/fa';
import { toast } from 'react-toastify';
import { apiClient } from '../utils/api';

const Schools = () => {
    const [schools, setSchools] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingSchool, setEditingSchool] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        address: '',
        phone: '',
        email: '',
        principal: '',
        established: '',
        type: 'public'
    });

    useEffect(() => {
        fetchSchools();
    }, []);

    const fetchSchools = async () => {
        try {
            setLoading(true);
            const data = await apiClient.getSchools();
            // Transform branches data to schools format
            const schoolsData = data.map(branch => ({
                id: branch.id,
                name: branch.name,
                address: branch.address,
                phone: branch.phone,
                email: branch.email || '',
                principal: branch.manager || '',
                established: '2020', // Default value
                type: 'public', // Default value
                students: parseInt(branch.students) || 0,
                instructors: parseInt(branch.instructors) || 0,
                programs: ['Karate', 'Taekwondo'] // Default programs
            }));
            setSchools(schoolsData);
        } catch (error) {
            console.error('Error fetching schools:', error);
            toast.error('Failed to fetch schools');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            let data;
            if (editingSchool) {
                data = await apiClient.updateSchool(editingSchool.id, formData);
                setSchools(schools.map(school =>
                    school.id === editingSchool.id ? data : school
                ));
                toast.success('School updated successfully');
            } else {
                data = await apiClient.createSchool(formData);
                setSchools([...schools, data]);
                toast.success('School added successfully');
            }

            setShowModal(false);
            setEditingSchool(null);
            setFormData({
                name: '',
                address: '',
                phone: '',
                email: '',
                principal: '',
                established: '',
                type: 'public'
            });
        } catch (error) {
            console.error('Error saving school:', error);
            toast.error('Failed to save school');
        }
    };

    const handleEdit = (school) => {
        setEditingSchool(school);
        setFormData({
            name: school.name,
            address: school.address,
            phone: school.phone,
            email: school.email,
            principal: school.principal,
            established: school.established,
            type: school.type
        });
        setShowModal(true);
    };

    const handleDelete = async (schoolId) => {
        if (window.confirm('Are you sure you want to delete this school?')) {
            try {
                await apiClient.deleteSchool(schoolId);
                setSchools(schools.filter(school => school.id !== schoolId));
                toast.success('School deleted successfully');
            } catch (error) {
                console.error('Error deleting school:', error);
                toast.error('Failed to delete school');
            }
        }
    };

    if (loading) {
        return (
            <div className="page-content">
                <div className="loading">Loading schools...</div>
            </div>
        );
    }

    return (
        <div className="page-content">
            <div className="page-header">
                <h1>Schools</h1>
                <button
                    className="btn btn-primary"
                    onClick={() => setShowModal(true)}
                >
                    <FaPlus /> Add School
                </button>
            </div>

            <div className="schools-grid">
                {schools.map(school => (
                    <div key={school.id} className="school-card">
                        <div className="school-header">
                            <FaSchool className="school-icon" />
                            <div>
                                <h3>{school.name}</h3>
                                <p className="school-principal">Principal: {school.principal}</p>
                                <span className={`school-type ${school.type}`}>
                                    {school.type === 'public' ? 'Public School' : 'Private Academy'}
                                </span>
                            </div>
                        </div>

                        <div className="school-details">
                            <p><FaMapMarkerAlt /> {school.address}</p>
                            <p>📞 {school.phone}</p>
                            <p>✉️ {school.email}</p>
                            <p>Established: {school.established}</p>
                        </div>

                        <div className="school-stats">
                            <div className="stat">
                                <FaUsers className="stat-icon" />
                                <span className="stat-number">{school.students}</span>
                                <span className="stat-label">Students</span>
                            </div>
                            <div className="stat">
                                <span className="stat-number">{school.programs.length}</span>
                                <span className="stat-label">Programs</span>
                            </div>
                        </div>

                        <div className="school-programs">
                            <h4>Programs Offered:</h4>
                            <div className="programs-list">
                                {school.programs.map((program, index) => (
                                    <span key={index} className="program-tag">
                                        {program}
                                    </span>
                                ))}
                            </div>
                        </div>

                        <div className="school-actions">
                            <button
                                className="btn btn-secondary btn-sm"
                                onClick={() => handleEdit(school)}
                            >
                                <FaEdit /> Edit
                            </button>
                            <button
                                className="btn btn-danger btn-sm"
                                onClick={() => handleDelete(school.id)}
                            >
                                <FaTrash /> Delete
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {/* Modal */}
            {showModal && (
                <div className="modal-overlay">
                    <div className="modal">
                        <div className="modal-header">
                            <h2>{editingSchool ? 'Edit School' : 'Add New School'}</h2>
                            <button
                                className="modal-close"
                                onClick={() => {
                                    setShowModal(false);
                                    setEditingSchool(null);
                                    setFormData({
                                        name: '',
                                        address: '',
                                        phone: '',
                                        email: '',
                                        principal: '',
                                        established: '',
                                        type: 'public'
                                    });
                                }}
                            >
                                ×
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="modal-form">
                            <div className="form-group">
                                <label>School Name</label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label>Address</label>
                                <textarea
                                    value={formData.address}
                                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                    required
                                />
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label>Phone</label>
                                    <input
                                        type="tel"
                                        value={formData.phone}
                                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                        required
                                    />
                                </div>

                                <div className="form-group">
                                    <label>Email</label>
                                    <input
                                        type="email"
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label>Principal</label>
                                    <input
                                        type="text"
                                        value={formData.principal}
                                        onChange={(e) => setFormData({ ...formData, principal: e.target.value })}
                                        required
                                    />
                                </div>

                                <div className="form-group">
                                    <label>Established Year</label>
                                    <input
                                        type="number"
                                        value={formData.established}
                                        onChange={(e) => setFormData({ ...formData, established: e.target.value })}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="form-group">
                                <label>School Type</label>
                                <select
                                    value={formData.type}
                                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                                    required
                                >
                                    <option value="public">Public School</option>
                                    <option value="private">Private Academy</option>
                                </select>
                            </div>

                            <div className="modal-actions">
                                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                                    Cancel
                                </button>
                                <button type="submit" className="btn btn-primary">
                                    {editingSchool ? 'Update School' : 'Add School'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Schools;
