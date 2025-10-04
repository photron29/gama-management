import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import LoadingAtom from '../components/LoadingAtom';
import {
    FaTrash,
    FaUndo,
    FaSearch,
    FaUser,
    FaPhone,
    FaEnvelope,
    FaCalendar,
    FaMapMarkerAlt,
    FaExclamationTriangle
} from 'react-icons/fa';
import { apiClient } from '../utils/api';

const InactiveStudents = () => {
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchInactiveStudents();
    }, []);

    const fetchInactiveStudents = async () => {
        try {
            setLoading(true);
            const data = await apiClient.getInactiveStudents();
            setStudents(data.students);
        } catch (error) {
            console.error('Error fetching inactive students:', error);
            toast.error('Failed to fetch inactive students');
        } finally {
            setLoading(false);
        }
    };

    const handleRestore = async (id) => {
        if (window.confirm('Are you sure you want to restore this student?')) {
            try {
                await apiClient.restoreStudent(id);
                toast.success('Student restored successfully');
                fetchInactiveStudents();
            } catch (error) {
                console.error('Error restoring student:', error);
                toast.error('Failed to restore student');
            }
        }
    };

    const handlePermanentDelete = async (id) => {
        if (window.confirm('Are you sure you want to PERMANENTLY delete this student? This action cannot be undone and will delete all related attendance and fee records.')) {
            try {
                await apiClient.deleteStudent(id, true);
                toast.success('Student permanently deleted');
                fetchInactiveStudents();
            } catch (error) {
                console.error('Error permanently deleting student:', error);
                toast.error('Failed to permanently delete student');
            }
        }
    };

    const filteredStudents = students.filter(student =>
        `${student.first_name} ${student.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.branch_name?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) {
        return (
            <div className="table-loading">
                <LoadingAtom size="medium" />
                <span>Loading inactive students...</span>
            </div>
        );
    }

    return (
        <div className="page-content">
            <div className="page-header">
                <h1>Inactive Students</h1>
                <div className="search-bar">
                    <FaSearch className="search-icon" />
                    <input
                        type="text"
                        placeholder="Search inactive students..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {students.length === 0 ? (
                <div className="empty-state">
                    <FaExclamationTriangle className="empty-icon" />
                    <h3>No Inactive Students</h3>
                    <p>There are no inactive students to manage.</p>
                </div>
            ) : (
                <div className="students-grid">
                    {filteredStudents.map(student => (
                        <div key={student.id} className="student-card inactive">
                            <div className="student-header">
                                <FaUser className="student-icon" />
                                <div>
                                    <h3>{student.first_name} {student.last_name}</h3>
                                    <p className="student-branch">{student.branch_name}</p>
                                    <span className="inactive-badge">Inactive</span>
                                </div>
                            </div>

                            <div className="student-details">
                                {student.email && (
                                    <p><FaEnvelope /> {student.email}</p>
                                )}
                                {student.phone && (
                                    <p><FaPhone /> {student.phone}</p>
                                )}
                                {student.date_of_birth && (
                                    <p><FaCalendar /> {new Date(student.date_of_birth).toLocaleDateString()}</p>
                                )}
                                {student.address && (
                                    <p><FaMapMarkerAlt /> {student.address}</p>
                                )}
                                <p><strong>Belt Level:</strong> {student.belt_level}</p>
                                <p><strong>Deactivated:</strong> {new Date(student.updated_at).toLocaleDateString()}</p>
                            </div>

                            <div className="student-actions">
                                <button
                                    className="btn btn-success btn-sm"
                                    onClick={() => handleRestore(student.id)}
                                    title="Restore Student"
                                >
                                    <FaUndo /> Restore
                                </button>
                                <button
                                    className="btn btn-danger btn-sm"
                                    onClick={() => handlePermanentDelete(student.id)}
                                    title="Permanently Delete"
                                >
                                    <FaTrash /> Delete Forever
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {filteredStudents.length === 0 && students.length > 0 && (
                <div className="no-results">
                    <p>No inactive students match your search criteria.</p>
                </div>
            )}
        </div>
    );
};

export default InactiveStudents;
