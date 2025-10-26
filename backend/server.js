require('dotenv').config();
const express = require('express');
const { createClient } = require('@supabase/supabase-js') //Supabase client
const bodyParser = require('body-parser');
const path = require('path'); //Handle file paths
const fs = require('fs');     //Handle file operations
const cors = require('cors');
const bcrypt = require('bcrypt');
const session = require('express-session');
const flash = require('express-flash');
const passport = require('passport');
const app = express();
const initializePassport = require('./passportConfig');
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);
const FRONTEND = (process.env.FRONTEND_URL || 'https://pathpilotaaz.netlify.app').replace(/\/+$/, '');

initializePassport(passport);
const PORT = process.env.PORT || 4000;

if (process.env.NODE_ENV === 'production') {
    app.set('trust proxy', 1);
}

const corsOptions = ({
  origin: function(origin, callback) {
    if (!origin) return callback(null, true);
    const incoming = origin.replace(/\/+$/, '');
    if (incoming === FRONTEND) {
      return callback(null, true);
    }
    return callback(new Error('CORS policy violation: Origin not allowed'));
  },
  credentials: true,
  methods: ['GET','POST','PUT','DELETE','OPTIONS'],
  allowedHeaders: ['Content-Type','Authorization']
});
 
app.options(/.*/, require('cors')(corsOptions)); // for preflight requests
app.use(require('cors')(corsOptions));

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

if (process.env.NODE_ENV === 'production') {
    app.set('trust proxy', 1);
}

app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
        maxAge: 1000 * 60 * 60 * 24 * 7 
    }
}));

app.use(passport.initialize());
app.use(passport.session());

app.use(flash());

// serve front-end files (project root)
app.use(express.static(path.join(__dirname, '..')));


// add GET /signin that injects any flash message into the HTML
app.get('/signin', (req, res) => {
    const messages = req.flash('success_msg') || [];
    const msg = messages.length ? messages[0] : '';
    const filePath = path.join(__dirname, '..', 'index.html');

    fs.readFile(filePath, 'utf8', (err, html) => {
        if (err) {
            console.error('Failed to read index.html', err);
            return res.status(500).send('Server error');
        }
        const injected = html.replace(
            '<script src="PathPilot.js"></script>',
            `<script>window.flashMessage = ${JSON.stringify(msg)};</script>\n<script src="PathPilot.js"></script>`
        );
        res.send(injected);
    });
});

// single POST for registration
app.post("/register", async (req, res) => {
    const { fname, sname, email, password, confirmPassword } = req.body || {};
    let errors = [];

    if (!fname || !sname || !email || !password || !confirmPassword) {
        errors.push({ msg: 'Please fill in all fields' });
    }
    if ((password || '').length < 6 || (confirmPassword || '').length < 6) {
        errors.push({ msg: 'Password should be at least 6 characters' });
    }
    if (password !== confirmPassword) {
        errors.push({ msg: 'Passwords do not match' });
    }
    if (errors.length > 0) {
        console.log('Registration errors:', errors);
        return res.status(400).json({ errors });
    }

    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        // check existing email via Supabase
        const { data: existing, error: selErr } = await supabase
            .from('users')
            .select('*')
            .eq('email', email)
            .limit(1);

        if (selErr) {
            console.error('Supabase select error:', selErr);
            return res.status(500).json({ error: 'Database error' });
        }

        if (existing && existing.length > 0) {
            return res.status(400).json({ errors: [{ msg: 'Email already registered' }] });
        }

        // insert user via Supabase
        const { data: inserted, error: insErr } = await supabase
            .from('users')
            .insert([{ firstname: fname, surname: sname, email, password: hashedPassword }])
            .select('id')
            .single();

        if (insErr) {
            console.error('Supabase insert error:', insErr);
            return res.status(500).json({ error: 'Database error' });
        }

        console.log('Inserted user:', inserted);
        req.flash('success_msg', 'You are now registered. Please log in.');
        return res.json({ success: true, redirect: '/signin' });

    } catch (err) {
        console.error('Server error:', err);
        return res.status(500).json({ error: 'Server error' });
    }
});

function ensureAuthenticated(req, res, next) {
    if (req.isAuthenticated && req.isAuthenticated()) return next();
    return res.status(401).json({ error: 'Not authenticated' });
}

app.post('/signin', (req, res, next) => {
    passport.authenticate('local', (err, user, info) => {
        if (err) {
            console.error('Auth error:', err);
            return res.status(500).json({ error: 'Authentication error' });
        }
        if (!user) {
            // info.message usually contains failure reason
            return res.status(400).json({ errors: [{ msg: info?.message || 'Invalid credentials' }] });
        }
        req.logIn(user, (loginErr) => {
            if (loginErr) {
                console.error('Login error:', loginErr);
                return res.status(500).json({ error: 'Login failed' });
            }
            // authenticated and session established
            return res.json({ success: true, redirect: '/dashboard' });
        });
    })(req, res, next);
});

// optional: protected route that serves the app (dashboard)
app.get('/dashboard', ensureAuthenticated, (req, res) => {
    const filePath = path.join(__dirname, '..', 'index.html');
    fs.readFile(filePath, 'utf8', (err, html) => {
        if (err) {
            console.error('Failed to read index.html', err);
            return res.status(500).send('Server error');
        }
        res.send(html);
    });
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});