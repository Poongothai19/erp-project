import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import BASE_URL from "../../url";

const useNotificationService = (companyId) => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchNotifications = useCallback(async () => {
    if (!companyId) return;

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      
      // Fetch all employees for the company
      const employeesResponse = await axios.get(
        `${BASE_URL}/api/employees/company/${companyId}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (!employeesResponse.data.success || !employeesResponse.data.data) {
        setNotifications(getMockNotifications());
        return;
      }

      const employees = employeesResponse.data.data;
      const allNotifications = [];
      const externalTimesheetsByEmployee = [];

      // Fetch external timesheets for each employee
      for (const employee of employees) {
        try {
          // Use EmployeeId (the string ID) for external timesheets API
          const externalTimesheetsResponse = await axios.get(
            `${BASE_URL}/api/employees/company/${companyId}/${employee.EmployeeId}/external-timesheets`,
            {
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
              }
            }
          );

          if (externalTimesheetsResponse.data.success && externalTimesheetsResponse.data.data) {
            const pendingTimesheets = externalTimesheetsResponse.data.data.filter(
              ts => ts.Status === 'Pending' || !ts.Status
            );

            if (pendingTimesheets.length > 0) {
              externalTimesheetsByEmployee.push({
                employeeName: employee.Name || employee.name,
                employeeId: employee.EmployeeId,
                employeeDbId: employee.Id || employee.id,
                employeeData: employee,
                count: pendingTimesheets.length,
                timesheets: pendingTimesheets
              });
            }
          }
        } catch (error) {
          // Continue with next employee if this one fails
          console.warn(`Could not fetch external timesheets for employee ${employee.EmployeeId}:`, error);
        }
      }

      // ✅ REMOVED: Aggregate notification block
      // Create individual notifications for each employee with pending external timesheets
      externalTimesheetsByEmployee.forEach((employeeData) => {
        allNotifications.push({
          id: `ext_ts_${employeeData.employeeId}`,
          type: 'external_timesheet',
          message: `External Timesheet Pending: ${employeeData.employeeName}`,
          details: `${employeeData.count} timesheet(s) awaiting approval`,
          count: employeeData.count,
          priority: 'medium',
          timestamp: employeeData.timesheets[0]?.UploadDate || new Date().toISOString(),
          employeeData: employeeData.employeeData, // Pass full employee data
          action: {
            label: 'Review',
            handler: null // Will be handled by NotificationSystem component
          }
        });
      });

      setNotifications(allNotifications);

    } catch (error) {
      console.error('Error fetching notifications:', error);
      // Fallback to mock data if API fails
      setNotifications(getMockNotifications());
    } finally {
      setLoading(false);
    }
  }, [companyId]);

  // Mock data for demonstration
  const getMockNotifications = () => [
    {
      id: 'ext_ts_1',
      type: 'external_timesheet',
      message: 'Timesheet Pending: John Doe',
      details: 'Period: 2024-01-01 - 2024-01-15',
      count: 1,
      priority: 'medium',
      timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
      action: {
        label: 'Review',
        handler: null
      }
    },
    {
      id: 'ext_ts_2',
      type: 'external_timesheet',
      message: 'Timesheet Pending: Jane Smith',
      details: 'Period: 2024-01-01 - 2024-01-15',
      count: 1,
      priority: 'medium',
      timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
      action: {
        label: 'Review',
        handler: null
      }
    }
  ];

  useEffect(() => {
    fetchNotifications();
    
    // Refresh notifications every 5 minutes
    const interval = setInterval(fetchNotifications, 5 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  return { notifications, loading, refetch: fetchNotifications };
};

export default useNotificationService;
