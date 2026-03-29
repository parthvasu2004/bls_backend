import { Component } from "react";
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Cell,
} from "recharts";
import "../CreditScore.css";

class CreditScore extends Component {
  state = {
    creditData: null,
    isLoading: true,
    error: null,
  };

  componentDidMount() {
    this.fetchCreditScore();
  }

  fetchCreditScore = async () => {
    const token = localStorage.getItem("token");

    try {
      const response = await fetch("http://localhost:5000/credit-score", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        this.setState({
          creditData: data,
          isLoading: false,
        });
      } else {
        this.setState({
          error: "Failed to load credit score",
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

  render() {
    const { creditData, isLoading, error } = this.state;

    if (isLoading) {
      return (
        <div className="credit-score-container">
          <div className="loading">Calculating credit score...</div>
        </div>
      );
    }

    if (error) {
      return (
        <div className="credit-score-container">
          <div className="error">{error}</div>
        </div>
      );
    }

    if (!creditData) {
      return null;
    }

    const { credit_score, rating, color, factors, statistics, recommendations } = creditData;

    // Prepare data for radar chart
    const radarData = [
      {
        factor: "Payment History",
        score: factors.payment_history.score,
        fullMark: 100,
      },
      {
        factor: "Debt Utilization",
        score: factors.debt_utilization.score,
        fullMark: 100,
      },
      {
        factor: "Credit Age",
        score: factors.credit_age.score,
        fullMark: 100,
      },
      {
        factor: "New Credit",
        score: factors.new_credit.score,
        fullMark: 100,
      },
      {
        factor: "Credit Mix",
        score: factors.credit_mix.score,
        fullMark: 100,
      },
    ];

    // Prepare data for bar chart
    const barData = Object.entries(factors).map(([key, value]) => ({
      name: key.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase()),
      score: value.score,
      weight: value.weight,
    }));

    // Calculate gauge angle for score meter
    const scorePercentage = ((credit_score - 300) / 550) * 100;
    const gaugeRotation = (scorePercentage / 100) * 180 - 90;

    return (
      <div className="credit-score-container">
        <h1 className="credit-score-title">💳 Credit Score Analysis</h1>

        {/* Credit Score Gauge */}
        <div className="score-gauge-card">
          <div className="score-gauge">
            <svg viewBox="0 0 200 120" className="gauge-svg">
              {/* Background arc */}
              <path
                d="M 20 100 A 80 80 0 0 1 180 100"
                fill="none"
                stroke="#e0e0e0"
                strokeWidth="20"
                strokeLinecap="round"
              />
              
              {/* Colored sections */}
              <path
                d="M 20 100 A 80 80 0 0 1 63 27"
                fill="none"
                stroke="#dc3545"
                strokeWidth="20"
                strokeLinecap="round"
              />
              <path
                d="M 63 27 A 80 80 0 0 1 100 20"
                fill="none"
                stroke="#fd7e14"
                strokeWidth="20"
                strokeLinecap="round"
              />
              <path
                d="M 100 20 A 80 80 0 0 1 137 27"
                fill="none"
                stroke="#ffc107"
                strokeWidth="20"
                strokeLinecap="round"
              />
              <path
                d="M 137 27 A 80 80 0 0 1 180 100"
                fill="none"
                stroke="#28a745"
                strokeWidth="20"
                strokeLinecap="round"
              />
              
              {/* Needle */}
              <g transform={`rotate(${gaugeRotation} 100 100)`}>
                <line
                  x1="100"
                  y1="100"
                  x2="100"
                  y2="35"
                  stroke="#333"
                  strokeWidth="3"
                  strokeLinecap="round"
                />
                <circle cx="100" cy="100" r="8" fill="#333" />
              </g>
            </svg>
            
            <div className="score-display">
              <div className="score-number" style={{ color: color }}>
                {credit_score}
              </div>
              <div className="score-rating" style={{ color: color }}>
                {rating}
              </div>
              <div className="score-range">300 - 850</div>
            </div>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon">📊</div>
            <div className="stat-content">
              <h4>Total Loans</h4>
              <p>{statistics.total_loans}</p>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">✅</div>
            <div className="stat-content">
              <h4>Active Loans</h4>
              <p>{statistics.active_loans}</p>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">🔒</div>
            <div className="stat-content">
              <h4>Closed Loans</h4>
              <p>{statistics.closed_loans}</p>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">📅</div>
            <div className="stat-content">
              <h4>Account Age</h4>
              <p>{statistics.account_age_months} months</p>
            </div>
          </div>
        </div>

        {/* Factors Breakdown */}
        <div className="factors-section">
          <h2 className="section-title">Credit Score Factors</h2>
          
          <div className="factors-grid">
            {Object.entries(factors).map(([key, value]) => (
              <div key={key} className="factor-card">
                <div className="factor-header">
                  <h3>{key.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}</h3>
                  <span className="factor-weight">{value.weight}% Weight</span>
                </div>
                
                <div className="factor-score-bar">
                  <div
                    className="factor-score-fill"
                    style={{
                      width: `${value.score}%`,
                      background: value.score >= 80 ? "#28a745" : value.score >= 60 ? "#ffc107" : "#dc3545",
                    }}
                  >
                    <span className="factor-score-text">{value.score}/100</span>
                  </div>
                </div>
                
                <p className="factor-description">{value.description}</p>
                <span className={`factor-status status-${value.status?.toLowerCase().replace(/ /g, "-")}`}>
                  {value.status}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Charts Section */}
        <div className="charts-section">
          {/* Radar Chart */}
          <div className="chart-card">
            <h3 className="chart-title">Score Factors Overview</h3>
            <ResponsiveContainer width="100%" height={400}>
              <RadarChart data={radarData}>
                <PolarGrid stroke="#e0e0e0" />
                <PolarAngleAxis dataKey="factor" />
                <PolarRadiusAxis angle={90} domain={[0, 100]} />
                <Radar
                  name="Your Score"
                  dataKey="score"
                  stroke="#667eea"
                  fill="#667eea"
                  fillOpacity={0.6}
                />
                <Tooltip />
                <Legend />
              </RadarChart>
            </ResponsiveContainer>
          </div>

          {/* Bar Chart */}
          <div className="chart-card">
            <h3 className="chart-title">Weighted Score Contribution</h3>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={barData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" angle={-15} textAnchor="end" height={100} />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="score" fill="#667eea" name="Score" />
                <Bar dataKey="weight" fill="#764ba2" name="Weight %" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recommendations */}
        <div className="recommendations-card">
          <h2 className="section-title">💡 Improvement Recommendations</h2>
          <ul className="recommendations-list">
            {recommendations.map((recommendation, index) => (
              <li key={index} className="recommendation-item">
                <span className="recommendation-icon">✓</span>
                {recommendation}
              </li>
            ))}
          </ul>
        </div>

        {/* Score Scale Reference */}
        <div className="score-scale-card">
          <h3>Credit Score Scale</h3>
          <div className="score-scale">
            <div className="scale-item">
              <div className="scale-bar excellent"></div>
              <div className="scale-info">
                <strong>750-850</strong>
                <span>Excellent</span>
              </div>
            </div>
            <div className="scale-item">
              <div className="scale-bar good"></div>
              <div className="scale-info">
                <strong>700-749</strong>
                <span>Good</span>
              </div>
            </div>
            <div className="scale-item">
              <div className="scale-bar fair"></div>
              <div className="scale-info">
                <strong>650-699</strong>
                <span>Fair</span>
              </div>
            </div>
            <div className="scale-item">
              <div className="scale-bar poor"></div>
              <div className="scale-info">
                <strong>600-649</strong>
                <span>Poor</span>
              </div>
            </div>
            <div className="scale-item">
              <div className="scale-bar very-poor"></div>
              <div className="scale-info">
                <strong>300-599</strong>
                <span>Very Poor</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default CreditScore;