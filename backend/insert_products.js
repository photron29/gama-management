const pool = require('./db');

const products = [
    { name: 'Karate Gi - White', description: 'Traditional white karate uniform for training and competitions', category: 'Uniforms', price: 45.00, stock_quantity: 50 },
    { name: 'Karate Gi - Black', description: 'Black karate uniform for advanced students and instructors', category: 'Uniforms', price: 50.00, stock_quantity: 30 },
    { name: 'White Belt', description: 'Beginner white belt for new students', category: 'Belts', price: 8.00, stock_quantity: 100 },
    { name: 'Yellow Belt', description: 'Yellow belt for advancing students', category: 'Belts', price: 8.00, stock_quantity: 75 },
    { name: 'Orange Belt', description: 'Orange belt for intermediate students', category: 'Belts', price: 8.00, stock_quantity: 60 },
    { name: 'Green Belt', description: 'Green belt for intermediate students', category: 'Belts', price: 8.00, stock_quantity: 50 },
    { name: 'Blue Belt', description: 'Blue belt for intermediate students', category: 'Belts', price: 8.00, stock_quantity: 45 },
    { name: 'Brown Belt', description: 'Brown belt for advanced students', category: 'Belts', price: 8.00, stock_quantity: 30 },
    { name: 'Black Belt', description: 'Black belt for advanced students and instructors', category: 'Belts', price: 12.00, stock_quantity: 20 },
    { name: 'Focus Pads', description: 'Training focus pads for striking practice', category: 'Equipment', price: 25.00, stock_quantity: 40 },
    { name: 'Sparring Gloves', description: 'Protective gloves for sparring practice', category: 'Equipment', price: 35.00, stock_quantity: 30 },
    { name: 'Shin Guards', description: 'Protective shin guards for sparring', category: 'Equipment', price: 28.00, stock_quantity: 25 },
    { name: 'Mouth Guard', description: 'Protective mouth guard for sparring', category: 'Equipment', price: 15.00, stock_quantity: 50 },
    { name: 'Training Dummy', description: 'Heavy bag training dummy for practice', category: 'Equipment', price: 80.00, stock_quantity: 10 },
    { name: 'Karate Bag', description: 'Carrying bag for uniform and equipment', category: 'Accessories', price: 20.00, stock_quantity: 40 },
    { name: 'Water Bottle', description: 'Sports water bottle with logo', category: 'Accessories', price: 12.00, stock_quantity: 60 },
    { name: 'Towel', description: 'Training towel for practice', category: 'Accessories', price: 8.00, stock_quantity: 80 },
    { name: 'Headband', description: 'Sweat-absorbing headband', category: 'Accessories', price: 5.00, stock_quantity: 100 },
    { name: 'Karate Basics Book', description: 'Beginner guide to karate techniques', category: 'Books', price: 15.00, stock_quantity: 25 },
    { name: 'Advanced Techniques DVD', description: 'Instructional DVD for advanced students', category: 'Books', price: 25.00, stock_quantity: 15 },
    { name: 'Training Manual', description: 'Comprehensive training manual', category: 'Books', price: 18.00, stock_quantity: 20 }
];

async function insertProducts() {
    try {
        console.log('Inserting products...');
        
        for (const product of products) {
            await pool.query(
                'INSERT INTO products (name, description, category, price, stock_quantity, is_active) VALUES ($1, $2, $3, $4, $5, $6)',
                [product.name, product.description, product.category, product.price, product.stock_quantity, true]
            );
        }
        
        console.log('Products inserted successfully!');
        process.exit(0);
    } catch (error) {
        console.error('Error inserting products:', error);
        process.exit(1);
    }
}

insertProducts();
