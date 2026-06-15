// src/Bench_Sales/Components/BenchSalesDashboard.js
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../Styles/BenchSalesStyles.css";
import axios from "axios";
import BASE_URL from "../../url";
import Swal from "sweetalert2";
import { 
  Calendar, 
  LayoutDashboard as LuLayoutDashboard,
  Users as LuUsers,
  Edit3, 
  Save,
  Send,
  BarChart3,
  FileText,
  Settings,
  ChevronDown,
  ChevronRight,
  Plus,
  Search,
  Filter,
  Download,
  Eye,
  CheckCircle2,
  AlertCircle,
  X,
  Clock,
  Upload,
  File,
  Image,
  FileSpreadsheet,
  Trash2,
  Play,
  Square,
  TrendingUp,
  Award,
  Zap,
  DollarSign,
  Target,
  PieChart,
  ArrowUpRight,
  ArrowDownRight,
  Users,
  Briefcase,
  MessageSquare,
  Phone as PhoneIcon
} from 'lucide-react';

const BenchSalesDashboard = ({ isManagerView = false }) => {
  const [stats, setStats] = useState({
    benchStrength: 0,
    activeRequirements: 0,
    weeklySubmissions: 0,
    interviewsScheduled: 0,
  });
  const [utilizationData, setUtilizationData] = useState({
    utilized: 75,
    bench: 25
  });
  const [topPerformers, setTopPerformers] = useState([]);
  const [revenueData, setRevenueData] = useState({
    thisMonth: 0,
    nextMonth: 0,
    trend: 0,
    lastMonth: 0
  });
  const [performanceMetrics, setPerformanceMetrics] = useState({
    conversionRate: 0,
    avgTimeToHire: 0,
    submissionAccuracy: 0,
    clientSatisfaction: 0
  });
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchDashboardData();
    
    // Auto-refresh dashboard every 30 seconds for real-time updates
    const interval = setInterval(() => {
      fetchDashboardData();
    }, 30000); // 30 seconds
    
    // Cleanup interval on component unmount
    return () => clearInterval(interval);
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      
      if (!token) {
        Swal.fire("Error", "Authentication token not found", "error");
        setLoading(false);
        return;
      }

      // Fetch dashboard stats
      const statsResponse = await axios.get(`${BASE_URL}/api/dashboard/stats`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (statsResponse.data.success) {
        setStats(statsResponse.data.data);
      }
      
      // Fetch utilization data
      const utilizationResponse = await axios.get(`${BASE_URL}/api/dashboard/utilization`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (utilizationResponse.data.success) {
        setUtilizationData(utilizationResponse.data.data);
      }

      // Fetch top performers data
      try {
        const performersResponse = await axios.get(`${BASE_URL}/api/dashboard/top-performers`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (performersResponse.data.success && performersResponse.data.data) {
          setTopPerformers(performersResponse.data.data);
        } else {
          setTopPerformers(generateMockTopPerformers());
        }
      } catch (error) {
        console.log("Top performers API not available, using mock data");
        setTopPerformers(generateMockTopPerformers());
      }

      // Fetch revenue forecast data
      try {
        const revenueResponse = await axios.get(`${BASE_URL}/api/dashboard/revenue-forecast`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (revenueResponse.data.success && revenueResponse.data.data) {
          setRevenueData(revenueResponse.data.data);
        } else {
          setRevenueData(generateMockRevenueData());
        }
      } catch (error) {
        console.log("Revenue forecast API not available, using mock data");
        setRevenueData(generateMockRevenueData());
      }

      // Fetch performance metrics
      try {
        const metricsResponse = await axios.get(`${BASE_URL}/api/dashboard/performance-metrics`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (metricsResponse.data.success && metricsResponse.data.data) {
          setPerformanceMetrics(metricsResponse.data.data);
        } else {
          setPerformanceMetrics(generateMockPerformanceMetrics());
        }
      } catch (error) {
        console.log("Performance metrics API not available, using mock data");
        setPerformanceMetrics(generateMockPerformanceMetrics());
      }
      
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      if (error.response?.status === 401) {
        localStorage.removeItem("token");
        Swal.fire("Session Expired", "Please login again", "warning").then(() => {
          window.location.href = "/login";
        });
      } else if (error.response?.status === 404) {
        setStats({
          benchStrength: 25,
          activeRequirements: 18,
          weeklySubmissions: 45,
          interviewsScheduled: 12,
        });
        setUtilizationData({
          utilized: 75,
          bench: 25
        });
        setTopPerformers(generateMockTopPerformers());
        setRevenueData(generateMockRevenueData());
        setPerformanceMetrics(generateMockPerformanceMetrics());
        console.log("Using mock data as API endpoints are not available");
      } else {
        Swal.fire("Error", "Failed to load dashboard data", "error");
      }
    } finally {
      setLoading(false);
    }
  };

  const generateMockTopPerformers = () => {
    return [
      { id: 1, name: "John Doe", placements: 12, image: "👨‍💼", trend: 3 },
      { id: 2, name: "Jane Smith", placements: 10, image: "👩‍💼", trend: 2 },
      { id: 3, name: "Mike Johnson", placements: 8, image: "👨‍💼", trend: 1 },
      { id: 4, name: "Sarah Williams", placements: 7, image: "👩‍💼", trend: -1 },
      { id: 5, name: "David Brown", placements: 6, image: "👨‍💼", trend: 0 }
    ];
  };

  const generateMockRevenueData = () => {
    return {
      lastMonth: 95000,
      thisMonth: 125000,
      nextMonth: 145000,
      trend: 31.6 // percentage increase
    };
  };

  const generateMockPerformanceMetrics = () => {
    return {
      conversionRate: 68,
      avgTimeToHire: 18,
      submissionAccuracy: 82,
      clientSatisfaction: 92
    };
  };

  // Submission data for visualization
  const submissionData = [
    { month: "Jan", submissions: 65, hires: 28 },
    { month: "Feb", submissions: 59, hires: 48 },
    { month: "Mar", submissions: 80, hires: 40 },
    { month: "Apr", submissions: 81, hires: 19 },
    { month: "May", submissions: 56, hires: 26 },
    { month: "Jun", submissions: 55, hires: 27 },
  ];

  if (loading) {
    return (
      <div className="bench-dashboard-wrapper">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading dashboard data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bench-dashboard-wrapper">
      <div className="bench-dashboard-header">
        <h1>{isManagerView ? "Bench Sales Manager Dashboard" : "Bench Sales Recruiter Dashboard"}</h1>
        <div className="bench-dashboard-quick-actions">
          <button className="bench-dashboard-btn-primary" onClick={() => navigate("/bench-candidates")}>
            <span>+</span> Add Candidate
          </button>
          <button className="bench-dashboard-btn-primary" onClick={() => navigate("/bench-requirements")}>
            <span>+</span> Add Requirement
          </button>
          <button className="bench-dashboard-btn-primary" onClick={() => navigate("/bench-submissions")}>
            <span></span> Resume Submission
          </button>
        </div>
      </div>

      {/* Key Stats Grid */}
      <div className="bench-dashboard-stats-grid">
        <div className="bench-dashboard-stat-card">
          <div className="stat-card-header">
            <h3>Bench Strength</h3>
            <div className="stat-icon-primary"><Users size={24} /></div>
          </div>
          <div className="bench-dashboard-stat-value">{stats.benchStrength}</div>
          <div className="bench-dashboard-stat-label">Available Employees</div>
        </div>
        <div className="bench-dashboard-stat-card">
          <div className="stat-card-header">
            <h3>Active Requirements</h3>
            <div className="stat-icon-primary"><Briefcase size={24} /></div>
          </div>
          <div className="bench-dashboard-stat-value">{stats.activeRequirements}</div>
          <div className="bench-dashboard-stat-label">Open Positions</div>
        </div>
        <div className="bench-dashboard-stat-card">
          <div className="stat-card-header">
            <h3>Weekly Submissions</h3>
            <div className="stat-icon-primary"><Send size={24} /></div>
          </div>
          <div className="bench-dashboard-stat-value">{stats.weeklySubmissions}</div>
          <div className="bench-dashboard-stat-label">Resumes Sent</div>
        </div>
        <div className="bench-dashboard-stat-card">
          <div className="stat-card-header">
            <h3>Interviews Scheduled</h3>
            <div className="stat-icon-primary"><PhoneIcon size={24} /></div>
          </div>
          <div className="bench-dashboard-stat-value">{stats.interviewsScheduled}</div>
          <div className="bench-dashboard-stat-label">This Week</div>
        </div>
      </div>

      {/* Modern Charts Section */}
      <div className="bench-dashboard-charts-container">
        {/* Utilization Card */}
        <div className="bench-dashboard-chart-card modern-card">
          <div className="chart-card-header">
            <h3>Candidate Utilization</h3>
            <PieChart size={20} className="chart-icon" />
          </div>
          <div className="bench-dashboard-utilization-visual">
            <div className="bench-dashboard-utilization-bar">
              <div 
                className="bench-dashboard-utilized-portion" 
                style={{ width: `${utilizationData.utilized}%` }}
              >
                <span>{utilizationData.utilized}% Utilized</span>
              </div>
              <div 
                className="bench-dashboard-bench-portion" 
                style={{ width: `${utilizationData.bench}%` }}
              >
                <span>{utilizationData.bench}% On Bench</span>
              </div>
            </div>
            <div className="bench-dashboard-utilization-labels">
              <div className="bench-dashboard-label-item">
                <span className="bench-dashboard-color-dot bench-dashboard-utilized-dot"></span>
                <span>Utilized: {utilizationData.utilized}%</span>
              </div>
              <div className="bench-dashboard-label-item">
                <span className="bench-dashboard-color-dot bench-dashboard-bench-dot"></span>
                <span>On Bench: {utilizationData.bench}%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Submissions vs Hires */}
        <div className="bench-dashboard-chart-card modern-card">
          <div className="chart-card-header">
            <h3>Submissions vs Hires</h3>
            <BarChart3 size={20} className="chart-icon" />
          </div>
          <div className="bench-dashboard-submissions-visual">
            {submissionData.map((item, index) => (
              <div key={index} className="bench-dashboard-submission-bar-group">
                <div className="bench-dashboard-bar-container">
                  <div 
                    className="bench-dashboard-submission-bar" 
                    style={{ height: `${item.submissions}%` }}
                    title={`${item.submissions} submissions`}
                  ></div>
                  <div 
                    className="bench-dashboard-hire-bar" 
                    style={{ height: `${item.hires}%` }}
                    title={`${item.hires} hires`}
                  ></div>
                </div>
                <div className="bench-dashboard-month-label">{item.month}</div>
              </div>
            ))}
          </div>
          <div className="bench-dashboard-submission-legend">
            <div className="bench-dashboard-legend-item">
              <span className="bench-dashboard-color-box bench-dashboard-submission-color"></span>
              <span>Submissions</span>
            </div>
            <div className="bench-dashboard-legend-item">
              <span className="bench-dashboard-color-box bench-dashboard-hire-color"></span>
              <span>Hires</span>
            </div>
          </div>
        </div>
      </div>

      {isManagerView && (
        <>
          {/* Performance Metrics */}
          <div className="bench-dashboard-metrics-section">
            <h2 className="section-title">Performance Metrics</h2>
            <div className="bench-dashboard-metrics-grid">
              <div className="metric-card">
                <div className="metric-header">
                  <span className="metric-label">Conversion Rate</span>
                  <Zap size={18} className="metric-icon" />
                </div>
                <div className="metric-value">{performanceMetrics.conversionRate}%</div>
                <div className="metric-description">Submission to Hire</div>
                <div className="metric-bar">
                  <div className="metric-fill" style={{ width: `${performanceMetrics.conversionRate}%` }}></div>
                </div>
              </div>

              <div className="metric-card">
                <div className="metric-header">
                  <span className="metric-label">Avg. Time to Hire</span>
                  <Clock size={18} className="metric-icon" />
                </div>
                <div className="metric-value">{performanceMetrics.avgTimeToHire}</div>
                <div className="metric-description">Days Average</div>
                <div className="metric-trend trending-down">
                  <ArrowDownRight size={16} /> 2 days less than last month
                </div>
              </div>

              <div className="metric-card">
                <div className="metric-header">
                  <span className="metric-label">Submission Accuracy</span>
                  <Target size={18} className="metric-icon" />
                </div>
                <div className="metric-value">{performanceMetrics.submissionAccuracy}%</div>
                <div className="metric-description">Quality Score</div>
                <div className="metric-bar">
                  <div className="metric-fill" style={{ width: `${performanceMetrics.submissionAccuracy}%` }}></div>
                </div>
              </div>

              <div className="metric-card">
                <div className="metric-header">
                  <span className="metric-label">Client Satisfaction</span>
                  <Award size={18} className="metric-icon" />
                </div>
                <div className="metric-value">{performanceMetrics.clientSatisfaction}%</div>
                <div className="metric-description">Satisfaction Score</div>
                <div className="metric-bar">
                  <div className="metric-fill" style={{ width: `${performanceMetrics.clientSatisfaction}%` }}></div>
                </div>
              </div>
            </div>
          </div>

          {/* Top Performers & Revenue Section */}
          <div className="bench-dashboard-manager-section">
            <div className="manager-section-grid">
              {/* Top Performers Card */}
              <div className="performance-card modern-card">
                <div className="card-header-modern">
                  <h2>Top Performers</h2>
                  <Award size={24} className="card-icon-primary" />
                </div>
                <div className="performers-list">
                  {topPerformers.length > 0 ? (
                    topPerformers.map((performer, index) => (
                      <div key={performer.id} className="performer-item">
                        <div className="performer-rank">
                          <span className={`rank-badge rank-${index + 1}`}>{index + 1}</span>
                        </div>
                        <div className="performer-info">
                          <div className="performer-avatar">
                            <Users size={20} />
                          </div>
                          <div className="performer-details">
                            <h4 className="performer-name">{performer.name}</h4>
                            <p className="performer-stat">{performer.placements} placements</p>
                          </div>
                        </div>
                        <div className="performer-trend">
                          {performer.trend > 0 ? (
                            <div className="trend-positive">
                              <ArrowUpRight size={16} />
                              <span>{performer.trend} this week</span>
                            </div>
                          ) : performer.trend < 0 ? (
                            <div className="trend-negative">
                              <ArrowDownRight size={16} />
                              <span>{Math.abs(performer.trend)} this week</span>
                            </div>
                          ) : (
                            <div className="trend-neutral">
                              <span>Stable</span>
                            </div>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="empty-state">
                      <p>No performance data available</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Revenue Forecast Card */}
              <div className="revenue-card modern-card">
                <div className="card-header-modern">
                  <h2>Revenue Forecast</h2>
                  <TrendingUp size={24} className="card-icon-success" />
                </div>
                <div className="revenue-items">
                  <div className="revenue-item last-month">
                    <div className="revenue-period">Last Month</div>
                    <div className="revenue-amount">${(revenueData.lastMonth / 1000).toFixed(0)}K</div>
                    <div className="revenue-label">Completed</div>
                  </div>

                  <div className="revenue-item current-month">
                    <div className="revenue-period">This Month</div>
                    <div className="revenue-amount">${(revenueData.thisMonth / 1000).toFixed(0)}K</div>
                    <div className="revenue-label">Current</div>
                    <div className="revenue-change positive">
                      <ArrowUpRight size={14} />
                      <span>{((revenueData.thisMonth - revenueData.lastMonth) / revenueData.lastMonth * 100).toFixed(1)}%</span>
                    </div>
                  </div>

                  <div className="revenue-item next-month">
                    <div className="revenue-period">Next Month</div>
                    <div className="revenue-amount">${(revenueData.nextMonth / 1000).toFixed(0)}K</div>
                    <div className="revenue-label">Projected</div>
                    <div className="revenue-change positive">
                      <ArrowUpRight size={14} />
                      <span>{((revenueData.nextMonth - revenueData.thisMonth) / revenueData.thisMonth * 100).toFixed(1)}%</span>
                    </div>
                  </div>
                </div>

                <div className="revenue-chart-mini">
                  <div className="chart-bar" style={{ 
                    height: `${Math.max(20, (revenueData.lastMonth / Math.max(revenueData.nextMonth, 1)) * 100)}px` 
                  }}></div>
                  <div className="chart-bar active" style={{ 
                    height: `${Math.max(20, (revenueData.thisMonth / Math.max(revenueData.nextMonth, 1)) * 100)}px` 
                  }}></div>
                  <div className="chart-bar projected" style={{ 
                    height: '100%' 
                  }}></div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      <style jsx>{`
        /* Modern Dashboard Styles */
        .bench-dashboard-wrapper {
          padding: 2rem;
          background: #f8f9fa;
          min-height: 100vh;
        }

        .bench-dashboard-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 3rem;
          padding-bottom: 2rem;
          border-bottom: 2px solid rgba(16, 185, 129, 0.1);
        }

        .bench-dashboard-header h1 {
          font-size: 2.5rem;
          font-weight: 700;
          background: linear-gradient(135deg, #10b981 0%, #059669 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          margin: 0;
        }

        .bench-dashboard-quick-actions {
          display: flex;
          gap: 1rem;
        }

        .bench-dashboard-btn-primary {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.875rem 1.5rem;
          background: linear-gradient(135deg, #10b981 0%, #059669 100%);
          color: white;
          border: none;
          border-radius: 0.75rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
          box-shadow: 0 4px 15px rgba(16, 185, 129, 0.3);
        }

        .bench-dashboard-btn-primary:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(16, 185, 129, 0.4);
        }

        /* Stats Grid */
        .bench-dashboard-stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 1.5rem;
          margin-bottom: 3rem;
        }

        .bench-dashboard-stat-card {
          background: white;
          border-radius: 1rem;
          padding: 2rem;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
          transition: all 0.3s ease;
          border-left: 4px solid #10b981;
          position: relative;
          overflow: hidden;
        }

        .bench-dashboard-stat-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 12px 24px rgba(16, 185, 129, 0.15);
        }

        .stat-card-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 1.5rem;
        }

        .stat-card-header h3 {
          font-size: 0.95rem;
          font-weight: 600;
          color: #6b7280;
          margin: 0;
        }

        .stat-icon-primary {
          font-size: 2rem;
          opacity: 0.8;
        }

        .bench-dashboard-stat-value {
          font-size: 2.5rem;
          font-weight: 700;
          color: #10b981;
          margin-bottom: 0.5rem;
        }

        .bench-dashboard-stat-label {
          font-size: 0.9rem;
          color: #9ca3af;
          font-weight: 500;
        }

        /* Charts Container */
        .bench-dashboard-charts-container {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
          gap: 2rem;
          margin-bottom: 3rem;
        }

        .bench-dashboard-chart-card {
          background: white;
          border-radius: 1rem;
          padding: 2rem;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
        }

        .chart-card-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 2rem;
        }

        .chart-card-header h3 {
          font-size: 1.25rem;
          font-weight: 700;
          color: #1f2937;
          margin: 0;
        }

        .chart-icon {
          color: #10b981;
          opacity: 0.7;
        }

        /* Metrics Section */
        .bench-dashboard-metrics-section {
          margin-bottom: 3rem;
        }

        .section-title {
          font-size: 1.75rem;
          font-weight: 700;
          color: #1f2937;
          margin-bottom: 2rem;
          padding-left: 1rem;
          border-left: 4px solid #10b981;
        }

        .bench-dashboard-metrics-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
          gap: 1.5rem;
        }

        .metric-card {
          background: white;
          border-radius: 1rem;
          padding: 1.5rem;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
          transition: all 0.3s ease;
        }

        .metric-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 16px rgba(16, 185, 129, 0.1);
        }

        .metric-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1rem;
        }

        .metric-label {
          font-size: 0.9rem;
          font-weight: 600;
          color: #6b7280;
        }

        .metric-icon {
          color: #10b981;
          opacity: 0.7;
        }

        .metric-value {
          font-size: 2rem;
          font-weight: 700;
          color: #10b981;
          margin-bottom: 0.25rem;
        }

        .metric-description {
          font-size: 0.85rem;
          color: #9ca3af;
          margin-bottom: 1rem;
        }

        .metric-bar {
          height: 6px;
          background: #e5e7eb;
          border-radius: 3px;
          overflow: hidden;
          margin-bottom: 0.75rem;
        }

        .metric-fill {
          height: 100%;
          background: linear-gradient(90deg, #10b981 0%, #059669 100%);
          transition: width 0.3s ease;
        }

        .metric-trend {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.85rem;
          margin-top: 0.75rem;
        }

        .metric-trend.trending-down {
          color: #10b981;
        }

        /* Manager Section */
        .bench-dashboard-manager-section {
          margin-top: 3rem;
        }

        .manager-section-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
          gap: 2rem;
        }

        .performance-card,
        .revenue-card {
          background: white;
          border-radius: 1rem;
          padding: 2rem;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
        }

        .modern-card {
          transition: all 0.3s ease;
        }

        .modern-card:hover {
          box-shadow: 0 12px 24px rgba(16, 185, 129, 0.1);
        }

        .card-header-modern {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 2rem;
          padding-bottom: 1.5rem;
          border-bottom: 2px solid #f3f4f6;
        }

        .card-header-modern h2 {
          font-size: 1.5rem;
          font-weight: 700;
          color: #1f2937;
          margin: 0;
        }

        .card-icon-primary {
          color: #10b981;
          opacity: 0.8;
        }

        .card-icon-success {
          color: #10b981;
          opacity: 0.8;
        }

        /* Performers List */
        .performers-list {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .performer-item {
          display: flex;
          align-items: center;
          gap: 1rem;
          padding: 1rem;
          background: #f9fafb;
          border-radius: 0.75rem;
          transition: all 0.3s ease;
        }

        .performer-item:hover {
          background: #f3f4f6;
          transform: translateX(4px);
        }

        .performer-rank {
          flex-shrink: 0;
        }

        .rank-badge {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 36px;
          height: 36px;
          border-radius: 50%;
          font-weight: 700;
          color: white;
          font-size: 0.95rem;
        }

        .rank-badge.rank-1 {
          background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%);
          box-shadow: 0 4px 12px rgba(251, 191, 36, 0.3);
        }

        .rank-badge.rank-2 {
          background: linear-gradient(135deg, #c0c0c0 0%, #a0a0a0 100%);
          box-shadow: 0 4px 12px rgba(192, 192, 192, 0.3);
        }

        .rank-badge.rank-3 {
          background: linear-gradient(135deg, #cd7f32 0%, #b8652d 100%);
          box-shadow: 0 4px 12px rgba(205, 127, 50, 0.3);
        }

        .rank-badge.rank-4,
        .rank-badge.rank-5 {
          background: linear-gradient(135deg, #10b981 0%, #059669 100%);
        }

        .performer-info {
          flex: 1;
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .performer-avatar {
          width: 40px;
          height: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, #10b981 0%, #059669 100%);
          border-radius: 0.5rem;
          color: white;
          flex-shrink: 0;
        }
        
        .performer-avatar svg {
          stroke-width: 2.5;
        }

        .performer-details {
          flex: 1;
        }

        .performer-name {
          font-size: 1rem;
          font-weight: 600;
          color: #1f2937;
          margin: 0;
        }

        .performer-stat {
          font-size: 0.85rem;
          color: #6b7280;
          margin: 0.25rem 0 0 0;
        }

        .performer-trend {
          flex-shrink: 0;
          text-align: right;
        }

        .trend-positive {
          display: flex;
          align-items: center;
          gap: 0.25rem;
          color: #10b981;
          font-size: 0.85rem;
          font-weight: 600;
        }

        .trend-negative {
          display: flex;
          align-items: center;
          gap: 0.25rem;
          color: #ef4444;
          font-size: 0.85rem;
          font-weight: 600;
        }

        .trend-neutral {
          color: #9ca3af;
          font-size: 0.85rem;
          font-weight: 600;
        }

        .empty-state {
          padding: 2rem 1rem;
          text-align: center;
          color: #9ca3af;
        }

        /* Revenue Section */
        .revenue-items {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 1rem;
          margin-bottom: 2rem;
        }

        .revenue-item {
          padding: 1.5rem;
          border-radius: 0.75rem;
          background: #f9fafb;
          border: 2px solid #f3f4f6;
          transition: all 0.3s ease;
        }

        .revenue-item:hover {
          border-color: #10b981;
          background: #f0fdf4;
        }

        .revenue-item.last-month {
          opacity: 0.7;
        }

        .revenue-item.current-month {
          border-color: #10b981;
          background: linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 100%);
          box-shadow: 0 4px 12px rgba(16, 185, 129, 0.1);
        }

        .revenue-item.next-month {
          border-color: #dbeafe;
          background: linear-gradient(135deg, #f0f9ff 0%, #eff6ff 100%);
        }

        .revenue-period {
          font-size: 0.85rem;
          font-weight: 600;
          color: #6b7280;
          margin-bottom: 0.5rem;
        }

        .revenue-amount {
          font-size: 1.75rem;
          font-weight: 700;
          color: #10b981;
          margin-bottom: 0.25rem;
        }

        .revenue-label {
          font-size: 0.8rem;
          color: #9ca3af;
          margin-bottom: 0.75rem;
        }

        .revenue-change {
          display: inline-flex;
          align-items: center;
          gap: 0.25rem;
          font-size: 0.85rem;
          font-weight: 600;
          padding: 0.5rem 0.75rem;
          background: rgba(16, 185, 129, 0.1);
          color: #10b981;
          border-radius: 0.5rem;
        }

        .revenue-change.positive {
          color: #10b981;
          background: rgba(16, 185, 129, 0.1);
        }

        /* Revenue Chart Mini */
        .revenue-chart-mini {
          display: flex;
          align-items: flex-end;
          justify-content: center;
          gap: 1.5rem;
          height: 120px;
          padding: 1.5rem 0;
          border-top: 2px solid #f3f4f6;
          margin-top: 1.5rem;
        }

        .chart-bar {
          flex: 1;
          background: linear-gradient(180deg, #d1fae5 0%, #a7f3d0 100%);
          border-radius: 0.5rem 0.5rem 0 0;
          min-height: 15px;
          max-height: 100%;
          transition: all 0.3s ease;
          position: relative;
        }

        .chart-bar:hover {
          box-shadow: 0 4px 12px rgba(16, 185, 129, 0.2);
        }

        .chart-bar.active {
          background: linear-gradient(180deg, #10b981 0%, #059669 100%);
          box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
        }

        .chart-bar.projected {
          background: linear-gradient(180deg, #bfdbfe 0%, #93c5fd 100%);
          opacity: 0.6;
        }

        /* Utilization Visual */
        .bench-dashboard-utilization-visual {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .bench-dashboard-utilization-bar {
          display: flex;
          height: 60px;
          border-radius: 0.75rem;
          overflow: hidden;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }

        .bench-dashboard-utilized-portion {
          background: linear-gradient(90deg, #10b981 0%, #059669 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-weight: 700;
          font-size: 0.95rem;
          transition: all 0.3s ease;
        }

        .bench-dashboard-bench-portion {
          background: #e5e7eb;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #6b7280;
          font-weight: 700;
          font-size: 0.95rem;
        }

        .bench-dashboard-utilization-labels {
          display: flex;
          gap: 2rem;
        }

        .bench-dashboard-label-item {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          font-size: 0.95rem;
          font-weight: 500;
          color: #374151;
        }

        .bench-dashboard-color-dot {
          width: 12px;
          height: 12px;
          border-radius: 50%;
        }

        .bench-dashboard-utilized-dot {
          background: linear-gradient(135deg, #10b981 0%, #059669 100%);
        }

        .bench-dashboard-bench-dot {
          background: #d1d5db;
        }

        /* Submissions Chart */
        .bench-dashboard-submissions-visual {
          display: flex;
          align-items: flex-end;
          justify-content: space-around;
          height: 280px;
          gap: 0.75rem;
          margin-bottom: 1.5rem;
          padding: 1rem 0;
        }

        .bench-dashboard-submission-bar-group {
          display: flex;
          flex-direction: column;
          align-items: center;
          flex: 1;
          gap: 0.5rem;
        }

        .bench-dashboard-bar-container {
          display: flex;
          gap: 0.35rem;
          align-items: flex-end;
          height: 220px;
          width: 100%;
          justify-content: center;
        }

        .bench-dashboard-submission-bar {
          width: 35%;
          background: linear-gradient(180deg, #a7f3d0 0%, #10b981 100%);
          border-radius: 0.25rem 0.25rem 0 0;
          transition: all 0.3s ease;
          min-width: 8px;
        }

        .bench-dashboard-submission-bar:hover {
          opacity: 0.8;
          box-shadow: 0 2px 8px rgba(16, 185, 129, 0.3);
        }

        .bench-dashboard-hire-bar {
          width: 35%;
          background: linear-gradient(180deg, #dbeafe 0%, #0ea5e9 100%);
          border-radius: 0.25rem 0.25rem 0 0;
          transition: all 0.3s ease;
          min-width: 8px;
        }

        .bench-dashboard-hire-bar:hover {
          opacity: 0.8;
          box-shadow: 0 2px 8px rgba(6, 182, 212, 0.3);
        }

        .bench-dashboard-month-label {
          font-size: 0.8rem;
          font-weight: 600;
          color: #6b7280;
          margin-top: 0.5rem;
        }

        .bench-dashboard-submission-legend {
          display: flex;
          gap: 2rem;
          justify-content: center;
          padding: 1rem;
          background: #f9fafb;
          border-radius: 0.75rem;
        }

        .bench-dashboard-legend-item {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.9rem;
          font-weight: 500;
          color: #374151;
        }

        .bench-dashboard-color-box {
          width: 14px;
          height: 14px;
          border-radius: 0.25rem;
        }

        .bench-dashboard-submission-color {
          background: linear-gradient(135deg, #a7f3d0 0%, #10b981 100%);
        }

        .bench-dashboard-hire-color {
          background: linear-gradient(135deg, #dbeafe 0%, #0ea5e9 100%);
        }

        /* Loading Spinner */
        .loading-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 400px;
          gap: 1rem;
        }

        .loading-spinner {
          width: 50px;
          height: 50px;
          border: 4px solid #e5e7eb;
          border-top: 4px solid #10b981;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        /* Responsive Design */
        @media (max-width: 768px) {
          .bench-dashboard-header {
            flex-direction: column;
            gap: 1.5rem;
            align-items: flex-start;
          }

          .bench-dashboard-header h1 {
            font-size: 2rem;
          }

          .bench-dashboard-quick-actions {
            width: 100%;
            flex-wrap: wrap;
          }

          .bench-dashboard-stats-grid {
            grid-template-columns: repeat(2, 1fr);
            gap: 1rem;
          }

          .bench-dashboard-charts-container {
            grid-template-columns: 1fr;
          }

          .bench-dashboard-metrics-grid {
            grid-template-columns: repeat(2, 1fr);
          }

          .manager-section-grid {
            grid-template-columns: 1fr;
          }

          .revenue-items {
            grid-template-columns: 1fr;
          }

          .bench-dashboard-stat-card {
            padding: 1.5rem;
          }

          .bench-dashboard-chart-card {
            padding: 1.5rem;
          }
        }

        @media (max-width: 480px) {
          .bench-dashboard-wrapper {
            padding: 1rem;
          }

          .bench-dashboard-header h1 {
            font-size: 1.5rem;
          }

          .bench-dashboard-quick-actions {
            flex-direction: column;
          }

          .bench-dashboard-btn-primary {
            width: 100%;
            justify-content: center;
          }

          .bench-dashboard-stats-grid {
            grid-template-columns: 1fr;
          }

          .bench-dashboard-metrics-grid {
            grid-template-columns: 1fr;
          }

          .stat-card-header {
            flex-direction: column;
            gap: 0.5rem;
          }

          .bench-dashboard-stat-value {
            font-size: 2rem;
          }
        }
      `}</style>
    </div>
  );
};

export default BenchSalesDashboard;