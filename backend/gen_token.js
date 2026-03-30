// Generates a real JWT for auth bypass user (harsh@gmail.com, id=11)
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this-in-production';

const token = jwt.sign(
  { id: 11, email: 'harsh@gmail.com', role: 'founder', name: 'Harsh' },
  JWT_SECRET,
  { expiresIn: '365d' }
);

console.log('=== DEV BYPASS JWT TOKEN ===');
console.log(token);
console.log('============================');
