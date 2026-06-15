const { sql, poolPromise } = require("../../config/db");

// Track user login
exports.trackLogin = async (userId) => {
  try {
    const pool = await poolPromise;
    const result = await pool
      .request()
      .input("userId", sql.Int, userId)
      .query(`
        INSERT INTO login_logout_tracking (user_id, login_time)
        OUTPUT INSERTED.id
        VALUES (@userId, GETDATE())
      `);
    
    return result.recordset[0].id;
  } catch (error) {
    console.error("Error tracking login:", error);
    return null;
  }
};

// Track user logout
exports.trackLogout = async (trackingId) => {
  try {
    const pool = await poolPromise;
    
    // Calculate session duration
    await pool
      .request()
      .input("trackingId", sql.Int, trackingId)
      .query(`
        UPDATE login_logout_tracking 
        SET 
          logout_time = GETDATE(),
          session_duration_minutes = DATEDIFF(MINUTE, login_time, GETDATE())
        WHERE id = @trackingId
      `);
    
    return true;
  } catch (error) {
    console.error("Error tracking logout:", error);
    return false;
  }
};

// Get user session history with pagination
exports.getUserSessionHistory = async (userId, period = 'daily', page = 1, limit = 10) => {
  try {
    const pool = await poolPromise;
    const offset = (page - 1) * limit;

    let dateFilter = '';
    
    switch (period) {
      case 'daily':
        dateFilter = `AND CAST(login_time AS DATE) = CAST(GETDATE() AS DATE)`;
        break;
      case 'weekly':
        dateFilter = `AND login_time >= DATEADD(DAY, -7, GETDATE())`;
        break;
      case 'monthly':
        dateFilter = `AND login_time >= DATEADD(MONTH, -1, GETDATE())`;
        break;
      default:
        dateFilter = `AND CAST(login_time AS DATE) = CAST(GETDATE() AS DATE)`;
    }

    const result = await pool
      .request()
      .input("userId", sql.Int, userId)
      .input("limit", sql.Int, limit)
      .input("offset", sql.Int, offset)
      .query(`
        SELECT 
          id,
          login_time,
          logout_time,
          session_duration_minutes,
          created_at,
          -- FIXED: Determine if session is still active
          CASE 
            WHEN logout_time IS NULL THEN 'ACTIVE'
            ELSE 'COMPLETED'
          END as session_status
        FROM login_logout_tracking 
        WHERE user_id = @userId 
        ${dateFilter}
        ORDER BY login_time DESC
        OFFSET @offset ROWS 
        FETCH NEXT @limit ROWS ONLY
      `);

    // Get total count for pagination
    const countResult = await pool
      .request()
      .input("userId", sql.Int, userId)
      .query(`
        SELECT COUNT(*) as total
        FROM login_logout_tracking 
        WHERE user_id = @userId 
        ${dateFilter}
      `);

    // Get stats including active session
    const statsResult = await pool
      .request()
      .input("userId", sql.Int, userId)
      .query(`
        SELECT 
          COUNT(*) as total_sessions,
          COUNT(CASE WHEN logout_time IS NOT NULL THEN 1 END) as completed_sessions,
          COUNT(CASE WHEN logout_time IS NULL THEN 1 END) as active_sessions,
          SUM(
            CASE 
              WHEN logout_time IS NOT NULL THEN session_duration_minutes
              ELSE DATEDIFF(MINUTE, login_time, GETDATE())
            END
          ) as total_minutes
        FROM login_logout_tracking 
        WHERE user_id = @userId 
        ${dateFilter}
      `);

    const stats = statsResult.recordset[0];

    return {
      sessions: result.recordset.map(session => ({
        ...session,
        // If still active, calculate current duration
        current_duration_minutes: session.logout_time ? 
          session.session_duration_minutes : 
          Math.floor((new Date() - new Date(session.login_time)) / 60000)
      })),
      total: countResult.recordset[0].total,
      page,
      limit,
      totalPages: Math.ceil(countResult.recordset[0].total / limit),
      stats: {
        totalSessions: stats.total_sessions || 0,
        completedSessions: stats.completed_sessions || 0,
        activeSessions: stats.active_sessions || 0,
        totalHours: (stats.total_minutes || 0) / 60
      }
    };
  } catch (error) {
    console.error("Error fetching session history:", error);
    throw error;
  }
};

// Get user session statistics
exports.getUserSessionStats = async (userId, period = 'monthly') => {
  try {
    const pool = await poolPromise;

    let dateFilter = '';
    
    switch (period) {
      case 'daily':
        dateFilter = `AND login_time >= CAST(GETDATE() AS DATE)`;
        break;
      case 'weekly':
        dateFilter = `AND login_time >= DATEADD(DAY, -7, GETDATE())`;
        break;
      case 'monthly':
        dateFilter = `AND login_time >= DATEADD(MONTH, -1, GETDATE())`;
        break;
      default:
        dateFilter = `AND login_time >= DATEADD(MONTH, -1, GETDATE())`;
    }

    // Calculate total minutes including active sessions
    const totalResult = await pool
      .request()
      .input("userId", sql.Int, userId)
      .query(`
        SELECT 
          SUM(
            CASE 
              WHEN logout_time IS NOT NULL THEN session_duration_minutes 
              ELSE DATEDIFF(MINUTE, login_time, GETDATE())
            END
          ) as total_period_minutes
        FROM login_logout_tracking 
        WHERE user_id = @userId 
        ${dateFilter}
      `);

    return {
      totalHours: (totalResult.recordset[0]?.total_period_minutes || 0) / 60,
      period: period
    };
  } catch (error) {
    console.error("Error fetching session stats:", error);
    throw error;
  }
};

// Get active sessions (users currently logged in)
exports.getActiveSessions = async () => {
  try {
    const pool = await poolPromise;
    
    const result = await pool
      .request()
      .query(`
        SELECT 
          t.id,
          t.user_id,
          t.login_time,
          u.username,
          d.firstName,
          d.lastName,
          u.role
        FROM login_logout_tracking t
        INNER JOIN userinfo u ON t.user_id = u.id
        INNER JOIN userdetails d ON u.id = d.id
        WHERE t.logout_time IS NULL
        ORDER BY t.login_time DESC
      `);

    return result.recordset;
  } catch (error) {
    console.error("Error fetching active sessions:", error);
    throw error;
  }
};