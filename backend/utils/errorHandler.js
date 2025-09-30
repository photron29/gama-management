// Global error handling middleware
const errorHandler = (err, req, res, next) => {
    console.error('Error:', err);

    // Default error
    let error = {
        message: err.message || 'Internal Server Error',
        status: err.status || 500
    };

    // PostgreSQL errors
    if (err.code) {
        switch (err.code) {
            case '23505': // Unique violation
                error.message = 'Duplicate entry: This record already exists';
                error.status = 400;
                break;
            case '23503': // Foreign key violation
                error.message = 'Referenced record not found';
                error.status = 400;
                break;
            case '23502': // Not null violation
                error.message = 'Required field is missing';
                error.status = 400;
                break;
            case '42P01': // Undefined table
                error.message = 'Database table not found';
                error.status = 500;
                break;
            default:
                error.message = 'Database error occurred';
                error.status = 500;
        }
    }

    // Validation errors
    if (err.name === 'ValidationError') {
        error.message = 'Validation failed';
        error.status = 400;
    }

    // JWT errors
    if (err.name === 'JsonWebTokenError') {
        error.message = 'Invalid token';
        error.status = 401;
    }

    if (err.name === 'TokenExpiredError') {
        error.message = 'Token expired';
        error.status = 401;
    }

    res.status(error.status).json({
        error: error.message,
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
};

// 404 handler
const notFound = (req, res, next) => {
    res.status(404).json({
        error: 'Route not found',
        path: req.originalUrl
    });
};

module.exports = {
    errorHandler,
    notFound
};
