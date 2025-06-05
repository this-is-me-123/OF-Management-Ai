import express from 'express';
import Database from 'better-sqlite3';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { body, validationResult } from 'express-validator';

const router = express.Router();
const db = new Database('/app/logs.db'); // Use absolute path
const SECRET = process.env.JWT_SECRET || 'dev-secret';

// Middleware to authenticate JWT token
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (token == null) return res.sendStatus(401); // if there isn't any token

  jwt.verify(token, SECRET, (err, user) => {
    if (err) return res.sendStatus(403); // if token is no longer valid
    req.user = user;
    next(); // proceed to the guarded route
  });
};

// Middleware to handle validation results
const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

// Validation rules for registration
const registerValidationRules = [
  body('email').isEmail().withMessage('Must be a valid email address').normalizeEmail(),
  body('password').isString().isLength({ min: 8 }).withMessage('Password must be at least 8 characters long')
];

// Validation rules for login
const loginValidationRules = [
  body('username').isEmail().withMessage('Must be a valid email address (sent as username)').normalizeEmail(), // Frontend sends email as 'username'
  body('password').isString().notEmpty().withMessage('Password is required')
];

// Enqueue a job for worker
router.post('/queue', (req, res) => {
  const id = uuidv4();
  const now = new Date().toISOString();
  db.prepare(
    'INSERT INTO jobs (id, folder, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?)'
  ).run(id, req.body.folder, 'queued', now, now);
  res.json({ id });
});

// Logs listing (protected)
router.get('/logs', authenticateToken, (req, res) => {
  try {
    // Fetch recent logs, optionally filter by user_id or job_id if relevant
    // For now, fetching all recent logs, limited to 50
    const logs = db.prepare('SELECT * FROM logs ORDER BY timestamp DESC LIMIT 50').all();
    res.json(logs);
  } catch (error) {
    console.error('Error fetching logs:', error);
    res.status(500).json({ message: 'Internal server error while fetching logs' });
  }
});

// Health check endpoint
router.get('/health', (req, res) => {
  res.status(200).json({ status: 'UP', message: 'Backend is healthy' });
});

import bcrypt from 'bcrypt';

// User Registration
router.post('/register', registerValidationRules, validateRequest, async (req, res) => {
  const { email, password } = req.body;

  try {
    // try {
    //   const tableInfo = db.prepare("PRAGMA table_info(users)").all();
    //   console.log('--- PRAGMA table_info(users) START ---');
    //   if (tableInfo && tableInfo.length > 0) {
    //     tableInfo.forEach(column => {
    //       console.log(`Column: name=${column.name}, type=${column.type}, notnull=${column.notnull}, pk=${column.pk}`);
    //     });
    //   } else {
    //     console.log('PRAGMA table_info(users) returned no info or an empty array.');
    //   }
    //   console.log('--- PRAGMA table_info(users) END ---');
    // } catch (e) {
    //   console.error('Error executing PRAGMA table_info(users):', e);
    // }
    const existingUser = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
    if (existingUser) {
      return res.status(409).json({ message: 'Email already exists' });
    }

    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);
    const userId = uuidv4();
    const now = new Date().toISOString();

    db.prepare(
      'INSERT INTO users (id, email, password_hash, created_at) VALUES (?, ?, ?, ?)'
    ).run(userId, email, passwordHash, now);

    res.status(201).json({ message: 'User registered successfully', userId });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Internal server error during registration' });
  }
});

// User Login
router.post('/login', loginValidationRules, validateRequest, async (req, res) => {
  const { username, password } = req.body; // Frontend sends email as 'username'

  try {
    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(username);
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign({ userId: user.id, email: user.email }, SECRET, { expiresIn: '1h' });
    res.json({ token });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Internal server error during login' });
  }
});


// Get recent jobs (protected)
router.get('/jobs', authenticateToken, (req, res) => {
  try {
    // Fetch jobs, optionally filter by user_id if your schema supports it and you want to link jobs to users
    // For now, fetching all recent jobs. If jobs table has a user_id column associated with req.user.userId:
    // const jobs = db.prepare('SELECT * FROM jobs WHERE user_id = ? ORDER BY created_at DESC LIMIT 20').all(req.user.userId);
    const jobs = db.prepare('SELECT * FROM jobs ORDER BY created_at DESC LIMIT 20').all();
    res.json(jobs);
  } catch (error) {
    console.error('Error fetching jobs:', error);
    res.status(500).json({ message: 'Internal server error while fetching jobs' });
  }
});

// Get job statistics (protected)
router.get('/stats/jobs', authenticateToken, (req, res) => {
  try {
    const stats = db.prepare(`
      SELECT 
        status, 
        COUNT(*) as count 
      FROM jobs 
      GROUP BY status
    `).all();

    // Convert array of {status: 'status_name', count: X} to an object like {'status_name': X}
    const formattedStats = stats.reduce((acc, curr) => {
      acc[curr.status] = curr.count;
      return acc;
    }, {});

    // Ensure all known statuses are present, even if count is 0
    const allStatuses = ['queued', 'running', 'completed', 'failed']; // Add any other statuses you use
    allStatuses.forEach(status => {
      if (!formattedStats[status]) {
        formattedStats[status] = 0;
      }
    });

    res.json(formattedStats);
  } catch (error) {
    console.error('Error fetching job statistics:', error);
    res.status(500).json({ message: 'Internal server error while fetching job statistics' });
  }
});

// Get user profile information (protected)
router.get('/user/profile', authenticateToken, (req, res) => {
  try {
    const userId = req.user.userId; // userId from JWT payload
    const userProfile = db.prepare('SELECT id, email, created_at FROM users WHERE id = ?').get(userId);

    if (!userProfile) {
      return res.status(404).json({ message: 'User profile not found.' });
    }

    res.json(userProfile);
  } catch (error) {
    console.error('Error fetching user profile:', error);
    res.status(500).json({ message: 'Internal server error while fetching user profile.' });
  }
});

export default router;