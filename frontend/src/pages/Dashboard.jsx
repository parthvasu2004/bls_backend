import { Component } from "react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import "../Dashboard.css";

class Dashboard extends Component {
  state = {
    dashboardData: null,
    isLoading: true,
    error: null,
  };

  componentDidMount() {
    this.fetchDashboardData();
  }

  fetchDashboardData = async () => {
    const token = localStorage.getItem("token");

    try {
      const response = await fetch("http://localhost:5000/dashboard/analytics", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        this.setState({
          dashboardData: data,
          isLoading: false,
        });
      } else {
        this.setState({
          error: "Failed to load dashboard data",
          isLoading: false,
        });
      }
    } catch {
      this.setState({
        error: "Network error",
        isLoading: false,
      });
    }
  };

  formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  render() {
    const { dashboardData, isLoading, error } = this.state;

    if (isLoading) {
      return (
        <div className="dashboard-container">
          <div className="loading">Loading dashboard...</div>
        </div>
      );
    }

    if (error) {
      return (
        <div className="dashboard-container">
          <div className="error">{error}</div>
        </div>
      );
    }

    if (!dashboardData || dashboardData.summary.totalLoans === 0) {
      return (
        <div className="dashboard-container">
          <div className="no-data">
            <h2>No Data Available</h2>
            <p>Create your first loan to see analytics!</p>
          </div>
        </div>
      );
    }

    const { summary, loanDistribution, paymentTrends, statusDistribution, recentTransactions } = dashboardData;

    const COLORS = ["#667eea", "#764ba2", "#f093fb", "#4facfe"];
    const STATUS_COLORS = { Active: "#667eea", Closed: "#28a745" };

    return (
      <div className="dashboard-container">
        <h1 className="dashboard-title">📊 Financial Dashboard</h1>

        {/* Summary Cards */}
        <div className="metrics-grid">
          <div className="metric-card primary">
            <div className="metric-icon">💰</div>
            <div className="metric-content">
              <h3>Total Borrowed</h3>
              <p className="metric-value">{this.formatCurrency(summary.totalBorrowed)}</p>
              <span className="metric-label">{summary.totalLoans} Loans</span>
            </div>
          </div>

          <div className="metric-card success">
            <div className="metric-icon">✅</div>
            <div className="metric-content">
              <h3>Total Paid</h3>
              <p className="metric-value">{this.formatCurrency(summary.totalPaid)}</p>
              <span className="metric-label">{summary.paymentSuccessRate}% of Total</span>
            </div>
          </div>

          <div className="metric-card warning">
            <div className="metric-icon">⏳</div>
            <div className="metric-content">
              <h3>Outstanding</h3>
              <p className="metric-value">{this.formatCurrency(summary.totalOutstanding)}</p>
              <span className="metric-label">Remaining Balance</span>
            </div>
          </div>

          <div className="metric-card info">
            <div className="metric-icon">📈</div>
            <div className="metric-content">
              <h3>Interest Paid</h3>
              <p className="metric-value">{this.formatCurrency(summary.totalInterestPaid)}</p>
              <span className="metric-label">Total Interest</span>
            </div>
          </div>
        </div>

        {/* Secondary Metrics */}
        <div className="secondary-metrics">
          <div className="secondary-metric">
            <span className="label">Active Loans</span>
            <span className="value active">{summary.activeLoans}</span>
          </div>
          <div className="secondary-metric">
            <span className="label">Closed Loans</span>
            <span className="value closed">{summary.closedLoans}</span>
          </div>
          <div className="secondary-metric">
            <span className="label">Avg Loan Amount</span>
            <span className="value">{this.formatCurrency(summary.avgLoanAmount)}</span>
          </div>
        </div>

        {/* Charts Section */}
        <div className="charts-grid">
          {/* Loan Status Pie Chart */}
          <div className="chart-card">
            <h3 className="chart-title">Loan Status Distribution</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={statusDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ status, count }) => `${status}: ${count}`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="count"
                >
                  {statusDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={STATUS_COLORS[entry.status]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Loan Distribution Bar Chart */}
          <div className="chart-card">
            <h3 className="chart-title">Loan Amount Distribution</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={loanDistribution}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="loan_id" />
                <YAxis />
                <Tooltip formatter={(value) => this.formatCurrency(value)} />
                <Legend />
                <Bar dataKey="amount" fill="#667eea" name="Principal" />
                <Bar dataKey="paid" fill="#28a745" name="Paid" />
                <Bar dataKey="remaining" fill="#ffc107" name="Remaining" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Payment Trends Line Chart */}
        {paymentTrends.length > 0 && (
          <div className="chart-card full-width">
            <h3 className="chart-title">Payment Trends (Monthly)</h3>
            <ResponsiveContainer width="100%" height={350}>
              <LineChart data={paymentTrends}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip formatter={(value) => this.formatCurrency(value)} />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="total_amount"
                  stroke="#667eea"
                  strokeWidth={3}
                  name="Payment Amount"
                  dot={{ r: 6 }}
                  activeDot={{ r: 8 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Recent Transactions Table */}
        <div className="transactions-card">
          <h3 className="chart-title">Recent Transactions</h3>
          <div className="transactions-table-container">
            <table className="transactions-table">
              <thead>
                <tr>
                  <th>Transaction ID</th>
                  <th>Loan ID</th>
                  <th>Type</th>
                  <th>Amount</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {recentTransactions.map((txn) => (
                  <tr key={txn.transaction_id}>
                    <td>{txn.transaction_id.substring(0, 12)}...</td>
                    <td>{txn.loan_id.substring(0, 10)}...</td>
                    <td>
                      <span className={`badge ${txn.type.toLowerCase()}`}>
                        {txn.type}
                      </span>
                    </td>
                    <td className="amount">{this.formatCurrency(txn.amount)}</td>
                    <td>{new Date(txn.date).toLocaleDateString("en-IN")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }
}

export default Dashboard;