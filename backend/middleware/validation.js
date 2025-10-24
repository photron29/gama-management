// Input validation middleware
const { body, param, query, validationResult } = require('express-validator');

// Validation result handler
const handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            error: 'Validation failed',
            details: errors.array().map(err => ({
                field: err.path,
                message: err.msg,
                value: err.value
            }))
        });
    }
    next();
};

// Student validation rules
const validateStudent = [
    body('first_name')
        .notEmpty()
        .withMessage('First name is required')
        .isLength({ min: 2, max: 50 })
        .withMessage('First name must be between 2 and 50 characters')
        .matches(/^[a-zA-Z\s]+$/)
        .withMessage('First name can only contain letters and spaces'),

    body('last_name')
        .notEmpty()
        .withMessage('Last name is required')
        .isLength({ min: 2, max: 50 })
        .withMessage('Last name must be between 2 and 50 characters')
        .matches(/^[a-zA-Z\s]+$/)
        .withMessage('Last name can only contain letters and spaces'),

    body('email')
        .optional()
        .isEmail()
        .withMessage('Must be a valid email address')
        .normalizeEmail(),

    body('phone')
        .optional()
        .isMobilePhone()
        .withMessage('Must be a valid phone number'),

    body('date_of_birth')
        .optional()
        .isISO8601()
        .withMessage('Must be a valid date (YYYY-MM-DD)')
        .custom((value) => {
            const birthDate = new Date(value);
            const today = new Date();
            const age = today.getFullYear() - birthDate.getFullYear();
            if (age < 3 || age > 100) {
                throw new Error('Age must be between 3 and 100 years');
            }
            return true;
        }),

    body('belt_level')
        .optional()
        .isIn(['White', 'Yellow', 'Orange', 'Green', 'Blue', 'Purple', 'Brown', 'Black'])
        .withMessage('Invalid belt level'),

    body('branch_id')
        .notEmpty()
        .withMessage('Branch is required')
        .isInt({ min: 1 })
        .withMessage('Branch ID must be a positive integer'),

    body('emergency_contact_name')
        .optional()
        .isLength({ min: 2, max: 100 })
        .withMessage('Emergency contact name must be between 2 and 100 characters'),

    body('emergency_contact_phone')
        .optional()
        .isMobilePhone()
        .withMessage('Emergency contact phone must be a valid phone number'),

    body('address')
        .optional()
        .isLength({ max: 500 })
        .withMessage('Address must not exceed 500 characters'),

    handleValidationErrors
];

// Instructor validation rules
const validateInstructor = [
    body('first_name')
        .notEmpty()
        .withMessage('First name is required')
        .isLength({ min: 2, max: 50 })
        .withMessage('First name must be between 2 and 50 characters'),

    body('last_name')
        .notEmpty()
        .withMessage('Last name is required')
        .isLength({ min: 2, max: 50 })
        .withMessage('Last name must be between 2 and 50 characters'),

    body('email')
        .isEmail()
        .withMessage('Must be a valid email address')
        .normalizeEmail(),

    body('phone')
        .isMobilePhone()
        .withMessage('Must be a valid phone number'),

    body('belt_level')
        .notEmpty()
        .withMessage('Belt level is required')
        .isLength({ min: 1, max: 50 })
        .withMessage('Belt level must be between 1 and 50 characters'),

    body('branch_id')
        .notEmpty()
        .withMessage('Branch is required')
        .isInt({ min: 1 })
        .withMessage('Branch ID must be a positive integer'),

    body('specialization')
        .optional()
        .isLength({ max: 200 })
        .withMessage('Specialization must not exceed 200 characters'),

    body('certification_date')
        .optional()
        .isISO8601()
        .withMessage('Certification date must be a valid date'),

    handleValidationErrors
];

// Branch validation rules
const validateBranch = [
    body('name')
        .notEmpty()
        .withMessage('Branch name is required')
        .isLength({ min: 2, max: 100 })
        .withMessage('Branch name must be between 2 and 100 characters'),

    body('address')
        .optional()
        .isLength({ max: 500 })
        .withMessage('Address must not exceed 500 characters'),

    body('phone')
        .optional()
        .isMobilePhone()
        .withMessage('Must be a valid phone number'),

    body('email')
        .optional()
        .isEmail()
        .withMessage('Must be a valid email address')
        .normalizeEmail(),

    body('manager')
        .optional()
        .isLength({ max: 100 })
        .withMessage('Manager name must not exceed 100 characters'),

    handleValidationErrors
];

// Attendance validation rules
const validateAttendance = [
    body('student_id')
        .notEmpty()
        .withMessage('Student ID is required')
        .isInt({ min: 1 })
        .withMessage('Student ID must be a positive integer'),

    body('class_date')
        .notEmpty()
        .withMessage('Class date is required')
        .isISO8601()
        .withMessage('Class date must be a valid date'),

    body('status')
        .notEmpty()
        .withMessage('Status is required')
        .isIn(['present', 'absent', 'late'])
        .withMessage('Status must be present, absent, or late'),

    body('notes')
        .optional()
        .isLength({ max: 500 })
        .withMessage('Notes must not exceed 500 characters'),

    handleValidationErrors
];

// Fee validation rules
const validateFee = [
    body('student_id')
        .notEmpty()
        .withMessage('Student ID is required')
        .isInt({ min: 1 })
        .withMessage('Student ID must be a positive integer'),

    body('amount')
        .notEmpty()
        .withMessage('Amount is required')
        .isFloat({ min: 0 })
        .withMessage('Amount must be a positive number'),

    body('fee_type')
        .notEmpty()
        .withMessage('Fee type is required')
        .isIn(['monthly', 'belt_test', 'uniform', 'equipment', 'other'])
        .withMessage('Invalid fee type'),

    body('due_date')
        .optional()
        .isISO8601()
        .withMessage('Due date must be a valid date'),

    body('payment_method')
        .optional()
        .isIn(['cash', 'credit_card', 'bank_transfer', 'check', 'other'])
        .withMessage('Invalid payment method'),

    body('notes')
        .optional()
        .isLength({ max: 500 })
        .withMessage('Notes must not exceed 500 characters'),

    handleValidationErrors
];

// Inventory validation rules
const validateInventory = [
    body('item_name')
        .notEmpty()
        .withMessage('Item name is required')
        .isLength({ min: 2, max: 100 })
        .withMessage('Item name must be between 2 and 100 characters'),

    body('supplier')
        .notEmpty()
        .withMessage('Supplier is required')
        .isLength({ min: 2, max: 50 })
        .withMessage('Supplier must be between 2 and 50 characters'),

    body('quantity')
        .notEmpty()
        .withMessage('Quantity is required')
        .isInt({ min: 0 })
        .withMessage('Quantity must be a non-negative integer'),

    body('price')
        .notEmpty()
        .withMessage('Price is required')
        .isFloat({ min: 0 })
        .withMessage('Price must be a positive number'),

    body('branch_id')
        .notEmpty()
        .withMessage('Branch ID is required')
        .isInt({ min: 1 })
        .withMessage('Branch ID must be a positive integer'),

    body('supplier')
        .optional()
        .isLength({ max: 100 })
        .withMessage('Supplier name must not exceed 100 characters'),

    body('last_restocked')
        .optional()
        .isISO8601()
        .withMessage('Last restocked date must be a valid date'),

    handleValidationErrors
];

// Login validation rules
const validateLogin = [
    body('username')
        .notEmpty()
        .withMessage('Username is required')
        .isLength({ min: 3, max: 50 })
        .withMessage('Username must be between 3 and 50 characters'),

    body('password')
        .notEmpty()
        .withMessage('Password is required')
        .isLength({ min: 6 })
        .withMessage('Password must be at least 6 characters long'),

    handleValidationErrors
];

// ID parameter validation
const validateId = [
    param('id')
        .isInt({ min: 1 })
        .withMessage('ID must be a positive integer'),
    handleValidationErrors
];

module.exports = {
    validateStudent,
    validateInstructor,
    validateBranch,
    validateAttendance,
    validateFee,
    validateInventory,
    validateLogin,
    validateId,
    handleValidationErrors
};
