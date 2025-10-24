const express = require('express');
const app = express();
const path = require('path'); // Add this to handle file paths
const fs = require('fs');     // Add this to handle file operations

const PORT = process.env.PORT || 4000;

app.use(express.json()); // Add middleware to parse JSON bodies

app.post("/pathpilot", (req, res) => {
    const { email, password } = req.body;
    console.log({
        email,
        password
    });
    res.send('Credentials received');
});



app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
