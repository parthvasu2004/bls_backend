import { Component } from "react";
import { Navigate } from "react-router-dom";
import Dashboard from "./Dashboard";
import CreditScore from "./CreditScore";
import {
  generateLoanAgreement,
  generatePaymentReceipt,
  generateLoanStatement,
  generateAmortizationSchedule,
} from "../utils/pdfGenerator";
import "../App.css";

const optionList = [
  { optionId: "dashboard", displayText: "📊 Dashboard & Analytics" },
  { optionId: "credit-score", displayText: "💳 Credit Score" },
  { optionId: "create-loan", displayText: "Create A New Loan" },
  { optionId: "loan-payment", displayText: "Loan Payment" },
  { optionId: "loan-detail", displayText: "View Loan Details and Payment History" },
  { optionId: "view-loans", displayText: "View All My Loans" },
];

const emiOptionsList = [
  { optionId: "LUMP_SUM", displayText: "LUMPSUM" },
  { optionId: "EMI", displayText: "EMI" },
];

class Home extends Component {
  state = {
    activeOptionId: optionList[0].optionId,
    backendResult: "",
    selectedLoan: null,
    allLoans: [],
    emistatus: emiOptionsList[0].optionId,
    loanNumber: "",
    paymentAmount: "",
    userData: null,
    shouldLogout: false,
    copiedId: null,
  };

  componentDidMount() {
    this.fetchUserData();
  }

  fetchUserData = async () => {
    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      const response = await fetch("http://localhost:5000/auth/me", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const userData = await response.json();
        this.setState({ userData });
      }
    } catch (error) {
      console.error("Failed to fetch user data", error);
    }
  };

  handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("isLoggedIn");
    this.setState({ shouldLogout: true });
  };

  copyToClipboard = (text) => {
    navigator.clipboard.writeText(text).then(() => {
      this.setState({ copiedId: text });
      setTimeout(() => {
        this.setState({ copiedId: null });
      }, 2000);
    }).catch(err => {
      console.error('Failed to copy:', err);
    });
  };

  onChangeOptions = (event) => {
    this.setState({
      activeOptionId: event.target.value,
      backendResult: "",
      selectedLoan: null,
      allLoans: [],
      firstOption: false,
      secondOption: false,
      thirdOption: false,
      fourthOption: false,
      emistatus: emiOptionsList[0].optionId,
      loanNumber: "",
      paymentAmount: "",
    });
  };

  
  getAuthHeaders = () => {
    const token = localStorage.getItem("token");
    return {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    };
  };


  handleCreateLoanSubmit = async (event) => {
    event.preventDefault();
    this.setState({
      firstOption: false,
      secondOption: false,
      thirdOption: false,
      fourthOption: false,
    });

    const formData = new FormData(event.target);
    const data = {
      loan_amount: parseFloat(formData.get("loanAmount")),
      loan_period_years: parseFloat(formData.get("loanPeriod")),
    };

    try {
      const response = await fetch("http://localhost:5000/loans/", {
        method: "POST",
        headers: this.getAuthHeaders(),
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        this.setState({
          backendResult: { error: result.error },
          firstOption: true,
        });
      } else {
        this.setState({ backendResult: result, firstOption: true });
      }
    } catch {
      this.setState({
        backendResult: { error: "Network error" },
        firstOption: true,
      });
    }
  };


  handleLoanPaymentSubmit = async (event) => {
    event.preventDefault();
    this.setState({
      firstOption: false,
      secondOption: false,
      thirdOption: false,
      fourthOption: false,
    });

    const formData = new FormData(event.target);
    const loanId = formData.get("loanId");

    const data = {
      amount: parseFloat(formData.get("paymentAmount")),
      transaction_type: formData.get("paymentType"),
    };

    try {
      const response = await fetch(
        `http://localhost:5000/loans/${loanId}/payments`,
        {
          method: "POST",
          headers: this.getAuthHeaders(),
          body: JSON.stringify(data),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        this.setState({
          backendResult: { error: result.error || "Payment failed", ...result },
          secondOption: true,
        });
      } else {
        this.setState({ backendResult: result, secondOption: true });
      }
    } catch (error) {
      this.setState({
        backendResult: { error: error.message || "Network error" },
        secondOption: true,
      });
    }
  };


  handleViewLoanDetailsSubmit = async (event) => {
    event.preventDefault();
    this.setState({
      firstOption: false,
      secondOption: false,
      thirdOption: false,
      fourthOption: false,
    });

    const formData = new FormData(event.target);
    const loanId = formData.get("loanId");

    try {
      const response = await fetch(
        `http://localhost:5000/loans/${loanId}/ledger`,
        {
          headers: this.getAuthHeaders(),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        this.setState({
          backendResult: { error: result.error },
          thirdOption: true,
        });
      } else {
        this.setState({ backendResult: result, thirdOption: true });
      }
    } catch {
      this.setState({
        backendResult: { error: "Network error" },
        thirdOption: true,
      });
    }
  };


  handleViewAllLoansSubmit = async (event) => {
    event.preventDefault();
    this.setState({
      firstOption: false,
      secondOption: false,
      thirdOption: false,
      fourthOption: false,
    });

    try {
      const response = await fetch(
        "http://localhost:5000/customers/overview",
        {
          headers: this.getAuthHeaders(),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        this.setState({
          backendResult: { error: result.error },
          fourthOption: true,
        });
      } else {
        this.setState({ backendResult: result, fourthOption: true });
      }
    } catch {
      this.setState({
        backendResult: { error: "Network error" },
        fourthOption: true,
      });
    }
  };


  fetchEmiAmount = async (loanId) => {
    try {
      const response = await fetch(
        `http://localhost:5000/loans/${loanId}/emi`,
        {
          headers: this.getAuthHeaders(),
        }
      );

      const data = await response.json();

      if (response.ok) {
        this.setState({
          paymentAmount: data.emi_amount,
        });
      }
    } catch (error) {
      console.error("Failed to fetch EMI", error);
      this.setState({
        paymentAmount: "",
      });
    }
  };

  emiChangeOptions = async (event) => {
    const selectedType = event.target.value;
    const { loanNumber } = this.state;

    this.setState({
      emistatus: selectedType,
      paymentAmount: "",
    });

    if (selectedType === "EMI" && loanNumber.trim() !== "") {
      setTimeout(async () => {
        await this.fetchEmiAmount(loanNumber);
      }, 50);
    }
  };

  takingLoanId = async (event) => {
    const loanId = event.target.value;
    const { emistatus } = this.state;

    this.setState({
      loanNumber: loanId,
      paymentAmount: "",
    });

    if (emistatus === "EMI" && loanId.trim() !== "") {
      setTimeout(async () => {
        await this.fetchEmiAmount(loanId);
      }, 50);
    }
  };

  onPaymentAmountChange = (event) => {
    this.setState({
      paymentAmount: event.target.value,
    });
  };


  renderCreateLoanForm = () => (
    <form onSubmit={this.handleCreateLoanSubmit}>
      <div className="label-input-div">
        <label htmlFor="loanAmount">Loan Amount</label>
        <input
          placeholder="100000"
          className="name"
          type="number"
          id="loanAmount"
          name="loanAmount"
          required
        />
      </div>
      <div className="label-input-div">
        <label htmlFor="loanPeriod">Loan Period (years)</label>
        <input
          placeholder="2"
          className="name"
          type="number"
          id="loanPeriod"
          name="loanPeriod"
          required
        />
      </div>
      <button type="submit">Submit</button>
    </form>
  );

  renderLoanPaymentForm = () => {
    const { emistatus, paymentAmount } = this.state;

    return (
      <form onSubmit={this.handleLoanPaymentSubmit}>
        <div className="label-input-div">
          <label htmlFor="loanId">Loan ID</label>
          <input
            onChange={this.takingLoanId}
            placeholder="LNXXXXXXXXXXXXX"
            className="name"
            type="text"
            id="loanId"
            name="loanId"
            required
          />
        </div>

        <div className="label-input-div">
          <label htmlFor="paymentType">Payment Type</label>
          <select
            className="name"
            id="paymentType"
            name="paymentType"
            value={emistatus}
            onChange={this.emiChangeOptions}
          >
            {emiOptionsList.map((option) => (
              <option key={option.optionId} value={option.optionId}>
                {option.displayText}
              </option>
            ))}
          </select>
        </div>

        <div className="label-input-div">
          <label htmlFor="paymentAmount">Payment Amount</label>
          <input
            className="name"
            type="number"
            step="0.01"
            id="paymentAmount"
            name="paymentAmount"
            placeholder={
              emistatus === "LUMP_SUM"
                ? "Enter custom amount"
                : "EMI will be auto-filled"
            }
            value={paymentAmount}
            readOnly={emistatus === "EMI"}
            onChange={this.onPaymentAmountChange}
            required
          />
        </div>

        <button type="submit">Submit</button>
      </form>
    );
  };

  renderViewLoanDetailsForm = () => (
    <form onSubmit={this.handleViewLoanDetailsSubmit}>
      <div className="label-input-div">
        <label htmlFor="loanId">Loan ID</label>
        <input
          placeholder="LNXXXXXXXXXXXXX"
          className="name"
          type="text"
          id="loanId"
          name="loanId"
          required
        />
      </div>
      <button type="submit">View Details</button>
    </form>
  );

  renderAllLoansForCustomerForm = () => (
    <form onSubmit={this.handleViewAllLoansSubmit}>
      <button type="submit">View My Loans</button>
    </form>
  );


  renderCreateLoanFormResult = () => {
    const { backendResult, copiedId, userData } = this.state;

    if (backendResult.error) {
      return (
        <div className="result-card">
          <h3 className="result-title">Error</h3>
          <div className="result-row">
            <span className="label">Error Message</span>
            <span className="value">{backendResult.error}</span>
          </div>
        </div>
      );
    }

    const { loan_id, customer_id, total_amount_payable, monthly_emi } =
      backendResult;

    const handleDownloadAgreement = () => {
      const loanData = {
        loan_id: loan_id,
        principal_amount: Math.round(total_amount_payable / 1.14),
        loan_period_years: 2,
        monthly_emi: monthly_emi,
        total_amount: total_amount_payable,
      };
      generateLoanAgreement(loanData, userData);
    };

    const handleDownloadAmortization = () => {
      const loanData = {
        loan_id: loan_id,
        principal_amount: Math.round(total_amount_payable / 1.14),
        loan_period_years: 2,
        monthly_emi: monthly_emi,
      };
      generateAmortizationSchedule(loanData, userData);
    };

    return (
      <div className="result-card">
        <h3 className="result-title">Result</h3>
        <div className="result-row">
          <span className="label">Loan ID</span>
          <span className="value copy-container">
            {loan_id}
            <button
              className="copy-btn"
              onClick={() => this.copyToClipboard(loan_id, "loan")}
              title="Copy Loan ID"
            >
              {copiedId === loan_id ? "✓" : "📋"}
            </button>
          </span>
        </div>
        <div className="result-row">
          <span className="label">Customer ID</span>
          <span className="value copy-container">
            {customer_id}
            <button
              className="copy-btn"
              onClick={() => this.copyToClipboard(customer_id, "customer")}
              title="Copy Customer ID"
            >
              {copiedId === customer_id ? "✓" : "📋"}
            </button>
          </span>
        </div>
        <div className="result-row">
          <span className="label">Total Amount Payable</span>
          <span className="value bold">{total_amount_payable}</span>
        </div>
        <div className="result-row">
          <span className="label">Monthly EMI</span>
          <span className="value bold">{monthly_emi}</span>
        </div>

        <div className="pdf-download-section">
          <h4>📄 Download Documents</h4>
          <div className="pdf-buttons">
            <button className="pdf-btn" onClick={handleDownloadAgreement}>
              📋 Download Loan Agreement
            </button>
            <button className="pdf-btn" onClick={handleDownloadAmortization}>
              📊 Download Amortization Schedule
            </button>
          </div>
        </div>
      </div>
    );
  };

  renderLoanPaymentFormResult = () => {
    const { backendResult, copiedId, userData } = this.state;

    if (backendResult.error) {
      return (
        <div className="result-card">
          <h3 className="result-title">
            {backendResult.status === "COMPLETED" ? "🎉 Loan Completed!" : "Error"}
          </h3>
          <div className="result-row">
            <span className="label">Message</span>
            <span className="value">{backendResult.message || backendResult.error}</span>
          </div>
          {backendResult.status === "COMPLETED" && (
            <>
              <div className="result-row">
                <span className="label">Loan ID</span>
                <span className="value copy-container">
                  {backendResult.loan_id}
                  <button
                    className="copy-btn"
                    onClick={() => this.copyToClipboard(backendResult.loan_id, "loan")}
                    title="Copy Loan ID"
                  >
                    {copiedId === backendResult.loan_id ? "✓" : "📋"}
                  </button>
                </span>
              </div>
              <div className="result-row">
                <span className="label">Total Amount</span>
                <span className="value bold">₹{backendResult.total_amount}</span>
              </div>
              <div className="result-row">
                <span className="label">Total Paid</span>
                <span className="value bold">₹{backendResult.total_paid}</span>
              </div>
              <div className="completion-message">
                ✨ Thank you for completing your loan! Your account is now clear. ✨
              </div>
            </>
          )}
          {backendResult.remaining_balance !== undefined && (
            <div className="result-row">
              <span className="label">Remaining Balance</span>
              <span className="value bold">₹{backendResult.remaining_balance}</span>
            </div>
          )}
        </div>
      );
    }

    const {
      transaction_id,
      loan_id,
      message,
      remaining_balance,
      emis_left,
      is_completed,
      loan_status,
    } = backendResult;

    const handleDownloadReceipt = () => {
      const paymentData = {
        transaction_id: transaction_id,
        loan_id: loan_id,
        amount: backendResult.amount || 0,
        type: backendResult.transaction_type || "EMI",
        date: new Date(),
        remaining_balance: remaining_balance,
        emis_left: emis_left,
      };
      generatePaymentReceipt(paymentData, {}, userData);
    };

    return (
      <div className={`result-card ${is_completed ? "completed-loan" : ""}`}>
        <h3 className="result-title">
          {is_completed ? "🎉 Loan Fully Paid!" : "Result"}
        </h3>

        {is_completed && (
          <div className="celebration-banner">
            <div className="celebration-icon">🎊</div>
            <div className="celebration-text">
              <h4>Congratulations!</h4>
              <p>You have successfully completed your loan payment!</p>
            </div>
            <div className="celebration-icon">🎊</div>
          </div>
        )}

        <div className="result-row">
          <span className="label">Transaction ID</span>
          <span className="value copy-container">
            {transaction_id || "N/A"}
            {transaction_id && (
              <button
                className="copy-btn"
                onClick={() => this.copyToClipboard(transaction_id, "transaction")}
                title="Copy Transaction ID"
              >
                {copiedId === transaction_id ? "✓" : "📋"}
              </button>
            )}
          </span>
        </div>
        <div className="result-row">
          <span className="label">Loan ID</span>
          <span className="value copy-container">
            {loan_id || "N/A"}
            {loan_id && (
              <button
                className="copy-btn"
                onClick={() => this.copyToClipboard(loan_id, "loan")}
                title="Copy Loan ID"
              >
                {copiedId === loan_id ? "✓" : "📋"}
              </button>
            )}
          </span>
        </div>
        <div className="result-row">
          <span className="label">Remaining Balance</span>
          <span
            className={`value bold ${remaining_balance === 0 ? "zero-balance" : ""}`}
          >
            ₹{remaining_balance !== undefined ? remaining_balance : "N/A"}
          </span>
        </div>
        <div className="result-row">
          <span className="label">EMI'S Left</span>
          <span className={`value bold ${emis_left === 0 ? "zero-emis" : ""}`}>
            {emis_left !== undefined ? emis_left : "N/A"}
          </span>
        </div>
        <div className="result-row">
          <span className="label">Status</span>
          <span className={`value bold status-${loan_status?.toLowerCase()}`}>
            {loan_status || "ACTIVE"}
          </span>
        </div>
        <div className="result-row">
          <span className="label">Message</span>
          <span className="value bold">{message || "N/A"}</span>
        </div>

        {is_completed && (
          <div className="completion-footer">
            <p>✨ Your dedication to completing this loan is commendable! ✨</p>
            <p>Feel free to apply for new loans anytime.</p>
          </div>
        )}

        <div className="pdf-download-section">
          <h4>📄 Download Receipt</h4>
          <div className="pdf-buttons">
            <button className="pdf-btn" onClick={handleDownloadReceipt}>
              🧾 Download Payment Receipt
            </button>
          </div>
        </div>
      </div>
    );
  };

  renderViewLoanDetailsFormResult = () => {
    const { backendResult, copiedId, userData } = this.state;

    if (backendResult.error) {
      return (
        <div className="result-card">
          <h3 className="result-title">Error</h3>
          <div className="result-row">
            <span className="label">Error Message</span>
            <span className="value">{backendResult.error}</span>
          </div>
        </div>
      );
    }

    const {
      loan_id,
      customer_id,
      principal,
      total_amount,
      monthly_emi,
      total_paid,
      balance_amount,
      emis_left,
      transactions,
    } = backendResult;

const handleDownloadStatement = () => {
  console.log("===== BUTTON CLICKED =====");
  console.log("userData:", userData);
  console.log("transactions:", transactions);
  console.log("loan_id:", loan_id);
  console.log("principal:", principal);
  
  try {
    const loanData = {
      loan_id: loan_id,
      principal_amount: principal,
      total_amount: total_amount,
      monthly_emi: monthly_emi,
      total_paid: total_paid,
      balance_amount: balance_amount,
      emis_left: emis_left,
      created_at: new Date(),
      loan_period_years: Math.ceil((total_amount / monthly_emi) / 12),
    };
    
    console.log("loanData created:", loanData);
    console.log("Calling generateLoanStatement...");
    
    generateLoanStatement(loanData, transactions, userData);
    
    console.log("generateLoanStatement called successfully!");
  } catch (error) {
    console.error("ERROR:", error);
    console.error("Error stack:", error.stack);
  }
};

    return (
      <div className="result-card">
        <h3 className="result-title">Result</h3>

        <div className="result-row">
          <span className="label">Loan ID</span>
          <span className="value copy-container">
            {loan_id}
            <button
              className="copy-btn"
              onClick={() => this.copyToClipboard(loan_id, "loan")}
              title="Copy Loan ID"
            >
              {copiedId === loan_id ? "✓" : "📋"}
            </button>
          </span>
        </div>

        <div className="result-row">
          <span className="label">Customer ID</span>
          <span className="value copy-container">
            {customer_id}
            <button
              className="copy-btn"
              onClick={() => this.copyToClipboard(customer_id, "customer")}
              title="Copy Customer ID"
            >
              {copiedId === customer_id ? "✓" : "📋"}
            </button>
          </span>
        </div>

        <div className="result-row">
          <span className="label">Principal</span>
          <span className="value">{principal}</span>
        </div>

        <div className="result-row">
          <span className="label">Total Amount</span>
          <span className="value">{total_amount}</span>
        </div>

        <div className="result-row">
          <span className="label">Monthly EMI</span>
          <span className="value">{monthly_emi}</span>
        </div>

        <div className="result-row">
          <span className="label">Amount Paid</span>
          <span className="value">{total_paid}</span>
        </div>

        <div className="result-row">
          <span className="label">Balance Amount</span>
          <span className="value">{balance_amount}</span>
        </div>

        <div className="result-row">
          <span className="label">EMI'S Left</span>
          <span className="value">{emis_left}</span>
        </div>

        <div className="loan-table-section">
          <h3 className="table-title">Transaction History</h3>
          <table className="loan-table">
            <thead>
              <tr>
                <th>Transaction ID</th>
                <th>Type</th>
                <th>Amount</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((eachTran) => (
                <tr key={eachTran.transaction_id}>
                  <td>
                    <span className="copy-container">
                      {eachTran.transaction_id}
                      <button
                        className="copy-btn-small"
                        onClick={() =>
                          this.copyToClipboard(eachTran.transaction_id, "transaction")
                        }
                        title="Copy Transaction ID"
                      >
                        {copiedId === eachTran.transaction_id ? "✓" : "📋"}
                      </button>
                    </span>
                  </td>
                  <td>{eachTran.type}</td>
                  <td className="status paid">{eachTran.amount}</td>
                  <td>{eachTran.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="pdf-download-section">
          <h4>📄 Download Statement</h4>
          <div className="pdf-buttons">
            <button className="pdf-btn" onClick={handleDownloadStatement}>
              📑 Download Loan Statement
            </button>
          </div>
        </div>
      </div>
    );
  };

  renderAllLoansForCustomerFormResult = () => {
    const { backendResult, copiedId } = this.state;

    if (backendResult.error) {
      return (
        <div className="result-card">
          <h3 className="result-title">Error</h3>
          <div className="result-row">
            <span className="label">Error Message</span>
            <span className="value">{backendResult.error}</span>
          </div>
        </div>
      );
    }

    const { customer_id, total_loans, loans } = backendResult;

    if (total_loans === 0) {
      return (
        <div className="result-card">
          <h3 className="result-title">No Loans Found</h3>
          <p>You haven't taken any loans yet.</p>
        </div>
      );
    }

    return (
      <div className="loan-overview-container">
        <div className="header">
          <h2 className="title">Loan Overview</h2>
        </div>

        <div className="overview-info">
          <span className="info-left">
            Customer ID :
            <strong className="copy-container">
              {customer_id}
              <button
                className="copy-btn"
                onClick={() => this.copyToClipboard(customer_id, "customer")}
                title="Copy Customer ID"
              >
                {copiedId === customer_id ? "✓" : "📋"}
              </button>
            </strong>
          </span>
          <span className="info-right">
            Total Loans <strong>{total_loans}</strong>
          </span>
        </div>

        {loans.map((eachLoan) => (
          <div className="loan-card purple" key={eachLoan.loan_id}>
            <div className="loan-id copy-container">
              {eachLoan.loan_id}
              <button
                className="copy-btn"
                onClick={() => this.copyToClipboard(eachLoan.loan_id, "loan")}
                title="Copy Loan ID"
              >
                {copiedId === eachLoan.loan_id ? "✓" : "📋"}
              </button>
            </div>
            <div className="loan-row">
              <span>Principal</span>
              <span>{eachLoan.principal}</span>
            </div>
            <div className="loan-row">
              <span>Total Amount</span>
              <span className="negative">{eachLoan.total_amount}</span>
            </div>
            <div className="loan-row">
              <span>Total Interest</span>
              <span className="negative">{eachLoan.total_interest}</span>
            </div>
            <div className="loan-row">
              <span>EMI Amount</span>
              <span>{eachLoan.emi_amount}</span>
            </div>
            <div className="loan-row">
              <span>Amount Paid</span>
              <span className="positive">{eachLoan.amount_paid}</span>
            </div>
            <div className="loan-row">
              <span>EMIs Left</span>
              <span className="negative">{eachLoan.emis_left}</span>
            </div>
          </div>
        ))}
      </div>
    );
  };

  render() {
    const {
      activeOptionId,
      firstOption,
      secondOption,
      thirdOption,
      fourthOption,
      userData,
      shouldLogout,
    } = this.state;

    if (shouldLogout) {
      return <Navigate to="/login" />;
    }

    return (
      <div className="container">
        <div className="header-section">
          <h1 className="main">BANK LENDING MANAGEMENT SYSTEM</h1>
          {userData && (
            <div className="user-info">
              <span>Welcome, {userData.name}</span>
              <span className="customer-id copy-container">
                ID: {userData.customer_id}
              </span>
              <button className="logout-btn" onClick={this.handleLogout}>
                Logout
              </button>
            </div>
          )}
        </div>

        <select
          className="name"
          onChange={this.onChangeOptions}
          value={activeOptionId}
        >
          {optionList.map((option) => (
            <option key={option.optionId} value={option.optionId}>
              {option.displayText}
            </option>
          ))}
        </select>

        {activeOptionId === "dashboard" && <Dashboard />}
        {activeOptionId === "credit-score" && <CreditScore />}
        {activeOptionId === "create-loan" && this.renderCreateLoanForm()}
        {activeOptionId === "loan-payment" && this.renderLoanPaymentForm()}
        {activeOptionId === "loan-detail" && this.renderViewLoanDetailsForm()}
        {activeOptionId === "view-loans" &&
          this.renderAllLoansForCustomerForm()}

        {firstOption && this.renderCreateLoanFormResult()}
        {secondOption && this.renderLoanPaymentFormResult()}
        {thirdOption && this.renderViewLoanDetailsFormResult()}
        {fourthOption && this.renderAllLoansForCustomerFormResult()}
      </div>
    );
  }
}

export default Home;