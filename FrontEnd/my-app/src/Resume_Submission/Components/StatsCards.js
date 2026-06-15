import React from 'react';
import { mockCandidates } from '../utils/mockData';
const StatsCards = ({ stats = {} }) => {
  const {
    total = 0,
    newThisWeek = 0,
    interviewsScheduled = 0,
    readyForOffer = 0
  } = stats;

  return (
    <div className="stats-section">
      {/* <div className="stat-card">
        <div className="stat-value">{total}</div>
        <div className="stat-label">Total Candidates</div>
        <div className="stat-trend up">
          <i className="fas fa-arrow-up"></i> 12% from last month
        </div>
      </div>
      
      <div className="stat-card">
        <div className="stat-value">{newThisWeek}</div>
        <div className="stat-label">New This Week</div>
        <div className="stat-trend up">
          <i className="fas fa-arrow-up"></i> 5% from last week
        </div>
      </div>
      
      <div className="stat-card">
        <div className="stat-value">{interviewsScheduled}</div>
        <div className="stat-label">Interviews Scheduled</div>
        <div className="stat-trend down">
          <i className="fas fa-arrow-down"></i> 2 from yesterday
        </div>
      </div>
      
      <div className="stat-card highlight">
        <div className="stat-value">{readyForOffer}</div>
        <div className="stat-label">Ready for Offer</div>
        <div className="stat-trend up">
          <i className="fas fa-arrow-up"></i> 3 new
        </div>
      </div> */}
    </div>
  );
};

export default StatsCards;