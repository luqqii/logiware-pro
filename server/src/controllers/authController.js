const pool = require('../database/pgClient');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');

const generateToken = (user) => {
  return jwt.sign(
    { userId: user.user_id, orgId: user.org_id, role: user.role, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN }
  );
};

exports.signup = async (req, res) => {
  try {
    const { orgName, industry, email, password, name, phone } = req.body;

    // Check if email exists
    const existing = await pool.query('SELECT user_id FROM users WHERE email = $1', [email]);
    if (existing.rows.length > 0) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const orgId = uuidv4();

    // Create organization
    await pool.query(
      'INSERT INTO organizations (org_id, name, industry) VALUES ($1, $2, $3)',
      [orgId, orgName, industry || 'logistics']
    );

    // Create user
    await pool.query(
      'INSERT INTO users (user_id, org_id, email, password_hash, name, role, phone) VALUES ($1, $2, $3, $4, $5, $6, $7)',
      [uuidv4(), orgId, email, hashedPassword, name, 'admin', phone]
    );

    const token = jwt.sign(
      { userId: uuidv4(), orgId, role: 'admin', email },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );

    res.status(201).json({
      message: 'Organization and user created',
      token,
      orgId,
    });
  } catch (err) {
    console.error('Signup error:', err);
    res.status(500).json({ error: 'Signup failed' });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const result = await pool.query(
      'SELECT user_id, org_id, email, password_hash, name, role, is_active FROM users WHERE email = $1',
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = result.rows[0];

    if (!user.is_active) {
      return res.status(403).json({ error: 'Account deactivated' });
    }

    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Update last login
    await pool.query('UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE user_id = $1', [user.user_id]);

    const token = generateToken(user);

    res.json({
      token,
      user: {
        userId: user.user_id,
        orgId: user.org_id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Login failed' });
  }
};

exports.getProfile = async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT user_id, org_id, email, name, role, phone, is_active, last_login, created_at FROM users WHERE user_id = $1',
      [req.user.userId]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
};
