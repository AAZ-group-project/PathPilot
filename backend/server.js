const express = require('express');
const app = express();
const { pool } = require("./dbConfig");
const path = require('path'); // Add this to handle file paths
const fs = require('fs');     // Add this to handle file operations
const cors = require('cors');
const bcrypt = require('bcrypt');

const PORT = process.env.PORT || 4000;

app.use(cors());
// parse JSON and urlencoded bodies
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// serve front-end files (project root)
app.use(express.static(path.join(__dirname, '..')));

// single POST for registration
app.post("/register", async (req, res) => {
    const { fname, sname, email, password, confirmPassword } = req.body || {};
    let errors = [];
    //Error handling and validation
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
    } else{
        // Form validation succeeded

        let hashedPassword = await bcrypt.hash(password, 10);
        console.log(hashedPassword);

        pool.query(
            `SELECT * FROM users 
            WHERE email = $1`,
            [email],
            (err, results) => {
                if (err) {
                    throw err;
                }

                console.log(results.rows);

                if (results.rows.length > 0) {
                    errors.push({ msg: 'Email already registered' });
                    return res.status(400).json({ errors });
                }
            }
        )
    }

    // valid — log registration and respond
    console.log('Received registration:', { fname, sname, email });
    return res.json({ status: 'received' });
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});