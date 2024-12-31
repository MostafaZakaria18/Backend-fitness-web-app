const express = require("express");
const mysql = require("mysql");
const bodyParser = require("body-parser");
const crypto = require("crypto");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const sgMail = require("@sendgrid/mail");
require("dotenv").config();

const router = express.Router();
sgMail.setApiKey('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');

// Database connection
const db = mysql.createConnection({
  host: "localhost",
  user: "mostafa",
  password: "123456",
  database: "fitness",
});
db.connect((err) => {
  if (err) throw err;
  console.log("Database connected.");
});

// Temporary in-memory storage for OTPs
const otpStore = {};

// JWT Secret Key
const JWT_SECRET = process.env.JWT_SECRET || "your_jwt_secret";

// Function to generate a 6-digit OTP
function generateOTP() {
  return crypto.randomInt(100000, 999999).toString();
}

// Function to hash OTP
function hashOTP(otp) {
  return crypto.createHash("sha256").update(otp).digest("hex");
}

// Function to send OTP via email
async function sendOTPEmail(email, otp) {
  const msg = {
    to: email,
    from: "youssef.16jan@gmail.com", // Replace with your verified sender email
    subject: "Your OTP Code",
    text: Your OTP is: ${otp}. It will expire in 5 minutes.,
  };

  try {
    await sgMail.send(msg);
    console.log(OTP sent to ${email});
  } catch (error) {
    console.error("Error sending email:", error.response ? error.response.body : error);
    throw new Error("Failed to send OTP email.");
  }
}

// GET all users
router.get("/all", (req, res) => {
  const query = SELECT * FROM user;
  db.query(query, (err, result) => {
    if (err) {
      res.status(500).send("Error fetching user data. " + err);
    } else {
      res.json(result);
    }
  });
});

// GET user by email
router.get("/", (req, res) => {
  const email = req.query.email;
  const query = SELECT * FROM user WHERE email='${email}';
  db.query(query, (err, result) => {
    if (err) {
      res.status(500).send("Error fetching user data.");
    } else {
      res.json(result);
    }
  });
});
router.put("/",(req, res)=>{
  const{name, phone, birthDate, email}=req.body;
  const mysqlDate = new Date(birthDate).toISOString().split('T')[0];
  if (!name || !phone || !birthDate) {
    return res.status(400).send("All fields are required.");
  }    
  const query = `
  UPDATE user
  SET name = '${name}' ,phone ='${phone}' ,birthDate='${mysqlDate}'
  WHERE email ='${email}'
`;
db.query(query, [name, phone, mysqlDate, email], (err, result) => {
  if (err) {
    console.error("Database Error: ", err);
    res.status(500).send("Error updating user data.");
  } else {
    res.json({ message: "User updated successfully." });
  }
});
});
// Sign-In Route
router.post("/SignIn", (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required." });
  }

  const query = SELECT * FROM user WHERE email='${email}';
  db.query(query, async (err, result) => {
    if (err) {
      return res.status(500).send("Error fetching user data: " + err);
    }

    const user = result[0];
    if (!user) {
      return res.status(401).json({ error: "Invalid email." });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: "Invalid email or password." });
    }

    // User credentials are valid; generate and send OTP
    const otp = generateOTP();
    const hashedOtp = hashOTP(otp);
    otpStore[email] = { hashedOtp, expiresAt: Date.now() + 300000 }; // OTP expires in 5 minutes

    try {
      await sendOTPEmail(email, otp);
      res.status(200).json({ message: "OTP sent to your email. Please verify to complete sign-in." });
    } catch (error) {
      res.status(500).json({ error: "Failed to send OTP email." });
    }
  });
});

// OTP Verification Route
router.post("/VerifyOTP", (req, res) => {
  const { email, otp } = req.body;

  if (!email || !otp) {
    return res.status(400).json({ error: "Email and OTP are required." });
  }

  const storedOTP = otpStore[email];
  if (!storedOTP) {
    return res.status(401).json({ error: "No OTP found for this email. Please sign in again." });
  }

  if (storedOTP.expiresAt < Date.now()) {
    delete otpStore[email]; // Remove expired OTP
    return res.status(401).json({ error: "OTP has expired. Please request a new one." });
  }

  const hashedInputOTP = hashOTP(otp);
  if (storedOTP.hashedOtp !== hashedInputOTP) {
    return res.status(401).json({ error: "Invalid OTP. Please try again." });
  }

  // OTP is valid; generate a JWT
  delete otpStore[email]; // Remove OTP after successful verification
  const token = jwt.sign({ email }, JWT_SECRET, { expiresIn: "1h" });
  res.status(200).json({ message: "Sign-in successful!", token });
});

// Register Route
router.post("/", async (req, res) => {
  const { name, email, password, sex, birthDate, phone } = req.body;

  if (!name || !email || !password || !sex || !birthDate || !phone) {
    return res.status(400).json({ error: "All fields are required." });
  }
  if (!["m", "f"].includes(sex)) {
    return res.status(400).json({ error: "Invalid value for sex." });
  }

  try {
    const hashedPass = await bcrypt.hash(password,2);
    const query = `
      INSERT INTO user (name, email, password, sex, birthDate, phone)
      VALUES (?, ?, ?, ?, ?, ?)
    `;
    db.query(query, [name, email, hashedPass, sex, birthDate, phone], (err, result) => {
      if (err) {
        if (err.code === "ER_DUP_ENTRY") {
          return res.status(400).json({ error: "Email or phone number already exists." });
        }
        return res.status(500).json({ error: "Internal server error.", err });
      }
      res.status(201).json({ message: "User created successfully.", userId: result.insertId });
    });
  } catch (error) {
    console.log("Error hashing password", error);
    res.status(500).json({ error: "Internal server error.hhhh" });
  }
});

module.exports = router;
