// Only load .env in development
if (process.env.NODE_ENV !== 'production') {
    require('dotenv').config();
}

// Centralized environment variables configuration
const config = {
    // Database configuration
    database: {
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
        database: process.env.DB_NAME,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        ssl: {
            rejectUnauthorized: false
        }
    },
    // Server configuration
    server: {
        port: process.env.PORT || 5000,
        nodeEnv: process.env.NODE_ENV || 'development'
    },
    // JWT configuration
    jwt: {
        secret: process.env.JWT_SECRET
    },
    // Supabase configuration
    supabase: {
        url: process.env.SUPABASE_URL,
        anonKey: process.env.SUPABASE_ANON_KEY,
        jwtSecret: process.env.SUPABASE_JWT_SECRET
    },
    // Frontend URL
    frontend: {
        url: process.env.FRONTEND_URL
    }
};

// Debug logging (remove after testing)
console.log('🔍 Config loaded:');
console.log('DB_HOST:', config.database.host ? '✅' : '❌ MISSING');
console.log('JWT_SECRET:', config.jwt.secret ? '✅' : '❌ MISSING');
console.log('PORT:', config.server.port);
console.log('NODE_ENV:', config.server.nodeEnv);

module.exports = config;
