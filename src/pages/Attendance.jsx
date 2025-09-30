import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import {
    FaPlus,
    FaEdit,
    FaTrash,
    FaSearch,
    FaCalendar,
    FaUser,
    FaCheck,
    FaTimes,
    FaClock
} from 'react-icons/fa';
import { apiClient } from '../utils/api';

const Attendance = () => {
    const [attendance, setAttendance] = useState([]);
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingRecord, setEditingRecord] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('');

    const [formData, setFormData] = useState({
        student_id: '',
        class_date: '',
        status: 'present',
        notes: ''
    });

    useEffect(() => {
        fetchAttendance();
        fetchStudents();
    }, []);

    const fetchAttendance = async () => {
        try {
            const data = await apiClient.getAttendance();
            setAttendance(data.attendance);
        } catch (error) {
            toast.error('Failed to fetch attendance');
        } finally {
            setLoading(false);
        }
    };

    const fetchStudents = async () => {
        try {
            const data = await apiClient.getStudents();
            setStudents(data.students);
        } catch (error) {
            console.error('Failed to fetch students:', error);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingRecord) {
                await apiClient.updateAttendance(editingRecord.id, formData);
                toast.success('Attendance updated successfully');
            } else {
                await apiClient.createAttendance(formData);
                toast.success('Attendance recorded successfully');
            }
            setShowModal(false);
            setEditingRecord(null);
            resetForm();
            fetchAttendance();
        } catch (error) {
            toast.error(error.message || 'Failed to save attendance');
        }
    };

    const handleEdit = (record) => {
        setEditingRecord(record);
        setFormData({
            student_id: record.student_id,
            class_date: record.class_date,
            status: record.status,
            notes: record.notes || ''
        });
        setShowModal(true);
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this attendance record?')) {
            try {
                await apiClient.deleteAttendance(id);
                toast.success('Attendance record deleted successfully');
                fetchAttendance();
            } catch (error) {
                toast.error('Failed to delete attendance record');
            }
        }
    };

    const resetForm = () => {
        setFormData({
            student_id: '',
            class_date: new Date().toISOString().split('T')[0],
            status: 'present',
            notes: ''
        });
    };

    const openModal = () => {
        setEditingRecord(null);
        resetForm();
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        setEditingRecord(null);
        resetForm();
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'present':
                return <FaCheck className="status-icon present" />;
            case 'absent':
                return <FaTimes className="status-icon absent" />;
            case 'late':
                return <FaClock className="status-icon late" />;
            default:
                return null;
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'present':
                return 'green';
            case 'absent':
                return 'red';
            case 'late':
                return 'orange';
            default:
                return 'gray';
        }
    };

    const filteredAttendance = attendance.filter(record => {
        const matchesSearch = `${record.first_name} ${record.last_name}`.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = !filterStatus || record.status === filterStatus;
        return matchesSearch && matchesStatus;
    });

    if (loading) {
        return <div className="loading">Loading attendance...</div>;
    }

    return (
        <div className="attendance-page">
            <div className="page-header">
                <h1>Attendance</h1>
                <button className="btn btn-primary" onClick={openModal}>
                    <FaPlus /> Record Attendance
                </button>
            </div>

            <div className="filters">
                <div className="search-input">
                    <FaSearch className="search-icon" />
                    <input
                        type="text"
                        placeholder="Search students..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="filter-select"
                >
                    <option value="">All Status</option>
                    <option value="present">Present</option>
                    <option value="absent">Absent</option>
                    <option value="late">Late</option>
                </select>
            </div>

            <div className="attendance-list">
                {filteredAttendance.map((record) => (
                    <div key={record.id} className="attendance-card">
                        <div className="attendance-header">
                            <div className="student-info">
                                <FaUser className="student-icon" />
                                <div>
                                    <h3>{record.first_name} {record.last_name}</h3>
                                    <p>{record.branch_name} • {record.belt_level}</p>
                                </div>
                            </div>
                            <div className={`status-badge ${getStatusColor(record.status)}`}>
                                {getStatusIcon(record.status)}
                                {record.status}
                            </div>
                        </div>

                        <div className="attendance-details">
                            <div className="detail-item">
                                <FaCalendar />
                                <span>{new Date(record.class_date).toLocaleDateString()}</span>
                            </div>
                            {record.notes && (
                                <div className="notes">
                                    <strong>Notes:</strong> {record.notes}
                                </div>
                            )}
                        </div>

                        <div className="attendance-actions">
                            <button
                                className="btn btn-sm btn-secondary"
                                onClick={() => handleEdit(record)}
                            >
                                <FaEdit /> Edit
                            </button>
                            <button
                                className="btn btn-sm btn-danger"
                                onClick={() => handleDelete(record.id)}
                            >
                                <FaTrash /> Delete
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {showModal && (
                <div className="modal-overlay" onClick={closeModal}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>{editingRecord ? 'Edit Attendance' : 'Record Attendance'}</h2>
                            <button className="modal-close" onClick={closeModal}>×</button>
                        </div>

                        <form onSubmit={handleSubmit} className="modal-form">
                            <div className="form-group">
                                <label>Student *</label>
                                <select
                                    value={formData.student_id}
                                    onChange={(e) => setFormData({ ...formData, student_id: e.target.value })}
                                    required
                                >
                                    <option value="">Select Student</option>
                                    {students.map(student => (
                                        <option key={student.id} value={student.id}>
                                            {student.first_name} {student.last_name} ({student.branch_name})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="form-group">
                                <label>Class Date *</label>
                                <input
                                    type="date"
                                    value={formData.class_date}
                                    onChange={(e) => setFormData({ ...formData, class_date: e.target.value })}
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label>Status *</label>
                                <select
                                    value={formData.status}
                                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                                    required
                                >
                                    <option value="present">Present</option>
                                    <option value="absent">Absent</option>
                                    <option value="late">Late</option>
                                </select>
                            </div>

                            <div className="form-group">
                                <label>Notes</label>
                                <textarea
                                    value={formData.notes}
                                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                    rows="3"
                                    placeholder="Optional notes about the attendance..."
                                />
                            </div>

                            <div className="modal-actions">
                                <button type="button" className="btn btn-secondary" onClick={closeModal}>
                                    Cancel
                                </button>
                                <button type="submit" className="btn btn-primary">
                                    {editingRecord ? 'Update Attendance' : 'Record Attendance'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Attendance;
