const sqlite3 = require("sqlite3").verbose();
const path = require("path");

const dbPath = path.join(__dirname, "banklending.db");
const db = new sqlite3.Database(dbPath);

db.serialize(() => {
  // DROP OLD TABLE
  db.run(`DROP TABLE IF EXISTS Customers`);

  // CREATE NEW CUSTOMERS TABLE
  db.run(`
    CREATE TABLE Customers (
      customer_id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      created_at TEXT NOT NULL
    )
  `);

  // Loans table (keep as is)
  db.run(`
    CREATE TABLE IF NOT EXISTS Loans (
      loan_id TEXT PRIMARY KEY,
      customer_id TEXT,
      principal_amount REAL,
      total_amount REAL,
      interest_rate REAL,
      loan_period_years INTEGER,
      monthly_emi REAL,
      status TEXT,
      FOREIGN KEY (customer_id) REFERENCES Customers(customer_id)
    )
  `);

  // Transactions table (keep as is)
  db.run(`
    CREATE TABLE IF NOT EXISTS Transactions (
      transaction_id TEXT PRIMARY KEY,
      loan_id TEXT,
      amount REAL,
      type TEXT,
      date TEXT,
      FOREIGN KEY (loan_id) REFERENCES Loans(loan_id)
    )
  `);

  console.log("✅ Database initialized successfully");
});

db.close();
