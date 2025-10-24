import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import LoadingAtom from '../components/LoadingAtom';
import {
    FaPlus,
    FaEdit,
    FaTrash,
    FaSearch,
    FaBox,
    FaRupeeSign,
    FaCalendar
} from 'react-icons/fa';
import { apiClient } from '../utils/api';

// --- Category-Specific Options and Metadata ---
const CATEGORY_OPTIONS = {
    dobok: {
        prefix: 'Dobok',
        sizeOptions: ['24', '26', '28', '30', '32', '34', '36', '38', '40', '42', '44'],
        sizeLabel: 'Size',
        designOptions: ['Coloured Belt', 'Black Belt'],
        designLabel: 'Design'
    },
    equipment: {
        prefix: 'Equipment',
        sizeOptions: ['S', 'M', 'L', 'XL'],
        sizeLabel: 'Size'
    },
    gear: {
        prefix: 'Guard',
        sizeOptions: ['S', 'M', 'L', 'XL'],
        sizeLabel: 'Size'
    },
    belt: {
        prefix: '', // Prefix is empty as the option is the full name
        sizeOptions: [
            'White Belt (10th Gup)', 'Yellow Stripe (9th Gup)', 'Yellow Belt (8th Gup)',
            'Green Stripe (7th Gup)', 'Green Belt (6th Gup)', 'Blue Stripe (5th Gup)',
            'Blue Belt (4th Gup)', 'Red Stripe (3rd Gup)', 'Red Belt (2nd Gup)',
            'Black Stripe (1st Gup)', 'Black Belt - 1st Dan', 'Black Belt - 2nd Dan',
            'Black Belt - 3rd Dan', 'Black Belt - 4th Dan'
        ],
        sizeLabel: 'Belt Rank'
    }
};

const Inventory = () => {
    const [inventory, setInventory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterCategory, setFilterCategory] = useState('');

    const [formData, setFormData] = useState({
        item_name: '',
        category: '', // Maps to 'supplier' in DB
        quantity: '',
        price: '', // Aligns with DB schema 'price' and API error message
        // branch_id is REMOVED
        last_restocked: '',
        size: '',
        design: ''
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
    
    // --- HANDLERS FOR DYNAMIC PRODUCT NAMING ---
    const updateItemName = (currentData) => {
        const { category, size, design, item_name } = currentData;
        const categoryData = CATEGORY_OPTIONS[category];

        if (category === 'Other') {
            return item_name;
        }

        if (categoryData) {
            if (category === 'belt' && size) {
                return size;
            } 
            if (category === 'dobok' && size && design) {
                return `Dobok (${design}) - Size ${size}`;
            } 
            if (size && category !== 'dobok') {
                return `${categoryData.prefix} - ${categoryData.sizeLabel} ${size}`;
            }
        }
        return '';
    };

    const handleCategoryChange = (e) => {
        const newCategory = e.target.value;
        const isStandardProduct = newCategory in CATEGORY_OPTIONS;
        
        setFormData(prevData => {
            const newData = {
                ...prevData,
                category: newCategory,
                size: '',
                design: '', 
                item_name: isStandardProduct ? '' : (newCategory === 'Other' ? '' : prevData.item_name)
            };
            newData.item_name = updateItemName(newData);
            return newData;
        });
    };

    const handleOptionChange = (field, value) => {
        setFormData(prevData => {
            const newData = {
                ...prevData,
                [field]: value,
            };
            newData.item_name = updateItemName(newData);
            return newData;
        });
    };
    
    // ------------------------------------------

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!formData.item_name || formData.item_name.trim() === '') {
            return toast.error("Please select a product option or enter a custom item name.");
        }
        
        try {
            const dataToSubmit = Object.fromEntries(
                Object.entries(formData).filter(([_, v]) => v !== '' && v !== null)
            );

            if (editingItem) {
                await apiClient.updateInventoryItem(editingItem.id, dataToSubmit);
                toast.success('Inventory item updated successfully');
            } else {
                await apiClient.createInventoryItem(dataToSubmit);
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
            price: item.price || '',
            // branch_id is REMOVED
            last_restocked: item.last_restocked || '',
            size: item.size || '',
            design: item.design || ''
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
            price: '', 
            // branch_id is REMOVED
            last_restocked: '',
            size: '',
            design: ''
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
            item.category?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.size?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.design?.toLowerCase().includes(searchTerm.toLowerCase()); 
        const matchesCategory = !filterCategory || item.category === filterCategory;
        return matchesSearch && matchesCategory;
    });

    const categories = [...new Set(inventory.map(item => item.category).filter(Boolean))];

    // --- Conditional Product Selection Field ---
    const renderProductSelectionField = () => {
        const selectedCategory = formData.category;
        const optionsData = CATEGORY_OPTIONS[selectedCategory];

        if (!optionsData) {
            return null;
        }

        return (
            <>
                {/* 1. Conditional Design Field for Dobok */}
                {selectedCategory === 'dobok' && (
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">{optionsData.designLabel} *</label>
                        <select
                            value={formData.design}
                            onChange={(e) => handleOptionChange('design', e.target.value)}
                            required
                            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 text-gray-700"
                        >
                            <option value="">Select {optionsData.designLabel}</option>
                            {optionsData.designOptions.map(option => (
                                <option key={option} value={option}>{option}</option>
                            ))}
                        </select>
                    </div>
                )}
                
                {/* 2. Size/Rank Field (required for all standard categories) */}
                <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">{optionsData.sizeLabel} *</label>
                    <select
                        value={formData.size}
                        onChange={(e) => handleOptionChange('size', e.target.value)} 
                        required={selectedCategory !== 'dobok' || (formData.design && selectedCategory === 'dobok')}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 text-gray-700"
                    >
                        <option value="">Select {optionsData.sizeLabel}</option>
                        {optionsData.sizeOptions.map(option => (
                            <option key={option} value={option}>{option}</option>
                        ))}
                    </select>
                    {formData.item_name && (
                        <p className="mt-2 text-sm text-blue-600 font-medium bg-blue-50 p-3 rounded-lg">Product Name: <strong>{formData.item_name}</strong></p>
                    )}
                </div>
            </>
        );
    };
    // ---------------------------------------------

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
                <div className="text-center">
                    <LoadingAtom size="medium" />
                    <p className="mt-4 text-lg text-gray-600 font-medium">Loading inventory...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Inventory Management</h1>
                        <p className="text-gray-600 dark:text-gray-400">Manage your martial arts equipment and supplies</p>
                    </div>
                    <button 
                        className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-all duration-200 flex items-center space-x-2 shadow-md hover:shadow-lg"
                        onClick={openModal}
                    >
                        <FaPlus className="h-4 w-4" />
                        <span>Add New Item</span>
                    </button>
                </div>

                {/* Modern Filters */}
                <div className="bg-white rounded-2xl shadow-lg p-6 mb-8 border border-gray-100">
                    <div className="flex flex-col lg:flex-row gap-4">
                        <div className="flex-1 relative">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                <FaSearch className="h-5 w-5 text-gray-400" />
                            </div>
                            <input
                                type="text"
                                placeholder="Search inventory items..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 text-gray-700 placeholder-gray-400"
                            />
                        </div>
                        <div className="lg:w-64">
                            <select
                                value={filterCategory}
                                onChange={(e) => setFilterCategory(e.target.value)}
                                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 text-gray-700"
                            >
                                <option value="">All Categories</option>
                                {categories.map(category => (
                                    <option key={category} value={category}>{category}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>

                {/* Modern Inventory Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {filteredInventory.map((item) => (
                        <div key={item.id} className="group bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden border border-gray-100 hover:border-blue-200 hover:scale-[1.02]">
                            {/* Card Header with Gradient */}
                            <div className="bg-gradient-to-r from-blue-500 to-purple-500 p-6 text-white">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center space-x-3">
                                        <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                                            <FaBox className="h-6 w-6" />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-lg line-clamp-1">{item.item_name}</h3>
                                            <p className="text-blue-100 text-sm capitalize">{item.category}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-2xl font-bold">{item.quantity}</div>
                                        <div className="text-blue-100 text-sm">units</div>
                                    </div>
                                </div>
                            </div>

                            {/* Card Body */}
                            <div className="p-6 space-y-4">
                                {item.price && (
                                    <div className="flex items-center space-x-3 p-3 bg-green-50 rounded-xl">
                                        <FaRupeeSign className="h-5 w-5 text-green-600" />
                                        <span className="text-green-800 font-semibold">₹{item.price} per unit</span>
                                    </div>
                                )}
                                
                                {item.size && (
                                    <div className="flex items-center space-x-3 p-3 bg-blue-50 rounded-xl">
                                        <FaBox className="h-5 w-5 text-blue-600" />
                                        <span className="text-blue-800">
                                            <span className="font-medium">{item.category === 'belt' ? 'Rank' : 'Size'}:</span> {item.size}
                                        </span>
                                    </div>
                                )}
                                
                                {item.design && (
                                    <div className="flex items-center space-x-3 p-3 bg-purple-50 rounded-xl">
                                        <FaBox className="h-5 w-5 text-purple-600" />
                                        <span className="text-purple-800">
                                            <span className="font-medium">Design:</span> {item.design}
                                        </span>
                                    </div>
                                )}
                                
                                {item.last_restocked && (
                                    <div className="flex items-center space-x-3 p-3 bg-orange-50 rounded-xl">
                                        <FaCalendar className="h-5 w-5 text-orange-600" />
                                        <span className="text-orange-800">
                                            <span className="font-medium">Last restocked:</span> {new Date(item.last_restocked).toLocaleDateString()}
                                        </span>
                                    </div>
                                )}
                            </div>

                            {/* Card Actions */}
                            <div className="p-6 pt-0 flex space-x-3">
                                <button
                                    className="flex-1 flex items-center justify-center space-x-2 px-4 py-2 bg-blue-100 text-blue-700 rounded-xl hover:bg-blue-200 transition-all duration-200 font-medium"
                                    onClick={() => handleEdit(item)}
                                >
                                    <FaEdit className="h-4 w-4" />
                                    <span>Edit</span>
                                </button>
                                <button
                                    className="flex-1 flex items-center justify-center space-x-2 px-4 py-2 bg-red-100 text-red-700 rounded-xl hover:bg-red-200 transition-all duration-200 font-medium"
                                    onClick={() => handleDelete(item.id)}
                                >
                                    <FaTrash className="h-4 w-4" />
                                    <span>Delete</span>
                                </button>
                            </div>
                        </div>
                    ))}
                </div>

            {showModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={closeModal}>
                    <div className="bg-white rounded-3xl shadow-2xl max-h-[90vh] w-full max-w-2xl overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                        <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6 rounded-t-3xl">
                            <div className="flex justify-between items-center">
                                <h2 className="text-2xl font-bold text-white">{editingItem ? 'Edit Inventory Item' : 'Add New Item'}</h2>
                                <button 
                                    className="text-white/80 hover:text-white text-3xl font-bold p-2 hover:bg-white/20 rounded-xl transition-all duration-200"
                                    onClick={closeModal}
                                >
                                    ×
                                </button>
                            </div>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-6">
                            
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Category *</label>
                                <select
                                    value={formData.category}
                                    onChange={handleCategoryChange}
                                    required
                                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 text-gray-700"
                                >
                                    <option value="">Select Category</option>
                                    <option value="dobok">Dobok</option>
                                    <option value="equipment">Equipment</option>
                                    <option value="belt">Belt</option>
                                    <option value="gear">Guard</option>
                                    <option value="Other">Other (Custom Item)</option>
                                </select>
                            </div>

                            {/* Conditional Item Name Input for 'Other' */}
                            {formData.category === 'Other' && (
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Custom Item Name *</label>
                                    <input
                                        type="text"
                                        value={formData.item_name}
                                        onChange={(e) => setFormData({ ...formData, item_name: e.target.value })}
                                        required
                                        placeholder="Enter custom item name"
                                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 text-gray-700 placeholder-gray-400"
                                    />
                                </div>
                            )}

                            {/* Conditional Product Selection Dropdown for Standard Categories */}
                            {renderProductSelectionField()}

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Quantity *</label>
                                    <input
                                        type="number"
                                        min="0"
                                        value={formData.quantity}
                                        onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                                        required
                                        placeholder="0"
                                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 text-gray-700 placeholder-gray-400"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Price (₹) *</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        value={formData.price}
                                        onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                                        required
                                        placeholder="0.00"
                                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 text-gray-700 placeholder-gray-400"
                                    />
                                </div>
                            </div>
                            
                            {/* branch_id hidden field has been REMOVED */}

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Last Restocked</label>
                                <input
                                    type="date"
                                    value={formData.last_restocked}
                                    onChange={(e) => setFormData({ ...formData, last_restocked: e.target.value })}
                                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 text-gray-700"
                                />
                            </div>

                            <div className="flex gap-4 pt-6 border-t border-gray-200">
                                <button 
                                    type="button" 
                                    className="flex-1 px-6 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-all duration-200 font-semibold"
                                    onClick={closeModal}
                                >
                                    Cancel
                                </button>
                                <button 
                                    type="submit" 
                                    className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-200 font-semibold shadow-lg hover:shadow-xl"
                                >
                                    {editingItem ? 'Update Item' : 'Create Item'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
            </div>
        </div>
    );
};

export default Inventory;