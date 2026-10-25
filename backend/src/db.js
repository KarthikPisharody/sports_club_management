// import mysql from 'mysql2/promise';
// import dotenv from 'dotenv';

// dotenv.config();

// // MySQL Configuration
// const dbConfig = {
//   host: process.env.DB_HOST || 'localhost',
//   user: process.env.DB_USER || 'root',
//   password: process.env.DB_PASSWORD || '',
//   database: process.env.DB_NAME || 'sports_club_db',
//   port: Number(process.env.DB_PORT) || 3306,
//   waitForConnections: true,
//   connectionLimit: 10,
//   queueLimit: 0,
// };

// let pool = null;
// let useMock = process.env.NODE_ENV === 'test';

// if (!useMock) {
//   try {
//     pool = mysql.createPool(dbConfig);
//   } catch (e) {
//     console.warn('MySQL pool initialization skipped, running in mock state:', e.message);
//     useMock = true;
//   }
// }
// const mockState = {
//   users: [
//     { user_id: 1, name: 'Dana Lopez', username: 'Dana Lopez', email: 'dana.admin@arenaone.club', phone: '+91 9888877771', password: 'password123', role: 'admin', wallet_balance: 5000.00, is_delinquent: 0 },
//     { user_id: 2, name: 'Aarav Mehta', username: 'Aarav Mehta', email: 'aarav.mehta@clubmail.com', phone: '+91 9820011223', password: 'password123', role: 'member', wallet_balance: 2450.00, is_delinquent: 0 },
//     { user_id: 3, name: 'Priya Sharma', username: 'Priya Sharma', email: 'priya.sharma@clubmail.com', phone: '+91 9811122334', password: 'password123', role: 'member', wallet_balance: 5100.00, is_delinquent: 0 },
//     { user_id: 4, name: 'Rohan Kapoor', username: 'Rohan Kapoor', email: 'rohan.kapoor@clubmail.com', phone: '+91 9899988776', password: 'password123', role: 'member', wallet_balance: 180.00, is_delinquent: 1 },
//     { user_id: 5, name: 'Suresh Kumar', username: 'Suresh Kumar', email: 'suresh.guest@gmail.com', phone: '+91 9777766665', password: 'password123', role: 'non_member', wallet_balance: 0.00, is_delinquent: 0 }
//   ],
//   plans: [
//     {
//       plan_id: 1,
//       plan_code: 'PLAN_GOLD',
//       plan_name: 'Gold',
//       monthly_fee: 2000.00,
//       yearly_fee: 20000.00,
//       equipment_discount_percent: 30.00,
//       venue_discount_percent: 10.00,
//       benefits: ['30% equipment discount', '10% venue discount', 'Priority booking (7 days ahead)', 'Locker access', '2 guest passes/month']
//     },
//     {
//       plan_id: 2,
//       plan_code: 'PLAN_PLAT',
//       plan_name: 'Platinum',
//       monthly_fee: 3000.00,
//       yearly_fee: 30000.00,
//       equipment_discount_percent: 50.00,
//       venue_discount_percent: 20.00,
//       benefits: ['50% equipment discount', '20% venue discount', 'Priority booking (14 days ahead)', 'Free court hours (4 hrs/mo)', 'Unlimited guest passes', 'Sauna & VIP lounge']
//     }
//   ],
//   subscriptions: [
//     { subscription_id: 1, user_id: 2, plan_id: 1, billing_cycle: 'monthly', amount_paid: 2000.00, start_date: '2026-10-05', end_date: '2026-11-05', status: 'Active' },
//     { subscription_id: 2, user_id: 3, plan_id: 2, billing_cycle: 'yearly', amount_paid: 30000.00, start_date: '2026-08-01', end_date: '2027-08-01', status: 'Active' },
//     { subscription_id: 3, user_id: 4, plan_id: 1, billing_cycle: 'monthly', amount_paid: 2000.00, start_date: '2026-09-01', end_date: '2026-10-01', status: 'Expired' }
//   ],
//   venues: [
//     { venue_id: 'V1', venue_name: 'Main Multi-Sport Arena', venue_type: 'Hall', base_hourly_fee: 800.00, parent_venue_id: null, sports: ['Badminton', 'Basketball'], status: 'Available' },
//     { venue_id: 'V2', venue_name: 'Badminton Court 1', venue_type: 'Court', base_hourly_fee: 300.00, parent_venue_id: 'V1', sports: ['Badminton'], status: 'Available' },
//     { venue_id: 'V3', venue_name: 'Badminton Court 2', venue_type: 'Court', base_hourly_fee: 300.00, parent_venue_id: 'V1', sports: ['Badminton'], status: 'Available' },
//     { venue_id: 'V4', venue_name: 'Squash Box Glass Court', venue_type: 'Court', base_hourly_fee: 350.00, parent_venue_id: null, sports: ['Squash'], status: 'Under Maintenance' },
//     { venue_id: 'V5', venue_name: 'Olympic Heated Pool', venue_type: 'Pool', base_hourly_fee: 600.00, parent_venue_id: null, sports: ['Swimming'], status: 'Available' },
//     { venue_id: 'V6', venue_name: 'Clay Tennis Court A', venue_type: 'Court', base_hourly_fee: 500.00, parent_venue_id: null, sports: ['Tennis'], status: 'Available' },
//     { venue_id: 'V7', venue_name: 'FIFA Standard Turf Field', venue_type: 'Field', base_hourly_fee: 1500.00, parent_venue_id: null, sports: ['Football', 'Cricket'], status: 'Available' },
//     { venue_id: 'V8', venue_name: 'Cricket Practice Nets', venue_type: 'Nets', base_hourly_fee: 400.00, parent_venue_id: 'V7', sports: ['Cricket'], status: 'Available' }
//   ],
//   equipment: [
//     { asset_id: 'EQ-201', name: 'Yonex Astrox 88D Pro Racquet', category: 'Racquets', total_quantity: 24, available_quantity: 17, daily_price: 150.00, status: 'Available' },
//     { asset_id: 'EQ-202', name: 'Head Cyber Pro Squash Racquet', category: 'Racquets', total_quantity: 10, available_quantity: 0, daily_price: 120.00, status: 'In Use' },
//     { asset_id: 'EQ-310', name: 'Wilson Evolution Basketball Size 7', category: 'Balls', total_quantity: 15, available_quantity: 11, daily_price: 80.00, status: 'Available' },
//     { asset_id: 'EQ-311', name: 'Nike Pitch Football Size 5', category: 'Balls', total_quantity: 20, available_quantity: 14, daily_price: 70.00, status: 'Available' },
//     { asset_id: 'EQ-420', name: 'SS Complete Cricket Kit Bag', category: 'Kits', total_quantity: 6, available_quantity: 2, daily_price: 450.00, status: 'Available' },
//     { asset_id: 'EQ-501', name: 'Spinshot Tennis Ball Machine', category: 'Machines', total_quantity: 2, available_quantity: 0, daily_price: 600.00, status: 'Under Maintenance' },
//     { asset_id: 'EQ-610', name: 'Speedo Ergonomic Kickboard', category: 'Aquatics', total_quantity: 30, available_quantity: 26, daily_price: 40.00, status: 'Available' }
//   ],
//   checkouts: [
//     { checkout_id: 1, asset_id: 'EQ-202', user_id: 2, issue_date: '2026-10-19', due_date: '2026-10-22', return_date: null, daily_rate: 84.00, discount_percent: 30.00, late_fee: 300.00, status: 'Overdue' },
//     { checkout_id: 2, asset_id: 'EQ-201', user_id: 3, issue_date: '2026-10-24', due_date: '2026-10-27', return_date: null, daily_rate: 75.00, discount_percent: 50.00, late_fee: 0.00, status: 'Active' },
//     { checkout_id: 3, asset_id: 'EQ-420', user_id: 2, issue_date: '2026-10-15', due_date: '2026-10-20', return_date: '2026-10-20', daily_rate: 315.00, discount_percent: 30.00, late_fee: 0.00, status: 'Returned' }
//   ],
//   bookings: [
//     { booking_id: 1, venue_id: 'V2', user_id: 2, start_time: '2026-10-25 09:00:00', end_time: '2026-10-25 11:00:00', base_rate: 600.00, discount_amount: 60.00, total_cost: 540.00, status: 'Confirmed' },
//     { booking_id: 2, venue_id: 'V5', user_id: 3, start_time: '2026-10-25 07:00:00', end_time: '2026-10-25 08:00:00', base_rate: 600.00, discount_amount: 120.00, total_cost: 480.00, status: 'Confirmed' }
//   ],
//   maintenance: [
//     { operation_id: 1, target_type: 'venue', target_id: 'V4', description: 'Front squash wall plaster line crack repair and repainting.', priority: 'High', request_status: 'In Progress', scheduled_date: '2026-10-23', technician_notes: 'Contractor on site; plaster setting.' },
//     { operation_id: 2, target_type: 'equipment', target_id: 'EQ-501', description: 'Ball feeder motor calibration and battery replacement.', priority: 'Medium', request_status: 'Pending', scheduled_date: '2026-10-25', technician_notes: 'Awaiting replacement motor gear.' },
//     { operation_id: 3, target_type: 'venue', target_id: 'V5', description: 'Pool lane 3 float rope anchoring bolt replacement.', priority: 'Low', request_status: 'Completed', scheduled_date: '2026-10-20', technician_notes: 'Repaired and tested safety tension.' }
//   ]
// };

// try {
//   pool = mysql.createPool(dbConfig);
// } catch (e) {
//   console.warn('MySQL pool initialization skipped, running in mock state:', e.message);
//   useMock = true;
// }

// export async function getDbConnection() {
//   if (useMock) return null;
//   try {
//     const conn = await pool.getConnection();
//     console.log('MySQL connection established successfully.');
//     return conn;
//   } catch (err) {
//     useMock = true;
//     console.log('Notice: MySQL database not reached, seamlessly falling back to in-memory state.');
//     return null;
//   }
// }

// export const db = {
//   isMock: () => useMock,
//   getState: () => mockState,
//   async query(sql, params = []) {
//     const conn = await getDbConnection();
//     if (conn) {
//       try {
//         const [results] = await conn.query(sql, params);
//         conn.release();
//         return results;
//       } catch (err) {
//         conn.release();
//         throw err;
//       }
//     }
//     return null;
//   }
// };

// db.js
// 


import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

// 1. MySQL connection pool — keep your working configuration
export const db = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'sports_club_db',
    port: Number(process.env.DB_PORT) || 3306,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// 2. Mock data from your old code
export const mockState = {
    users: [
        { user_id: 1, name: 'Dana Lopez', username: 'Dana Lopez', email: 'dana.admin@arenaone.club', phone: '+91 9888877771', password: 'password123', role: 'admin', wallet_balance: 5000.00, is_delinquent: 0 },
        { user_id: 2, name: 'Aarav Mehta', username: 'Aarav Mehta', email: 'aarav.mehta@clubmail.com', phone: '+91 9820011223', password: 'password123', role: 'member', wallet_balance: 2450.00, is_delinquent: 0 },
        { user_id: 3, name: 'Priya Sharma', username: 'Priya Sharma', email: 'priya.sharma@clubmail.com', phone: '+91 9811122334', password: 'password123', role: 'member', wallet_balance: 5100.00, is_delinquent: 0 },
        { user_id: 4, name: 'Rohan Kapoor', username: 'Rohan Kapoor', email: 'rohan.kapoor@clubmail.com', phone: '+91 9899988776', password: 'password123', role: 'member', wallet_balance: 180.00, is_delinquent: 1 },
        { user_id: 5, name: 'Suresh Kumar', username: 'Suresh Kumar', email: 'suresh.guest@gmail.com', phone: '+91 9777766665', password: 'password123', role: 'non_member', wallet_balance: 0.00, is_delinquent: 0 }
    ],

    plans: [
        {
            plan_id: 1,
            plan_code: 'PLAN_GOLD',
            plan_name: 'Gold',
            monthly_fee: 2000.00,
            yearly_fee: 20000.00,
            equipment_discount_percent: 30.00,
            venue_discount_percent: 10.00,
            benefits: ['30% equipment discount', '10% venue discount', 'Priority booking (7 days ahead)', 'Locker access', '2 guest passes/month']
        },
        {
            plan_id: 2,
            plan_code: 'PLAN_PLAT',
            plan_name: 'Platinum',
            monthly_fee: 3000.00,
            yearly_fee: 30000.00,
            equipment_discount_percent: 50.00,
            venue_discount_percent: 20.00,
            benefits: ['50% equipment discount', '20% venue discount', 'Priority booking (14 days ahead)', 'Free court hours (4 hrs/mo)', 'Unlimited guest passes', 'Sauna & VIP lounge']
        }
    ],

    subscriptions: [
        { subscription_id: 1, user_id: 2, plan_id: 1, billing_cycle: 'monthly', amount_paid: 2000.00, start_date: '2026-10-05', end_date: '2026-11-05', status: 'Active' },
        { subscription_id: 2, user_id: 3, plan_id: 2, billing_cycle: 'yearly', amount_paid: 30000.00, start_date: '2026-08-01', end_date: '2027-08-01', status: 'Active' },
        { subscription_id: 3, user_id: 4, plan_id: 1, billing_cycle: 'monthly', amount_paid: 2000.00, start_date: '2026-09-01', end_date: '2026-10-01', status: 'Expired' }
    ],

    venues: [
        { venue_id: 'V1', venue_name: 'Main Multi-Sport Arena', venue_type: 'Hall', base_hourly_fee: 800.00, parent_venue_id: null, sports: ['Badminton', 'Basketball'], status: 'Available' },
        { venue_id: 'V2', venue_name: 'Badminton Court 1', venue_type: 'Court', base_hourly_fee: 300.00, parent_venue_id: 'V1', sports: ['Badminton'], status: 'Available' },
        { venue_id: 'V3', venue_name: 'Badminton Court 2', venue_type: 'Court', base_hourly_fee: 300.00, parent_venue_id: 'V1', sports: ['Badminton'], status: 'Available' },
        { venue_id: 'V4', venue_name: 'Squash Box Glass Court', venue_type: 'Court', base_hourly_fee: 350.00, parent_venue_id: null, sports: ['Squash'], status: 'Under Maintenance' },
        { venue_id: 'V5', venue_name: 'Olympic Heated Pool', venue_type: 'Pool', base_hourly_fee: 600.00, parent_venue_id: null, sports: ['Swimming'], status: 'Available' },
        { venue_id: 'V6', venue_name: 'Clay Tennis Court A', venue_type: 'Court', base_hourly_fee: 500.00, parent_venue_id: null, sports: ['Tennis'], status: 'Available' },
        { venue_id: 'V7', venue_name: 'FIFA Standard Turf Field', venue_type: 'Field', base_hourly_fee: 1500.00, parent_venue_id: null, sports: ['Football', 'Cricket'], status: 'Available' },
        { venue_id: 'V8', venue_name: 'Cricket Practice Nets', venue_type: 'Nets', base_hourly_fee: 400.00, parent_venue_id: 'V7', sports: ['Cricket'], status: 'Available' }
    ],

    equipment: [
        { asset_id: 'EQ-201', name: 'Yonex Astrox 88D Pro Racquet', category: 'Racquets', total_quantity: 24, available_quantity: 17, daily_price: 150.00, status: 'Available' },
        { asset_id: 'EQ-202', name: 'Head Cyber Pro Squash Racquet', category: 'Racquets', total_quantity: 10, available_quantity: 0, daily_price: 120.00, status: 'In Use' },
        { asset_id: 'EQ-310', name: 'Wilson Evolution Basketball Size 7', category: 'Balls', total_quantity: 15, available_quantity: 11, daily_price: 80.00, status: 'Available' },
        { asset_id: 'EQ-311', name: 'Nike Pitch Football Size 5', category: 'Balls', total_quantity: 20, available_quantity: 14, daily_price: 70.00, status: 'Available' },
        { asset_id: 'EQ-420', name: 'SS Complete Cricket Kit Bag', category: 'Kits', total_quantity: 6, available_quantity: 2, daily_price: 450.00, status: 'Available' },
        { asset_id: 'EQ-501', name: 'Spinshot Tennis Ball Machine', category: 'Machines', total_quantity: 2, available_quantity: 0, daily_price: 600.00, status: 'Under Maintenance' },
        { asset_id: 'EQ-610', name: 'Speedo Ergonomic Kickboard', category: 'Aquatics', total_quantity: 30, available_quantity: 26, daily_price: 40.00, status: 'Available' }
    ],

    checkouts: [
        { checkout_id: 1, asset_id: 'EQ-202', user_id: 2, issue_date: '2026-10-19', due_date: '2026-10-22', return_date: null, daily_rate: 84.00, discount_percent: 30.00, late_fee: 300.00, status: 'Overdue' },
        { checkout_id: 2, asset_id: 'EQ-201', user_id: 3, issue_date: '2026-10-24', due_date: '2026-10-27', return_date: null, daily_rate: 75.00, discount_percent: 50.00, late_fee: 0.00, status: 'Active' },
        { checkout_id: 3, asset_id: 'EQ-420', user_id: 2, issue_date: '2026-10-15', due_date: '2026-10-20', return_date: '2026-10-20', daily_rate: 315.00, discount_percent: 30.00, late_fee: 0.00, status: 'Returned' }
    ],

    bookings: [
        { booking_id: 1, venue_id: 'V2', user_id: 2, start_time: '2026-10-25 09:00:00', end_time: '2026-10-25 11:00:00', base_rate: 600.00, discount_amount: 60.00, total_cost: 540.00, status: 'Confirmed' },
        { booking_id: 2, venue_id: 'V5', user_id: 3, start_time: '2026-10-25 07:00:00', end_time: '2026-10-25 08:00:00', base_rate: 600.00, discount_amount: 120.00, total_cost: 480.00, status: 'Confirmed' }
    ],

    maintenance: [
        { operation_id: 1, target_type: 'venue', target_id: 'V4', description: 'Front squash wall plaster line crack repair and repainting.', priority: 'High', request_status: 'In Progress', scheduled_date: '2026-10-23', technician_notes: 'Contractor on site; plaster setting.' },
        { operation_id: 2, target_type: 'equipment', target_id: 'EQ-501', description: 'Ball feeder motor calibration and battery replacement.', priority: 'Medium', request_status: 'Pending', scheduled_date: '2026-10-25', technician_notes: 'Awaiting replacement motor gear.' },
        { operation_id: 3, target_type: 'venue', target_id: 'V5', description: 'Pool lane 3 float rope anchoring bolt replacement.', priority: 'Low', request_status: 'Completed', scheduled_date: '2026-10-20', technician_notes: 'Repaired and tested safety tension.' }
    ]
};

// 3. Test the MySQL connection
try {
    const connection = await db.getConnection();
    console.log(`Connected to MySQL database as id ${connection.threadId}`);
    connection.release();
} catch (err) {
    console.error('Database connection failed:', err.message);
}
