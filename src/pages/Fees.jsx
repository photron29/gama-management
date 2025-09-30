import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import {
    FaPlus,
    FaEdit,
    FaTrash,
    FaSearch,
    FaRupeeSign,
    FaUser,
    FaCalendar,
    FaCreditCard,
    FaCheck,
    FaClock,
    FaExclamationTriangle
} from 'react-icons/fa';
import { apiClient } from '../utils/api';

const Fees = () => {
    const [fees, setFees] = useState([]);
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingFee, setEditingFee] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('');

    const [formData, setFormData] = useState({
        student_id: '',
        amount: '',
        fee_type: 'monthly',
        due_date: '',
        payment_method: '',
        notes: ''
    });

    useEffect(() => {
        fetchFees();
        fetchStudents();
    }, []);

    const fetchFees = async () => {
        try {
            const data = await apiClient.getFees();
            setFees(data.fees);
        } catch (error) {
            toast.error('Failed to fetch fees');
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
            if (editingFee) {
                await apiClient.updateFee(editingFee.id, formData);
                toast.success('Fee updated successfully');
            } else {
                await apiClient.createFee(formData);
                toast.success('Fee created successfully');
            }
            setShowModal(false);
            setEditingFee(null);
            resetForm();
            fetchFees();
        } catch (error) {
            toast.error(error.message || 'Failed to save fee');
        }
    };

    const handleEdit = (fee) => {
        setEditingFee(fee);
        setFormData({
            student_id: fee.student_id,
            amount: fee.amount,
            fee_type: fee.fee_type,
            due_date: fee.due_date || '',
            payment_method: fee.payment_method || '',
            notes: fee.notes || ''
        });
        setShowModal(true);
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this fee record?')) {
            try {
                await apiClient.deleteFee(id);
                toast.success('Fee record deleted successfully');
                fetchFees();
            } catch (error) {
                toast.error('Failed to delete fee record');
            }
        }
    };

    const handleMarkPaid = async (fee) => {
        try {
            await apiClient.updateFee(fee.id, {
                ...fee,
                status: 'paid',
                paid_date: new Date().toISOString().split('T')[0]
            });
            toast.success('Fee marked as paid');
            fetchFees();
        } catch (error) {
            toast.error('Failed to mark fee as paid');
        }
    };

    const resetForm = () => {
        setFormData({
            student_id: '',
            amount: '',
            fee_type: 'monthly',
            due_date: '',
            payment_method: '',
            notes: ''
        });
    };

    const openModal = () => {
        setEditingFee(null);
        resetForm();
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        setEditingFee(null);
        resetForm();
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'paid':
                return <FaCheck className="status-icon paid" />;
            case 'pending':
                return <FaClock className="status-icon pending" />;
            case 'overdue':
                return <FaExclamationTriangle className="status-icon overdue" />;
            default:
                return null;
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'paid':
                return 'green';
            case 'pending':
                return 'orange';
            case 'overdue':
                return 'red';
            default:
                return 'gray';
        }
    };

    const filteredFees = fees.filter(fee => {
        const matchesSearch = `${fee.first_name} ${fee.last_name}`.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = !filterStatus || fee.status === filterStatus;
        return matchesSearch && matchesStatus;
    });

    if (loading) {
        return <div className="loading">Loading fees...</div>;
    }

    return (
        <div className="fees-page">
            <div className="page-header">
                <h1>Fees</h1>
                <button className="btn btn-primary" onClick={openModal}>
                    <FaPlus /> Add Fee
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
                    <option value="paid">Paid</option>
                    <option value="pending">Pending</option>
                    <option value="overdue">Overdue</option>
                </select>
            </div>

            <div className="fees-list">
                {filteredFees.map((fee) => (
                    <div key={fee.id} className="fee-card">
                        <div className="fee-header">
                            <div className="student-info">
                                <FaUser className="student-icon" />
                                <div>
                                    <h3>{fee.first_name} {fee.last_name}</h3>
                                    <p>{fee.branch_name}</p>
                                </div>
                            </div>
                            <div className="fee-amount">
                                <FaRupeeSign />
                                <span>{fee.amount}</span>
                            </div>
                        </div>

                        <div className="fee-details">
                            <div className="detail-item">
                                <span className="fee-type">{fee.fee_type}</span>
                            </div>
                            {fee.due_date && (
                                <div className="detail-item">
                                    <FaCalendar />
                                    <span>Due: {new Date(fee.due_date).toLocaleDateString()}</span>
                                </div>
                            )}
                            {fee.paid_date && (
                                <div className="detail-item">
                                    <FaCheck />
                                    <span>Paid: {new Date(fee.paid_date).toLocaleDateString()}</span>
                                </div>
                            )}
                            {fee.payment_method && (
                                <div className="detail-item">
                                    <FaCreditCard />
                                    <span>{fee.payment_method}</span>
                                </div>
                            )}
                            {fee.notes && (
                                <div className="notes">
                                    <strong>Notes:</strong> {fee.notes}
                                </div>
                            )}
                        </div>

                        <div className="fee-status">
                            <div className={`status-badge ${getStatusColor(fee.status)}`}>
                                {getStatusIcon(fee.status)}
                                {fee.status}
                            </div>
                        </div>

                        <div className="fee-actions">
                            {fee.status !== 'paid' && (
                                <button
                                    className="btn btn-sm btn-success"
                                    onClick={() => handleMarkPaid(fee)}
                                >
                                    <FaCheck /> Mark Paid
                                </button>
                            )}
                            <button
                                className="btn btn-sm btn-secondary"
                                onClick={() => handleEdit(fee)}
                            >
                                <FaEdit /> Edit
                            </button>
                            <button
                                className="btn btn-sm btn-danger"
                                onClick={() => handleDelete(fee.id)}
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
                            <h2>{editingFee ? 'Edit Fee' : 'Add New Fee'}</h2>
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

                            <div className="form-row">
                                <div className="form-group">
                                    <label>Amount *</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        value={formData.amount}
                                        onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                                        required
                                        placeholder="0.00 (INR)"
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Fee Type *</label>
                                    <select
                                        value={formData.fee_type}
                                        onChange={(e) => setFormData({ ...formData, fee_type: e.target.value })}
                                        required
                                    >
                                        <option value="monthly">Monthly Fee</option>
                                        <option value="belt_test">Belt Test</option>
                                        <option value="uniform">Uniform</option>
                                        <option value="equipment">Equipment</option>
                                        <option value="other">Other</option>
                                    </select>
                                </div>
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label>Due Date</label>
                                    <input
                                        type="date"
                                        value={formData.due_date}
                                        onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Payment Method</label>
                                    <select
                                        value={formData.payment_method}
                                        onChange={(e) => setFormData({ ...formData, payment_method: e.target.value })}
                                    >
                                        <option value="">Select Method</option>
                                        <option value="Cash">Cash</option>
                                        <option value="Credit Card">Credit Card</option>
                                        <option value="Bank Transfer">Bank Transfer</option>
                                        <option value="Check">Check</option>
                                    </select>
                                </div>
                            </div>

                            <div className="form-group">
                                <label>Notes</label>
                                <textarea
                                    value={formData.notes}
                                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                    rows="3"
                                    placeholder="Optional notes about the fee..."
                                />
                            </div>

                            <div className="modal-actions">
                                <button type="button" className="btn btn-secondary" onClick={closeModal}>
                                    Cancel
                                </button>
                                <button type="submit" className="btn btn-primary">
                                    {editingFee ? 'Update Fee' : 'Create Fee'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Fees;
