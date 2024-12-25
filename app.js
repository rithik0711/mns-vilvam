const express = require("express");
const mysql = require("mysql2");
const app = express();
const cors = require("cors");

// Allow all origins temporarily for debugging (Not recommended for production)
app.use(cors({
    origin: "*", // Allow all origins (Not secure, only for debugging)
    methods: ["GET", "POST"],
    credentials: false, // No credentials if origin is "*"
}));

//Optionally, you can restrict specific domains
const allowedOrigins = [
    "https://mnsvilvam-usilampatti.netlify.app", // Frontend on Netlify
    "http://localhost:3000", // Localhost for testing
    "http://127.0.0.1:3000",  // Another local variation
    "https://mns-vilvam.netlify.app/"
];

app.use(cors({
    origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error("Not allowed by CORS"));
        }
    },
    methods: ["GET", "POST"],
    credentials: true,
}));

require("dotenv").config();
const bodyParser = require("body-parser");

// Middleware to parse JSON bodies
app.use(express.json());

// MySQL Database connection
const db = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
});

db.connect((err) => {
    if (err) {
        console.error("Connection Failed:", err.message);
        process.exit(1); // Exit the application if the DB connection fails
    } else {
        console.log("Connected to the database successfully.");
    }
});

// Signup route to insert user data into the database
app.post("/api/signup", (req, res) => {
    console.log("Request received:", req.body); 
    const { name, username, password } = req.body;

    // Check for missing fields
    if (!name || !username || !password) {
        console.log("Missing fields:", { name, username, password });
        return res.status(400).json({ success: false, message: "All fields are required." });
    }

    // Basic password validation (ensure it's at least 8 characters long)
    if (password.length < 8) {
        return res.status(400).json({ success: false, message: "Password must be at least 8 characters long." });
    }

    // Define the SQL query to insert user data
    const query = "INSERT INTO login (name, username, password) VALUES (?, ?, ?)";

    // Execute the query to insert data
    db.query(query, [name, username, password], (err, result) => {
        if (err) {
            console.error("Error during query execution:", err.message);
            return res.status(500).json({ success: false, message: "Server error. Please try again later." });
        }
        res.status(201).json({ success: true, message: "User signed up successfully!" });
    });
});

// Login route
app.post("/api/login", (req, res) => {
    console.log("Request received:", req.body);
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ success: false, message: "Username and password are required." });
    }

    const query = "SELECT * FROM login WHERE username = ?";
    db.query(query, [username], (err, results) => {
        if (err) {
            return res.status(500).json({ success: false, message: "Server error." });
        }

        if (results.length === 0) {
            return res.status(401).json({ success: false, message: "Invalid username or password." });
        }

        const user = results[0];

        if (password !== user.password) {
            return res.status(401).json({ success: false, message: "Invalid username or password." });
        }

        res.status(200).json({ success: true, message: "Login successful!" });
    });
});

// Home route to check server status
app.get("/", (req, res) => {
    res.send("<h1>Home Page</h1>");
});

// Server listens on the specified port
const PORT = process.env.PORT || 5001;  // Change 5000 to another port if needed
app.listen(PORT, () => {
    console.log(`Server started on port ${PORT}`);
});
