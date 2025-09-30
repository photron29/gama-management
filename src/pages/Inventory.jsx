import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import {
    FaPlus,
    FaEdit,
    FaTrash,
    FaSearch,
    FaBox,
    FaBuilding,
    FaRupeeSign,
    FaCalendar,
    FaTruck
} from 'react-icons/fa';
import { apiClient } from '../utils/api';

const Inventory = () => {
    const [inventory, setInventory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterCategory, setFilterCategory] = useState('');

    const [formData, setFormData] = useState({
        item_name: '',
        category: '',
        quantity: '',
        unit_price: '',
        branch_id: '',
        supplier: '',
        last_restocked: ''
    });

    useEffect(() => {
        fetchInventory();
    }, []);

    const fetchInventory = async () => {
        try {
            const data = await apiClient.getInventory();
            setInventory(data.inventory);
        } catch (error) {
            toast.error('Failed to fetch inventory');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingItem) {
                await apiClient.updateInventoryItem(editingItem.id, formData);
                toast.success('Inventory item updated successfully');
            } else {
                await apiClient.createInventoryItem(formData);
                toast.success('Inventory item created successfully');
            }
            setShowModal(false);
            setEditingItem(null);
            resetForm();
            fetchInventory();
        } catch (error) {
            toast.error(error.message || 'Failed to save inventory item');
        }
    };

    const handleEdit = (item) => {
        setEditingItem(item);
        setFormData({
            item_name: item.item_name,
            category: item.category || '',
            quantity: item.quantity,
            unit_price: item.unit_price || '',
            branch_id: item.branch_id,
            supplier: item.supplier || '',
            last_restocked: item.last_restocked || ''
        });
        setShowModal(true);
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this inventory item?')) {
            try {
                await apiClient.deleteInventoryItem(id);
                toast.success('Inventory item deleted successfully');
                fetchInventory();
            } catch (error) {
                toast.error('Failed to delete inventory item');
            }
        }
    };

    const resetForm = () => {
        setFormData({
            item_name: '',
            category: '',
            quantity: '',
            unit_price: '',
            branch_id: '',
            supplier: '',
            last_restocked: ''
        });
    };

    const openModal = () => {
        setEditingItem(null);
        resetForm();
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        setEditingItem(null);
        resetForm();
    };

    const filteredInventory = inventory.filter(item => {
        const matchesSearch = item.item_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.category?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = !filterCategory || item.category === filterCategory;
        return matchesSearch && matchesCategory;
    });

    const categories = [...new Set(inventory.map(item => item.category).filter(Boolean))];

    if (loading) {
        return <div className="loading">Loading inventory...</div>;
    }

    return (
        <div className="inventory-page">
            <div className="page-header">
                <h1>Inventory</h1>
                <button className="btn btn-primary" onClick={openModal}>
                    <FaPlus /> Add Item
                </button>
            </div>

            <div className="filters">
                <div className="search-input">
                    <FaSearch className="search-icon" />
                    <input
                        type="text"
                        placeholder="Search inventory..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <select
                    value={filterCategory}
                    onChange={(e) => setFilterCategory(e.target.value)}
                    className="filter-select"
                >
                    <option value="">All Categories</option>
                    {categories.map(category => (
                        <option key={category} value={category}>{category}</option>
                    ))}
                </select>
            </div>

            <div className="inventory-grid">
                {filteredInventory.map((item) => (
                    <div key={item.id} className="inventory-card">
                        <div className="inventory-header">
                            <div className="item-info">
                                <FaBox className="item-icon" />
                                <div>
                                    <h3>{item.item_name}</h3>
                                    <p className="category">{item.category}</p>
                                    <p className="branch">{item.branch_name}</p>
                                </div>
                            </div>
                            <div className="item-quantity">
                                <span className="quantity">{item.quantity}</span>
                                <span className="unit">units</span>
                            </div>
                        </div>

                        <div className="inventory-details">
                            {item.unit_price && (
                                <div className="detail-item">
                                    <FaRupeeSign />
                                    <span>₹{item.unit_price} per unit</span>
                                </div>
                            )}
                            {item.supplier && (
                                <div className="detail-item">
                                    <FaTruck />
                                    <span>{item.supplier}</span>
                                </div>
                            )}
                            {item.last_restocked && (
                                <div className="detail-item">
                                    <FaCalendar />
                                    <span>Last restocked: {new Date(item.last_restocked).toLocaleDateString()}</span>
                                </div>
                            )}
                        </div>

                        <div className="inventory-actions">
                            <button
                                className="btn btn-sm btn-secondary"
                                onClick={() => handleEdit(item)}
                            >
                                <FaEdit /> Edit
                            </button>
                            <button
                                className="btn btn-sm btn-danger"
                                onClick={() => handleDelete(item.id)}
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
                            <h2>{editingItem ? 'Edit Inventory Item' : 'Add New Item'}</h2>
                            <button className="modal-close" onClick={closeModal}>×</button>
                        </div>

                        <form onSubmit={handleSubmit} className="modal-form">
                            <div className="form-group">
                                <label>Item Name *</label>
                                <input
                                    type="text"
                                    value={formData.item_name}
                                    onChange={(e) => setFormData({ ...formData, item_name: e.target.value })}
                                    required
                                    placeholder="e.g., Karate Gi (White)"
                                />
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label>Category</label>
                                    <input
                                        type="text"
                                        value={formData.category}
                                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                        placeholder="e.g., Uniforms, Equipment"
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Branch *</label>
                                    <select
                                        value={formData.branch_id}
                                        onChange={(e) => setFormData({ ...formData, branch_id: e.target.value })}
                                        required
                                    >
                                        <option value="">Select Branch</option>
                                        <option value="1">Main Branch</option>
                                        <option value="2">North Branch</option>
                                        <option value="3">South Branch</option>
                                    </select>
                                </div>
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label>Quantity *</label>
                                    <input
                                        type="number"
                                        min="0"
                                        value={formData.quantity}
                                        onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                                        required
                                        placeholder="0"
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Unit Price</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        value={formData.unit_price}
                                        onChange={(e) => setFormData({ ...formData, unit_price: e.target.value })}
                                        placeholder="0.00 (INR)"
                                    />
                                </div>
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label>Supplier</label>
                                    <input
                                        type="text"
                                        value={formData.supplier}
                                        onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
                                        placeholder="e.g., Martial Arts Supply Co"
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Last Restocked</label>
                                    <input
                                        type="date"
                                        value={formData.last_restocked}
                                        onChange={(e) => setFormData({ ...formData, last_restocked: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="modal-actions">
                                <button type="button" className="btn btn-secondary" onClick={closeModal}>
                                    Cancel
                                </button>
                                <button type="submit" className="btn btn-primary">
                                    {editingItem ? 'Update Item' : 'Create Item'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Inventory;
