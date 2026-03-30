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



const loanSchema = new mongoose.Schema({
  loan_id: String,
  customer_id: Number,
  principal_amount: Number,
  total_amount: Number,
  interest_rate: Number,
  loan_period_years: Number,
  monthly_emi: Number,
  status: {
    type: String,
    default: "ACTIVE"
  },
  created_at: {
    type: Date,
    default: Date.now
  }
});

const Loan = mongoose.model("Loan", loanSchema);

const transactionSchema = new mongoose.Schema({
  transaction_id: String,
  loan_id: String,
  amount: Number,
  type: String,
  date: {
    type: Date,
    default: Date.now
  }
});

const Transaction = mongoose.model("Transaction", transactionSchema);

app.post("/loans", authenticateToken, async (req, res) => {
  const { loan_amount, loan_period_years } = req.body;
  const customer_id = req.user.customer_id;

  try {
    const interest_rate = 7;

    const total_interest =
      loan_amount * loan_period_years * (interest_rate / 100);

    const total_amount = loan_amount + total_interest;

    const monthly_emi = Number(
      (total_amount / (loan_period_years * 12)).toFixed(2)
    );

    const loan_id = "LN" + Date.now();

    const loan = new Loan({
      loan_id,
      customer_id,
      principal_amount: loan_amount,
      total_amount,
      interest_rate,
      loan_period_years,
      monthly_emi
    });

    await loan.save();

    res.send({
      loan_id,
      total_amount,
      monthly_emi
    });

  } catch (err) {
    res.status(500).send({ error: err.message });
  }
});

app.post("/loans/:loan_id/payments", authenticateToken, async (req, res) => {
  const { loan_id } = req.params;
  const { amount, transaction_type } = req.body;

  try {
    const loan = await Loan.findOne({ loan_id });

    if (!loan) {
      return res.status(404).send({ error: "Loan not found" });
    }

    const transactions = await Transaction.find({ loan_id });

    const total_paid = transactions.reduce((sum, t) => sum + t.amount, 0);

    const remaining = loan.total_amount - total_paid;

    if (remaining <= 0) {
      return res.status(400).send({ error: "Loan already paid" });
    }

    const transaction_id = "PMT" + Date.now();

    const newTransaction = new Transaction({
      transaction_id,
      loan_id,
      amount,
      type: transaction_type
    });

    await newTransaction.save();

    const new_total_paid = total_paid + amount;
    const new_remaining = loan.total_amount - new_total_paid;

    res.send({
      transaction_id,
      remaining_balance: new_remaining
    });

  } catch (err) {
    res.status(500).send({ error: err.message });
  }
});

app.get("/dashboard/analytics", authenticateToken, async (req, res) => {
  const customer_id = req.user.customer_id;

  try {
    const loans = await Loan.find({ customer_id });

    if (loans.length === 0) {
      return res.send({
        summary: {
          totalLoans: 0,
          totalBorrowed: 0,
          totalPaid: 0
        }
      });
    }

    let totalBorrowed = 0;
    let totalPaid = 0;

    for (const loan of loans) {
      totalBorrowed += loan.principal_amount;

      const transactions = await Transaction.find({ loan_id: loan.loan_id });

      const paid = transactions.reduce((sum, t) => sum + t.amount, 0);

      totalPaid += paid;
    }

    res.send({
      summary: {
        totalLoans: loans.length,
        totalBorrowed,
        totalPaid
      }
    });

  } catch (err) {
    res.status(500).send({ error: err.message });
  }
});

app.get("/customers/overview", authenticateToken, async (req, res) => {
  const customer_id = req.user.customer_id;

  try {
    const loans = await Loan.find({ customer_id });

    res.send({
      total_loans: loans.length,
      loans
    });

  } catch (err) {
    res.status(500).send({ error: err.message });
  }
});





// ---------------- EXPORT FOR VERCEL ----------------
module.exports = app;
