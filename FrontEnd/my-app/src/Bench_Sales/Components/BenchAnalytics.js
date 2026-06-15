// src/Bench_Sales/Components/BenchAnalytics.js - COMPLETE VERSION
import React, { useState, useEffect } from "react";
import "../Styles/BenchSalesStyles.css";

const BenchAnalytics = () => {
  const [dateRange, setDateRange] = useState({
    start: "2023-01-01",
    end: "2023-12-31",
  });
  const [selectedSkill, setSelectedSkill] = useState("all");
  const [selectedVendor, setSelectedVendor] = useState("all");

  const benchStrengthData = [
    { month: "Jan", value: 20 },
    { month: "Feb", value: 25 },
    { month: "Mar", value: 22 },
    { month: "Apr", value: 18 },
    { month: "May", value: 15 },
    { month: "Jun", value: 12 },
    { month: "Jul", value: 10 },
    { month: "Aug", value: 8 },
    { month: "Sep", value: 15 },
    { month: "Oct", value: 20 },
    { month: "Nov", value: 22 },
    { month: "Dec", value: 25 },
  ];

  const successRatioData = [
    { month: "Jan", submissionToInterview: 25, interviewToHire: 60 },
    { month: "Feb", submissionToInterview: 30, interviewToHire: 65 },
    { month: "Mar", submissionToInterview: 28, interviewToHire: 70 },
    { month: "Apr", submissionToInterview: 35, interviewToHire: 62 },
    { month: "May", submissionToInterview: 40, interviewToHire: 68 },
    { month: "Jun", submissionToInterview: 38, interviewToHire: 72 },
  ];

  const recruiterPerformanceData = [
    { name: "John D.", submissions: 65, hires: 28 },
    { name: "Jane S.", submissions: 59, hires: 48 },
    { name: "Mike J.", submissions: 80, hires: 40 },
    { name: "Sarah L.", submissions: 81, hires: 19 },
    { name: "Tom B.", submissions: 56, hires: 26 },
  ];

  const skillsAnalyticsData = [
    { skill: "React", demand: 85, supply: 60, gap: 25 },
    { skill: "Angular", demand: 70, supply: 45, gap: 25 },
    { skill: "Node.js", demand: 75, supply: 55, gap: 20 },
    { skill: "Java", demand: 80, supply: 70, gap: 10 },
    { skill: "Python", demand: 90, supply: 50, gap: 40 },
    { skill: ".NET", demand: 65, supply: 40, gap: 25 },
  ];

  const handleExport = (format) => {
    alert(`Exporting report as ${format.toUpperCase()}`);
    // Implement actual export functionality here
  };

  const handleApplyFilters = () => {
    console.log("Applying filters:", { dateRange, selectedSkill, selectedVendor });
    // Implement filter logic here
  };

  // Find max values for scaling charts
  const maxBenchStrength = Math.max(...benchStrengthData.map(item => item.value));
  const maxSuccessRatio = Math.max(
    ...successRatioData.map(item => item.submissionToInterview),
    ...successRatioData.map(item => item.interviewToHire)
  );
  const maxRecruiterPerformance = Math.max(
    ...recruiterPerformanceData.map(item => item.submissions),
    ...recruiterPerformanceData.map(item => item.hires)
  );
  const maxSkillData = Math.max(
    ...skillsAnalyticsData.map(item => item.demand),
    ...skillsAnalyticsData.map(item => item.supply)
  );

  return (
    <div className="bench-analytics-container">
      <div className="bench-analytics-page-header">
        <h1>Analytics & Reports</h1>
        <div className="bench-analytics-export-buttons">
          <button className="bench-analytics-btn-primary" onClick={() => handleExport("pdf")}>
            Export PDF
          </button>
          <button className="bench-analytics-btn-primary" onClick={() => handleExport("excel")}>
            Export Excel
          </button>
          <button className="bench-analytics-btn-primary" onClick={() => handleExport("csv")}>
            Export CSV
          </button>
        </div>
      </div>

      <div className="bench-analytics-filters-panel">
        <div className="bench-analytics-filter-group">
          <label>Date Range:</label>
          <input
            type="date"
            value={dateRange.start}
            onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
            className="bench-analytics-filter-input"
          />
          <span>to</span>
          <input
            type="date"
            value={dateRange.end}
            onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
            className="bench-analytics-filter-input"
          />
        </div>
        <div className="bench-analytics-filter-group">
          <label>Skill:</label>
          <select 
            value={selectedSkill} 
            onChange={(e) => setSelectedSkill(e.target.value)}
            className="bench-analytics-filter-select"
          >
            <option value="all">All Skills</option>
            <option value="react">React</option>
            <option value="angular">Angular</option>
            <option value="node">Node.js</option>
            <option value="java">Java</option>
            <option value="python">Python</option>
            <option value="dotnet">.NET</option>
          </select>
        </div>
        <div className="bench-analytics-filter-group">
          <label>Vendor:</label>
          <select 
            value={selectedVendor} 
            onChange={(e) => setSelectedVendor(e.target.value)}
            className="bench-analytics-filter-select"
          >
            <option value="all">All Vendors</option>
            <option value="tech">Tech Solutions Inc</option>
            <option value="global">Global Staffing LLC</option>
            <option value="it">IT Recruiters Co</option>
          </select>
        </div>
        <button className="bench-analytics-btn-primary" onClick={handleApplyFilters}>
          Apply Filters
        </button>
      </div>

      <div className="bench-analytics-reports-grid">
        {/* Bench Strength Over Time Chart */}
        <div className="bench-analytics-report-card">
          <h3>Bench Strength Over Time</h3>
          <div className="bench-analytics-line-visual">
            <div className="bench-analytics-line-chart">
              {benchStrengthData.map((item, index) => (
                <div
                  key={index}
                  className="bench-analytics-data-point"
                  style={{
                    left: `${(index / (benchStrengthData.length - 1)) * 100}%`,
                    bottom: `${(item.value / maxBenchStrength) * 100}%`
                  }}
                  title={`${item.month}: ${item.value}`}
                ></div>
              ))}
              <div className="bench-analytics-line"></div>
            </div>
            <div className="bench-analytics-x-axis">
              {benchStrengthData.map((item, index) => (
                <div key={index} className="bench-analytics-tick">
                  {item.month}
                </div>
              ))}
            </div>
          </div>
        </div>
        
        {/* Success Ratio Chart */}
        <div className="bench-analytics-report-card">
          <h3>Success Ratio Analysis</h3>
          <div className="bench-analytics-bar-visual">
            {successRatioData.map((item, index) => (
              <div key={index} className="bench-analytics-bar-group">
                <div className="bench-analytics-bar-container">
                  <div 
                    className="bench-analytics-ratio-bar bench-analytics-submission-bar" 
                    style={{ height: `${(item.submissionToInterview / maxSuccessRatio) * 100}%` }}
                    title={`Submission to Interview: ${item.submissionToInterview}%`}
                  ></div>
                  <div 
                    className="bench-analytics-ratio-bar bench-analytics-interview-bar" 
                    style={{ height: `${(item.interviewToHire / maxSuccessRatio) * 100}%` }}
                    title={`Interview to Hire: ${item.interviewToHire}%`}
                  ></div>
                </div>
                <div className="bench-analytics-month-label">{item.month}</div>
              </div>
            ))}
          </div>
          <div className="bench-analytics-chart-legend">
            <div className="bench-analytics-legend-item">
              <span className="bench-analytics-color-dot bench-analytics-submission-dot"></span>
              <span>Submission to Interview</span>
            </div>
            <div className="bench-analytics-legend-item">
              <span className="bench-analytics-color-dot bench-analytics-interview-dot"></span>
              <span>Interview to Hire</span>
            </div>
          </div>
        </div>
        
        {/* Recruiter Performance Chart */}
        <div className="bench-analytics-report-card">
          <h3>Recruiter Performance Metrics</h3>
          <div className="bench-analytics-performance-visual">
            {recruiterPerformanceData.map((item, index) => (
              <div key={index} className="bench-analytics-recruiter-bar-group">
                <div className="bench-analytics-recruiter-name">{item.name}</div>
                <div className="bench-analytics-bar-container">
                  <div 
                    className="bench-analytics-performance-bar bench-analytics-submission-bar" 
                    style={{ width: `${(item.submissions / maxRecruiterPerformance) * 100}%` }}
                    title={`Submissions: ${item.submissions}`}
                  >
                    <span>{item.submissions}</span>
                  </div>
                  <div 
                    className="bench-analytics-performance-bar bench-analytics-hire-bar" 
                    style={{ width: `${(item.hires / maxRecruiterPerformance) * 100}%` }}
                    title={`Hires: ${item.hires}`}
                  >
                    <span>{item.hires}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="bench-analytics-chart-legend">
            <div className="bench-analytics-legend-item">
              <span className="bench-analytics-color-dot bench-analytics-submission-dot"></span>
              <span>Submissions</span>
            </div>
            <div className="bench-analytics-legend-item">
              <span className="bench-analytics-color-dot bench-analytics-hire-dot"></span>
              <span>Hires</span>
            </div>
          </div>
        </div>
        
        {/* Skills Demand vs Supply Analysis */}
        <div className="bench-analytics-report-card">
          <h3>Skills Demand vs Supply</h3>
          <div className="bench-analytics-skills-visual">
            {skillsAnalyticsData.map((item, index) => (
              <div key={index} className="bench-analytics-skill-bar-group">
                <div className="bench-analytics-skill-name">{item.skill}</div>
                <div className="bench-analytics-skill-bars">
                  <div className="bench-analytics-skill-bar-wrapper">
                    <div 
                      className="bench-analytics-skill-bar bench-analytics-demand-bar" 
                      style={{ width: `${(item.demand / maxSkillData) * 100}%` }}
                      title={`Demand: ${item.demand}%`}
                    >
                      <span>D: {item.demand}%</span>
                    </div>
                  </div>
                  <div className="bench-analytics-skill-bar-wrapper">
                    <div 
                      className="bench-analytics-skill-bar bench-analytics-supply-bar" 
                      style={{ width: `${(item.supply / maxSkillData) * 100}%` }}
                      title={`Supply: ${item.supply}%`}
                    >
                      <span>S: {item.supply}%</span>
                    </div>
                  </div>
                  <div className="bench-analytics-gap-indicator">
                    Gap: {item.gap}%
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        {/* Revenue Forecast */}
        <div className="bench-analytics-report-card">
          <h3>Revenue Forecast & KPIs</h3>
          <div className="bench-analytics-revenue-forecast">
            <div className="bench-analytics-revenue-item">
              <span className="bench-analytics-revenue-label">This Month:</span>
              <span className="bench-analytics-revenue-value">$125,000</span>
            </div>
            <div className="bench-analytics-revenue-item">
              <span className="bench-analytics-revenue-label">Next Month:</span>
              <span className="bench-analytics-revenue-value">$145,000</span>
            </div>
            <div className="bench-analytics-revenue-item">
              <span className="bench-analytics-revenue-label">Quarterly Target:</span>
              <span className="bench-analytics-revenue-value">$425,000</span>
            </div>
            <div className="bench-analytics-revenue-item">
              <span className="bench-analytics-revenue-label">YTD Revenue:</span>
              <span className="bench-analytics-revenue-value">$850,000</span>
            </div>
          </div>
        </div>

        {/* Key Performance Indicators */}
        <div className="bench-analytics-report-card">
          <h3>Key Performance Indicators</h3>
          <div className="bench-analytics-kpi-grid">
            <div className="bench-analytics-kpi-item">
              <div className="bench-analytics-kpi-value">2.5</div>
              <div className="bench-analytics-kpi-label">Avg. Time to Fill (weeks)</div>
            </div>
            <div className="bench-analytics-kpi-item">
              <div className="bench-analytics-kpi-value">85%</div>
              <div className="bench-analytics-kpi-label">Client Satisfaction</div>
            </div>
            <div className="bench-analytics-kpi-item">
              <div className="bench-analytics-kpi-value">92%</div>
              <div className="bench-analytics-kpi-label">Candidate Retention</div>
            </div>
            <div className="bench-analytics-kpi-item">
              <div className="bench-analytics-kpi-value">15%</div>
              <div className="bench-analytics-kpi-label">Monthly Growth</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BenchAnalytics;