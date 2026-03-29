const express = require("express");
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const cors = require("cors");

const app = express();
app.use(express.json());

// ---------------- CORS ----------------
app.use(cors({
  origin: "https://bls-frontend-ten.vercel.app",
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true
}));

// ---------------- DB CONNECT ----------------
const MONGO_URI = "mongodb+srv://parthvasu2004_db_user:WjhlN0EoMBLpAuqJ@blsapi.lcoaoc0.mongodb.net/blsapi?retryWrites=true&w=majority";

mongoose.connect(MONGO_URI)
.then(() => console.log("MongoDB Connected"))
.catch(err => console.log(err));

// ---------------- USER MODEL ----------------
const userSchema = new mongoose.Schema({
  customer_id: Number,
  name: String,
  email: { type: String, unique: true },
  password: String,
  created_at: {
    type: Date,
    default: Date.now
  }
});

const User = mongoose.model("User", userSchema);

// ---------------- JWT ----------------
const JWT_SECRET = "your_secret_key_change_in_production";

// ---------------- MIDDLEWARE ----------------
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).send({ error: "Access token required" });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).send({ error: "Invalid token" });
    }
    req.user = user;
    next();
  });
};

// ---------------- TEST ROUTE ----------------
app.get("/", (req, res) => {
  res.send("Backend running 🚀");
});

// ---------------- REGISTER ----------------
app.post("/auth/register", async (req, res) => {
  const { name, email, password } = req.body;

  try {
    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res.status(400).send({ error: "Email already registered" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const customer_id = Math.floor(100000 + Math.random() * 900000);

    const user = new User({
      customer_id,
      name,
      email,
      password: hashedPassword
    });

    await user.save();

    res.status(201).send({
      message: "Registration successful",
      customer_id
    });

  } catch (error) {
    res.status(500).send({ error: error.message });
  }
});

// ---------------- LOGIN ----------------
app.post("/auth/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(401).send({ error: "Invalid email or password" });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).send({ error: "Invalid email or password" });
    }

    const token = jwt.sign(
      {
        user_id: user._id,
        customer_id: user.customer_id,
        email: user.email
      },
      JWT_SECRET,
      { expiresIn: "24h" }
    );

    res.send({
      message: "Login successful",
      token,
      user: {
        customer_id: user.customer_id,
        name: user.name,
        email: user.email
      }
    });

  } catch (error) {
    res.status(500).send({ error: error.message });
  }
});

// ---------------- GET CURRENT USER ----------------
app.get("/auth/me", authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.user_id);

    if (!user) {
      return res.status(404).send({ error: "User not found" });
    }

    res.send({
      customer_id: user.customer_id,
      name: user.name,
      email: user.email
    });

  } catch (error) {
    res.status(500).send({ error: error.message });
  }
});

// ---------------- EXPORT FOR VERCEL ----------------
module.exports = app;
