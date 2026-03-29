const express = require("express");
const path = require("path");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const cors = require("cors");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const app = express();
app.use(express.json());

import express from "express";
import cors from "cors";
import serverless from "serverless-http";
app.use(cors({ origin: "http://localhost:5173" }));


// rest of your routes...


const dbPath = path.join(__dirname, "banklending.db");
let db = null;

// Secret key for JWT (change this in production!)
const JWT_SECRET = "your_secret_key_change_in_production";

// ---------------- DB INIT ----------------
const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });

    // Create Users table if not exists
    await db.exec(`
      CREATE TABLE IF NOT EXISTS Users (
        user_id INTEGER PRIMARY KEY AUTOINCREMENT,
        customer_id INTEGER UNIQUE,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    app.get('/', (req, res) => {
  res.send('Backend API is running!');
});

    app.listen(5000, () => {
      console.log("Server Running at http://localhost:5000/");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};

initializeDBAndServer();

function getISTDateTime() {
  const now = new Date();
  const istOffsetMs = 5.5 * 60 * 60 * 1000;
  const istTime = new Date(now.getTime() + istOffsetMs);
  return istTime.toISOString().replace("T", " ").slice(0, 19);
}

// ---------------- MIDDLEWARE: Verify JWT Token ----------------
const authenticateToken = (request, response, next) => {
  const authHeader = request.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return response.status(401).send({ error: "Access token required" });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return response.status(403).send({ error: "Invalid or expired token" });
    }
    request.user = user;
    next();
  });
};

// ---------------- AUTH API 1: REGISTER ----------------
app.post("/auth/register", async (request, response) => {
  const { name, email, password } = request.body;

  try {
    // Check if user already exists
    const existingUser = await db.get(
      `SELECT * FROM Users WHERE email = ?`,
      [email]
    );

    if (existingUser) {
      return response.status(400).send({ error: "Email already registered" });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Generate unique customer_id
    const customer_id = Math.floor(100000 + Math.random() * 900000);

    // Insert user
    await db.run(
      `INSERT INTO Users (customer_id, name, email, password) VALUES (?, ?, ?, ?)`,
      [customer_id, name, email, hashedPassword]
    );

    // Also create entry in Customers table
    await db.run(
      `INSERT INTO Customers (customer_id, name, email, password, created_at) VALUES (?, ?, ?, ?, ?)`,
      [customer_id, name, email, hashedPassword, getISTDateTime()]
    );

    response.status(201).send({
      message: "Registration successful",
      customer_id,
    });
  } catch (error) {
    response.status(500).send({ error: error.message });
  }
});

// ---------------- AUTH API 2: LOGIN ----------------
app.post("/auth/login", async (request, response) => {
  const { email, password } = request.body;

  try {
    const user = await db.get(
      `SELECT * FROM Users WHERE email = ?`,
      [email]
    );

    if (!user) {
      return response.status(401).send({ error: "Invalid email or password" });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return response.status(401).send({ error: "Invalid email or password" });
    }

    // Generate JWT token
    const token = jwt.sign(
      { user_id: user.user_id, customer_id: user.customer_id, email: user.email },
      JWT_SECRET,
      { expiresIn: "24h" }
    );

    response.send({
      message: "Login successful",
      token,
      user: {
        customer_id: user.customer_id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (error) {
    response.status(500).send({ error: error.message });
  }
});

// ---------------- AUTH API 3: GET CURRENT USER ----------------
app.get("/auth/me", authenticateToken, async (request, response) => {
  try {
    const user = await db.get(
      `SELECT user_id, customer_id, name, email FROM Users WHERE user_id = ?`,
      [request.user.user_id]
    );

    if (!user) {
      return response.status(404).send({ error: "User not found" });
    }

    response.send(user);
  } catch (error) {
    response.status(500).send({ error: error.message });
  }
});

// ---------------- AUTH API 4: VERIFY CUSTOMER FOR PASSWORD RESET ----------------
app.post("/auth/verify-customer", async (request, response) => {
  const { customer_id, email } = request.body;

  try {
    const user = await db.get(
      `SELECT user_id, customer_id, name, email FROM Users WHERE customer_id = ? AND email = ?`,
      [customer_id, email]
    );

    if (!user) {
      return response.status(404).send({ 
        error: "No account found with this Customer ID and Email combination" 
      });
    }

    response.send({
      message: "Verification successful",
      customer_id: user.customer_id,
      name: user.name,
    });
  } catch (error) {
    response.status(500).send({ error: error.message });
  }
});

// ---------------- AUTH API 5: RESET PASSWORD ----------------
app.post("/auth/reset-password", async (request, response) => {
  const { customer_id, email, new_password } = request.body;

  try {
    // Verify user exists
    const user = await db.get(
      `SELECT * FROM Users WHERE customer_id = ? AND email = ?`,
      [customer_id, email]
    );

    if (!user) {
      return response.status(404).send({ error: "User not found" });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(new_password, 10);

    // Update password in Users table
    await db.run(
      `UPDATE Users SET password = ? WHERE customer_id = ?`,
      [hashedPassword, customer_id]
    );

    // Update password in Customers table
    await db.run(
      `UPDATE Customers SET password = ? WHERE customer_id = ?`,
      [hashedPassword, customer_id]
    );

    response.send({
      message: "Password reset successful",
    });
  } catch (error) {
    response.status(500).send({ error: error.message });
  }
});

// ---------------- API 1 : CREATE LOAN (Protected) ----------------
app.post("/loans/", authenticateToken, async (request, response) => {
  const { loan_amount, loan_period_years } = request.body;
  
  // Use customer_id from authenticated user
  const customer_id = request.user.customer_id;

  try {
    // Get user's name
    const user = await db.get(
      `SELECT name FROM Users WHERE customer_id = ?`,
      [customer_id]
    );

    const interest_rate_yearly = 7;
    const total_interest =
      loan_amount * loan_period_years * (interest_rate_yearly / 100);

    const total_amount = loan_amount + total_interest;
    const monthly_emi = Number(
      (total_amount / (loan_period_years * 12)).toFixed(2)
    );

    const loan_id = `LN${Date.now()}`;

    await db.run(
      `
      INSERT INTO Loans (
        loan_id,
        customer_id,
        principal_amount,
        total_amount,
        interest_rate,
        loan_period_years,
        monthly_emi,
        status
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, 'ACTIVE')
      `,
      [
        loan_id,
        customer_id,
        loan_amount,
        total_amount,
        interest_rate_yearly,
        loan_period_years,
        monthly_emi,
      ]
    );

    response.send({
      loan_id,
      customer_id,
      total_amount_payable: total_amount,
      monthly_emi,
    });
  } catch (error) {
    response.status(500).send({ error: error.message });
  }
});

// ---------------- API 2 : PAYMENT (Protected) ----------------
app.post("/loans/:loan_id/payments", authenticateToken, async (request, response) => {
  const { loan_id } = request.params;
  const { amount, transaction_type } = request.body;
  const customer_id = request.user.customer_id;

  try {
    const loan = await db.get(
      `SELECT * FROM Loans WHERE loan_id = ? AND customer_id = ?`,
      [loan_id, customer_id]
    );

    if (!loan) {
      return response.status(404).send({ error: "Loan not found or unauthorized" });
    }

    // Check total paid so far
    const paid = await db.get(
      `SELECT SUM(amount) AS total_paid FROM Transactions WHERE loan_id = ?`,
      [loan_id]
    );

    const total_paid = paid.total_paid || 0;
    const remaining_balance = Math.max(loan.total_amount - total_paid, 0);

    // Check if loan is already fully paid
    if (remaining_balance === 0) {
      return response.status(400).send({ 
        error: "Loan is already fully paid",
        message: "🎉 Congratulations! This loan has been completed. No further payments needed.",
        loan_id: loan_id,
        total_amount: loan.total_amount,
        total_paid: total_paid,
        status: "COMPLETED"
      });
    }

    // Check if payment amount exceeds remaining balance
    if (amount > remaining_balance) {
      return response.status(400).send({ 
        error: "Payment amount exceeds remaining balance",
        message: `Payment amount (₹${amount}) is more than the remaining balance (₹${remaining_balance}). Please pay ₹${remaining_balance} or less.`,
        remaining_balance: remaining_balance,
        payment_attempted: amount
      });
    }

    const transaction_id = `PMT${Date.now()}`;
    const date = getISTDateTime();

    // Record the payment
    await db.run(
      `
      INSERT INTO Transactions
      (transaction_id, loan_id, amount, type, date)
      VALUES (?, ?, ?, ?, ?)
      `,
      [transaction_id, loan_id, amount, transaction_type, date]
    );

    // Calculate new totals
    const new_total_paid = total_paid + amount;
    const new_remaining_balance = Math.max(loan.total_amount - new_total_paid, 0);
    const emis_left = new_remaining_balance > 0 ? Math.ceil(new_remaining_balance / loan.monthly_emi) : 0;

    // Check if loan is now completed
    let status_message = "Payment recorded successfully";
    let loan_status = "ACTIVE";

    if (new_remaining_balance === 0) {
      status_message = "🎉 Congratulations! Your loan has been fully paid!";
      loan_status = "CLOSED";
      
      // Update loan status in database
      await db.run(
        `UPDATE Loans SET status = ? WHERE loan_id = ?`,
        [loan_status, loan_id]
      );
    }

    response.send({
      transaction_id,
      loan_id,
      remaining_balance: new_remaining_balance,
      emis_left,
      message: status_message,
      loan_status: loan_status,
      total_paid: new_total_paid,
      is_completed: new_remaining_balance === 0
    });
  } catch (error) {
    response.status(500).send({ error: error.message });
  }
});

// ---------------- API 3 : LOAN LEDGER (Protected) ----------------
app.get("/loans/:loan_id/ledger", authenticateToken, async (request, response) => {
  const { loan_id } = request.params;
  const customer_id = request.user.customer_id;

  try {
    const loan = await db.get(
      `SELECT * FROM Loans WHERE loan_id = ? AND customer_id = ?`,
      [loan_id, customer_id]
    );

    if (!loan) {
      return response.status(404).send({ error: "Loan not found or unauthorized" });
    }

    const transactions = await db.all(
      `SELECT * FROM Transactions WHERE loan_id = ? ORDER BY date`,
      [loan_id]
    );

    const paid = await db.get(
      `SELECT SUM(amount) AS total_paid FROM Transactions WHERE loan_id = ?`,
      [loan_id]
    );

    const total_paid = paid.total_paid || 0;
    const balance_amount = Math.max(loan.total_amount - total_paid, 0);
    const emis_left = Math.ceil(balance_amount / loan.monthly_emi);

    response.send({
      loan_id: loan.loan_id,
      customer_id: loan.customer_id,
      principal: loan.principal_amount,
      total_amount: loan.total_amount,
      monthly_emi: loan.monthly_emi,
      total_paid,
      balance_amount,
      emis_left,
      transactions,
    });
  } catch (error) {
    response.status(500).send({ error: error.message });
  }
});

// ---------------- API 4 : CUSTOMER OVERVIEW (Protected) ----------------
app.get("/customers/overview", authenticateToken, async (request, response) => {
  const customer_id = request.user.customer_id;

  try {
    // Get user info from Users table
    const user = await db.get(
      `SELECT * FROM Users WHERE customer_id = ?`,
      [customer_id]
    );

    if (!user) {
      return response.status(404).send({ error: "User not found" });
    }

    const loans = await db.all(
      `SELECT * FROM Loans WHERE customer_id = ?`,
      [customer_id]
    );

    if (loans.length === 0) {
      return response.send({
        customer_id,
        total_loans: 0,
        loans: [],
      });
    }

    const resultLoans = [];

    for (const loan of loans) {
      const paid = await db.get(
        `SELECT SUM(amount) AS amount_paid FROM Transactions WHERE loan_id = ?`,
        [loan.loan_id]
      );

      const amount_paid = paid.amount_paid || 0;
      const balance_amount = Math.max(loan.total_amount - amount_paid, 0);
      const emis_left = Math.ceil(balance_amount / loan.monthly_emi);
      const total_interest = loan.total_amount - loan.principal_amount;

      resultLoans.push({
        loan_id: loan.loan_id,
        principal: loan.principal_amount,
        total_amount: loan.total_amount,
        total_interest,
        emi_amount: loan.monthly_emi,
        amount_paid,
        emis_left,
      });
    }

    response.send({
      customer_id,
      total_loans: resultLoans.length,
      loans: resultLoans,
    });
  } catch (error) {
    response.status(500).send({ error: error.message });
  }
});

// ---------------- API 5 : EMI/LUMPSUM (Protected) ----------------
app.get("/loans/:loan_id/emi", authenticateToken, async (request, response) => {
  try {
    const { loan_id } = request.params;
    const customer_id = request.user.customer_id;

    const loan = await db.get(
      `SELECT monthly_emi FROM Loans WHERE loan_id = ? AND customer_id = ?`,
      [loan_id, customer_id]
    );

    if (!loan) {
      return response.status(404).send({ error: "Loan not found or unauthorized" });
    }

    response.send({
      emi_amount: loan.monthly_emi,
    });
  } catch (error) {
    response.status(500).send({ error: error.message });
  }
});

// Add this to your backend/index.js

// ---------------- API 6: DASHBOARD ANALYTICS (Protected) ----------------
app.get("/dashboard/analytics", authenticateToken, async (request, response) => {
  const customer_id = request.user.customer_id;

  try {
    // Get all loans for the customer
    const loans = await db.all(
      `SELECT * FROM Loans WHERE customer_id = ?`,
      [customer_id]
    );

    if (loans.length === 0) {
      return response.send({
        customer_id,
        summary: {
          totalLoans: 0,
          totalBorrowed: 0,
          totalPaid: 0,
          totalOutstanding: 0,
          activeLoans: 0,
          closedLoans: 0,
          avgLoanAmount: 0,
          totalInterestPaid: 0,
        },
        loanDistribution: [],
        paymentTrends: [],
        loansByStatus: [],
        recentTransactions: [],
      });
    }

    let totalBorrowed = 0;
    let totalPaid = 0;
    let totalOutstanding = 0;
    let activeLoans = 0;
    let closedLoans = 0;
    let totalInterestPaid = 0;

    const loanDistribution = [];
    const loansByStatus = [];

    for (const loan of loans) {
      // Calculate paid amount
      const paid = await db.get(
        `SELECT SUM(amount) AS amount_paid FROM Transactions WHERE loan_id = ?`,
        [loan.loan_id]
      );

      const amount_paid = paid.amount_paid || 0;
      const balance = Math.max(loan.total_amount - amount_paid, 0);
      const interest_paid = Math.min(
        amount_paid - loan.principal_amount,
        loan.total_amount - loan.principal_amount
      );

      totalBorrowed += loan.principal_amount;
      totalPaid += amount_paid;
      totalOutstanding += balance;

      if (interest_paid > 0) {
        totalInterestPaid += interest_paid;
      }

      if (balance > 0) {
        activeLoans++;
      } else {
        closedLoans++;
      }

      // Loan distribution data
      loanDistribution.push({
        loan_id: loan.loan_id.substring(0, 8) + "...",
        amount: loan.principal_amount,
        paid: amount_paid,
        remaining: balance,
      });

      // Loans by status
      loansByStatus.push({
        loan_id: loan.loan_id,
        status: balance > 0 ? "Active" : "Closed",
        amount: loan.principal_amount,
      });
    }

    // Get payment trends (monthly)
    const paymentTrends = await db.all(
      `
      SELECT 
        strftime('%Y-%m', date) as month,
        SUM(amount) as total_amount,
        COUNT(*) as payment_count,
        type
      FROM Transactions
      WHERE loan_id IN (
        SELECT loan_id FROM Loans WHERE customer_id = ?
      )
      GROUP BY month, type
      ORDER BY month DESC
      LIMIT 12
      `,
      [customer_id]
    );

    // Get recent transactions
    const recentTransactions = await db.all(
      `
      SELECT 
        t.transaction_id,
        t.loan_id,
        t.amount,
        t.type,
        t.date,
        l.monthly_emi
      FROM Transactions t
      JOIN Loans l ON t.loan_id = l.loan_id
      WHERE l.customer_id = ?
      ORDER BY t.date DESC
      LIMIT 10
      `,
      [customer_id]
    );

    // Calculate average loan amount
    const avgLoanAmount =
      totalBorrowed / loans.length || 0;

    // Summary metrics
    const summary = {
      totalLoans: loans.length,
      totalBorrowed: Math.round(totalBorrowed),
      totalPaid: Math.round(totalPaid),
      totalOutstanding: Math.round(totalOutstanding),
      activeLoans,
      closedLoans,
      avgLoanAmount: Math.round(avgLoanAmount),
      totalInterestPaid: Math.round(totalInterestPaid),
      paymentSuccessRate: Math.round((totalPaid / totalBorrowed) * 100) || 0,
    };

    // Status distribution for pie chart
    const statusDistribution = [
      { status: "Active", count: activeLoans },
      { status: "Closed", count: closedLoans },
    ];

    response.send({
      customer_id,
      summary,
      loanDistribution: loanDistribution.slice(0, 10),
      paymentTrends: paymentTrends.reverse(),
      statusDistribution,
      recentTransactions,
    });
  } catch (error) {
    response.status(500).send({ error: error.message });
  }
});

// ---------------- API 7: CREDIT SCORE CALCULATION (Protected) ----------------
app.get("/credit-score", authenticateToken, async (request, response) => {
  const customer_id = request.user.customer_id;

  try {
    // Get user creation date
    const user = await db.get(
      `SELECT created_at FROM Users WHERE customer_id = ?`,
      [customer_id]
    );

    // Get all loans
    const loans = await db.all(
      `SELECT * FROM Loans WHERE customer_id = ?`,
      [customer_id]
    );

    if (loans.length === 0) {
      return response.send({
        credit_score: 300,
        rating: "No Credit History",
        factors: {
          payment_history: { score: 0, weight: 35, description: "No payment history" },
          debt_utilization: { score: 0, weight: 30, description: "No debt history" },
          credit_age: { score: 0, weight: 15, description: "No credit history" },
          credit_mix: { score: 0, weight: 10, description: "No loans taken" },
          new_credit: { score: 0, weight: 10, description: "No recent applications" },
        },
        recommendations: [
          "Apply for your first loan to start building credit history",
          "Make timely payments to improve your score",
        ],
      });
    }

    // 1. PAYMENT HISTORY (35% weight) - Most Important
    let totalPaymentsDue = 0;
    let onTimePayments = 0;
    let latePayments = 0;
    let totalTransactions = 0;

    for (const loan of loans) {
      const transactions = await db.all(
        `SELECT * FROM Transactions WHERE loan_id = ? ORDER BY date`,
        [loan.loan_id]
      );

      totalTransactions += transactions.length;

      // Calculate expected payments vs actual
      const monthsPassed = Math.ceil(
        (new Date() - new Date(loan.created_at || user.created_at)) /
          (1000 * 60 * 60 * 24 * 30)
      );

      totalPaymentsDue += Math.min(monthsPassed, loan.loan_period_years * 12);

      // Count on-time payments (simplified - assumes all transactions are on-time)
      onTimePayments += transactions.length;
    }

    const paymentHistoryScore = totalPaymentsDue > 0
      ? Math.min(100, (onTimePayments / totalPaymentsDue) * 100)
      : 50;

    // 2. DEBT UTILIZATION (30% weight) - Current debt vs total borrowed
    let totalBorrowed = 0;
    let totalOutstanding = 0;

    for (const loan of loans) {
      const paid = await db.get(
        `SELECT SUM(amount) AS amount_paid FROM Transactions WHERE loan_id = ?`,
        [loan.loan_id]
      );

      const amount_paid = paid.amount_paid || 0;
      totalBorrowed += loan.total_amount;
      totalOutstanding += Math.max(loan.total_amount - amount_paid, 0);
    }

    const utilizationRatio = totalBorrowed > 0 ? (totalOutstanding / totalBorrowed) * 100 : 0;
    
    // Lower utilization is better (inverted score)
    const debtUtilizationScore = utilizationRatio <= 30 
      ? 100 
      : utilizationRatio <= 50 
      ? 80 
      : utilizationRatio <= 70 
      ? 60 
      : 40;

    // 3. CREDIT AGE (15% weight) - Account age in months
    const accountAge = Math.floor(
      (new Date() - new Date(user.created_at)) / (1000 * 60 * 60 * 24 * 30)
    );

    const creditAgeScore = accountAge >= 24 
      ? 100 
      : accountAge >= 12 
      ? 80 
      : accountAge >= 6 
      ? 60 
      : accountAge >= 3 
      ? 40 
      : 20;

    // 4. NEW CREDIT (10% weight) - Recent loan applications
    const recentLoans = loans.filter((loan) => {
      const loanDate = new Date(loan.created_at || user.created_at);
      const threeMonthsAgo = new Date();
      threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
      return loanDate >= threeMonthsAgo;
    }).length;

    // Too many recent loans is bad
    const newCreditScore = recentLoans === 0 
      ? 100 
      : recentLoans === 1 
      ? 80 
      : recentLoans === 2 
      ? 60 
      : 40;

    // 5. CREDIT MIX (10% weight) - Variety of loans
    const creditMixScore = loans.length >= 3 
      ? 100 
      : loans.length === 2 
      ? 80 
      : loans.length === 1 
      ? 60 
      : 40;

    // Calculate weighted credit score (300-850 range)
    const rawScore =
      (paymentHistoryScore * 0.35) +
      (debtUtilizationScore * 0.30) +
      (creditAgeScore * 0.15) +
      (newCreditScore * 0.10) +
      (creditMixScore * 0.10);

    // Convert to 300-850 scale
    const creditScore = Math.round(300 + (rawScore / 100) * 550);

    // Determine rating
    let rating, color;
    if (creditScore >= 750) {
      rating = "Excellent";
      color = "#28a745";
    } else if (creditScore >= 700) {
      rating = "Good";
      color = "#28a745";
    } else if (creditScore >= 650) {
      rating = "Fair";
      color = "#ffc107";
    } else if (creditScore >= 600) {
      rating = "Poor";
      color = "#fd7e14";
    } else {
      rating = "Very Poor";
      color = "#dc3545";
    }

    // Generate recommendations
    const recommendations = [];
    
    if (paymentHistoryScore < 80) {
      recommendations.push("Make all payments on time to improve payment history");
    }
    if (utilizationRatio > 50) {
      recommendations.push("Pay down existing debt to reduce utilization ratio");
    }
    if (accountAge < 12) {
      recommendations.push("Continue building credit history over time");
    }
    if (recentLoans > 2) {
      recommendations.push("Avoid applying for multiple loans in a short period");
    }
    if (loans.length < 2) {
      recommendations.push("Consider diversifying your credit mix");
    }

    if (recommendations.length === 0) {
      recommendations.push("Excellent! Keep maintaining your good credit habits");
    }

    response.send({
      credit_score: creditScore,
      rating,
      color,
      factors: {
        payment_history: {
          score: Math.round(paymentHistoryScore),
          weight: 35,
          description: `${onTimePayments} on-time payments out of ${totalPaymentsDue} due`,
          status: paymentHistoryScore >= 80 ? "Good" : paymentHistoryScore >= 60 ? "Fair" : "Poor",
        },
        debt_utilization: {
          score: Math.round(debtUtilizationScore),
          weight: 30,
          description: `${utilizationRatio.toFixed(1)}% of credit utilized`,
          status: utilizationRatio <= 30 ? "Good" : utilizationRatio <= 50 ? "Fair" : "Poor",
        },
        credit_age: {
          score: Math.round(creditAgeScore),
          weight: 15,
          description: `${accountAge} months of credit history`,
          status: accountAge >= 12 ? "Good" : accountAge >= 6 ? "Fair" : "Building",
        },
        new_credit: {
          score: Math.round(newCreditScore),
          weight: 10,
          description: `${recentLoans} loan(s) in last 3 months`,
          status: recentLoans <= 1 ? "Good" : "Caution",
        },
        credit_mix: {
          score: Math.round(creditMixScore),
          weight: 10,
          description: `${loans.length} total loan(s)`,
          status: loans.length >= 2 ? "Good" : "Limited",
        },
      },
      statistics: {
        total_loans: loans.length,
        active_loans: loans.filter(l => {
          return totalOutstanding > 0;
        }).length,
        closed_loans: loans.length - loans.filter(l => totalOutstanding > 0).length,
        total_borrowed: totalBorrowed,
        total_outstanding: totalOutstanding,
        account_age_months: accountAge,
      },
      recommendations,
    });
  } catch (error) {
    response.status(500).send({ error: error.message });
  }
});
