// server.js
require('dotenv').config();
const express = require('express');
const path = require('path');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const session = require('express-session');
const bcrypt = require('bcrypt');
const nodemailer = require('nodemailer');

const {
  init, addContact, getContacts, getStats,
  createOrUpdateAdmin, findAdminByUsername
} = require('./db');

const app = express();
const PORT = process.env.PORT || 3000;

init(); // init DB

// Middlewares
app.use(helmet());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.set('trust proxy', 1);

// Rate limiting
const limiter = rateLimit({
  windowMs: (parseInt(process.env.RATE_LIMIT_WINDOW_MINUTES || '15') * 60 * 1000),
  max: parseInt(process.env.RATE_LIMIT_MAX || '100'),
});
app.use(limiter);

// Session
app.use(session({
  secret: process.env.SESSION_SECRET || 'change_this_secret',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false } // set secure: true if using HTTPS
}));

// Setup SMTP transporter if env provided
let transporter = null;
if (process.env.SMTP_HOST && process.env.SMTP_USER) {
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });
}

// Ensure admin exists (create/update from env on first run)
(async function ensureAdmin(){
  const adminUser = process.env.ADMIN_USER || 'admin';
  const adminPass = process.env.ADMIN_PASS || 'admin123';
  const salt = await bcrypt.genSalt(10);
  const hash = await bcrypt.hash(adminPass, salt);
  createOrUpdateAdmin(adminUser, hash, (err)=>{
    if(err) console.error('Error creating admin', err);
    else console.log(`Admin user ensured: ${adminUser}`);
  });
})();

// API: submit contact
app.post('/api/contact', (req, res) => {
  const { name, email, phone, message } = req.body || {};
  if (!name || !message || (!email && !phone)) {
    return res.status(400).json({ ok: false, error: 'Provide name, message and at least email or phone.' });
  }

  const contact = {
    name: String(name).trim(),
    email: email ? String(email).trim() : '',
    phone: phone ? String(phone).trim() : '',
    message: String(message).trim(),
    createdAt: new Date().toISOString()
  };

  addContact(contact, async (err, info) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ ok: false, error: 'Failed to save' });
    }

    // Send notification email if transporter configured
    if (transporter) {
      try {
        await transporter.sendMail({
          from: process.env.FROM_EMAIL || process.env.SMTP_USER,
          to: process.env.FROM_EMAIL || process.env.SMTP_USER,
          subject: `New contact from ${contact.name}`,
          text: `Name: ${contact.name}\nEmail: ${contact.email}\nPhone: ${contact.phone}\nMessage:\n${contact.message}`
        });
      } catch (e) {
        console.error('Email send failed', e);
      }
    }

    res.json({ ok: true, id: info.id });
  });
});

// Admin login
app.post('/api/admin/login', (req, res) => {
  const { username, password } = req.body || {};
  if (!username || !password) return res.status(400).json({ ok: false, error: 'Missing' });

  findAdminByUsername(username, async (err, user) => {
    if (err || !user) return res.status(401).json({ ok: false, error: 'Invalid' });

    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) return res.status(401).json({ ok: false, error: 'Invalid' });

    req.session.admin = { id: user.id, username: user.username };
    res.json({ ok: true });
  });
});

// Admin logout
app.post('/api/admin/logout', (req, res) => {
  req.session.destroy(()=>res.json({ ok: true }));
});

// Auth middleware
function requireAdmin(req, res, next) {
  if (req.session && req.session.admin) return next();
  return res.status(401).json({ ok: false, error: 'Unauthorized' });
}

// Admin API: get contacts
app.get('/api/admin/contacts', requireAdmin, (req, res) => {
  getContacts((err, rows) => {
    if (err) return res.status(500).json({ ok: false, error: 'DB error' });
    res.json(rows);
  });
});

// Admin API: stats
app.get('/api/admin/stats', requireAdmin, (req, res) => {
  getStats((err, stats) => {
    if (err) return res.status(500).json({ ok: false, error: 'DB error' });
    res.json({ ok: true, stats });
  });
});

// Serve admin page (static file)
app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

// Fallback to index (SPA friendly)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => console.log(`Server running at http://localhost:${PORT}`));
