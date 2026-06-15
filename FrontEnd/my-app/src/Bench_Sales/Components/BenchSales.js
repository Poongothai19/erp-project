// src/Bench_Sales/BenchSales.js
import React from "react";
import { Routes, Route, useLocation } from "react-router-dom";
import BenchSalesDashboard from "../Components/BenchSalesDashboard";
import CandidateManagement from "../Components/CandidateManagement";
import RequirementsTracking from "../Components/RequirementsTracking";
import ResumeMarketing from "../Components/ResumeMarketing";
import SubmissionTracking from "../Components/SubmissionTracking";
import BenchAnalytics from "../Components/BenchAnalytics";
import BenchVendors from "../Components/VendorManagement";
import BenchHotList from "../Components/HotList";
import "../Styles/BenchSales.css";

const BenchSales = () => {
  const location = useLocation();
  
  // Extract the active tab from the URL path
  const getActiveTabFromPath = () => {
    const path = location.pathname;
    if (path.includes("bench-candidates")) return "candidates";
    if (path.includes("bench-requirements")) return "requirements";
    if (path.includes("bench-submissions")) return "submissions";
    if (path.includes("bench-marketing")) return "marketing";
    if (path.includes("bench-analytics")) return "analytics";
    if (path.includes("bench-vendors")) return "vendors";
    if (path.includes("bench-hotlist")) return "hotlist";
    if (path.includes("bench-sales-dashboard") || path.includes("bench-sales-recruiter")) return "dashboard";
    return "dashboard"; // default
  };

  const activeTab = getActiveTabFromPath();

  const renderContent = () => {
    switch (activeTab) {
      case "dashboard":
        // Determine if it's manager view based on the path
        const isManagerView = location.pathname.includes("bench-sales-dashboard");
        return <BenchSalesDashboard isManagerView={isManagerView} />;
      case "candidates":
        return <CandidateManagement />;
      case "requirements":
        return <RequirementsTracking />;
      case "marketing":
        return <ResumeMarketing />;
      case "submissions":
        return <SubmissionTracking />;
      case "analytics":
        return <BenchAnalytics />;
      case "vendors":
        return <BenchVendors />;
      case "hotlist":
        return <BenchHotList />;
      default:
        return <BenchSalesDashboard />;
    }
  };

  return (
    <div className="bench-sales-main-container">
      <div className="bench-sales-main-content">
        {renderContent()}
      </div>
    </div>
  );
};

export default BenchSales;