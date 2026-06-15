const express = require("express");
const router = express.Router();
const resourceSyncService = require("../services/resourceSyncService");
const { authenticateToken } = require("../../Recruitment/middleWare/authMiddleware");

// Manual sync trigger
router.post("/manual", authenticateToken, async (req, res) => {
    try {
        const result = await resourceSyncService.syncAllResources();
        
        if (result.success) {
            res.status(200).json({
                success: true,
                message: "Resource sync completed successfully"
            });
        } else {
            res.status(500).json({
                success: false,
                message: "Sync failed",
                error: result.error
            });
        }
    } catch (error) {
        console.error("Manual sync error:", error);
        res.status(500).json({
            success: false,
            message: "Sync error",
            error: error.message
        });
    }
});

// Get sync status
router.get("/status", authenticateToken, async (req, res) => {
    try {
        const pool = await require("../../config/db").poolPromise;
        
        const statusQuery = `
            SELECT 
                COUNT(*) as total,
                SUM(CASE WHEN SyncStatus = 'Synced' THEN 1 ELSE 0 END) as synced,
                SUM(CASE WHEN SyncStatus = 'Pending' THEN 1 ELSE 0 END) as pending,
                SUM(CASE WHEN SyncStatus = 'Error' THEN 1 ELSE 0 END) as error,
                MAX(UpdatedAt) as lastSync
            FROM ResourceManagement
        `;

        const result = await pool.request().query(statusQuery);
        
        res.status(200).json({
            success: true,
            status: result.recordset[0]
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Error fetching sync status",
            error: error.message
        });
    }
});

module.exports = router;