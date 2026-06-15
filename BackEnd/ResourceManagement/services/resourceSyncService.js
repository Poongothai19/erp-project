const { poolPromise, sql } = require("../../config/db");

class ResourceSyncService {
    constructor() {
        this.pool = null;
    }

    async initialize() {
        this.pool = await poolPromise;
    }

    // Sync all resources from source tables
    async syncAllResources() {
        try {
            console.log('🔄 Starting resource sync...');
            
            // Sync from each source table
            await this.syncFromUserInfo();
            await this.syncFromCompanyEmployees();
            await this.syncFromCandidates();
            await this.syncFromResumeSubmissions();
            
            console.log('✅ Resource sync completed');
            return { success: true, message: 'Sync completed' };
        } catch (error) {
            console.error('❌ Resource sync error:', error);
            return { success: false, error: error.message };
        }
    }

    // Sync from userinfo table
    async syncFromUserInfo() {
        try {
            const query = `
                INSERT INTO ResourceManagement (
                    ResourceType, SourceTable, SourceId, EmployeeId,
                    Name, Email, Department, Position,
                    AllocationStatus, CompanyId, CompanyName,
                    CreatedAt, UpdatedAt, SyncStatus
                )
                SELECT 
                    CASE 
                        WHEN role IN ('admin', 'manager', 'teamlead', 'user') THEN 'Internal'
                        ELSE 'External'
                    END as ResourceType,
                    'userinfo' as SourceTable,
                    id as SourceId,
                    EmployeeId,
                    username as Name,
                    NULL as Email,
                    'System' as Department,
                    role as Position,
                    'Active' as AllocationStatus,
                    0 as CompanyId, -- System users
                    'Prophecy ERP' as CompanyName,
                    GETDATE() as CreatedAt,
                    GETDATE() as UpdatedAt,
                    'Synced' as SyncStatus
                FROM userinfo
                WHERE id NOT IN (
                    SELECT SourceId 
                    FROM ResourceManagement 
                    WHERE SourceTable = 'userinfo'
                )
            `;

            const result = await this.pool.request().query(query);
            console.log(`✅ Synced ${result.rowsAffected[0]} users from userinfo`);
            
            return result;
        } catch (error) {
            console.error('Error syncing from userinfo:', error);
            throw error;
        }
    }

    // Sync from company employee tables
    async syncFromCompanyEmployees() {
        const companyTables = [
            { id: 2, name: 'ProphecyConsultingEmployees', companyName: 'Prophecy Consulting' },
            { id: 3, name: 'ProphecyOffshoreEmployees', companyName: 'Prophecy Offshore' },
            { id: 5, name: 'CognifyarEmployees', companyName: 'Cognifyar' }
        ];

        for (const company of companyTables) {
            try {
                const query = `
                    INSERT INTO ResourceManagement (
                        ResourceType, SourceTable, SourceId, EmployeeId,
                        Name, Email, Phone, Department, Position,
                        EmploymentType, AllocationStatus, CompanyId, CompanyName,
                        HireDate, Location, CreatedAt, UpdatedAt, SyncStatus
                    )
                    SELECT 
                        'Internal' as ResourceType,
                        @tableName as SourceTable,
                        Id as SourceId,
                        EmployeeId,
                        Name,
                        Email,
                        Phone,
                        Department,
                        Position,
                        EmploymentType,
                        COALESCE(Status, 'Active') as AllocationStatus,
                        @companyId as CompanyId,
                        @companyName as CompanyName,
                        HireDate,
                        NULL as Location,
                        GETDATE() as CreatedAt,
                        GETDATE() as UpdatedAt,
                        'Synced' as SyncStatus
                    FROM ${company.name}
                    WHERE EmployeeId NOT IN (
                        SELECT EmployeeId 
                        FROM ResourceManagement 
                        WHERE CompanyId = @companyId AND EmployeeId IS NOT NULL
                    )
                `;

                const result = await this.pool.request()
                    .input('tableName', sql.NVarChar, company.name)
                    .input('companyId', sql.Int, company.id)
                    .input('companyName', sql.NVarChar, company.companyName)
                    .query(query);

                console.log(`✅ Synced ${result.rowsAffected[0]} employees from ${company.name}`);
            } catch (error) {
                console.error(`Error syncing from ${company.name}:`, error);
            }
        }
    }

    // Sync from Candidates table
    async syncFromCandidates() {
        try {
            const query = `
                INSERT INTO ResourceManagement (
                    ResourceType, SourceTable, SourceId,
                    Name, Email, Phone, Skills, ExperienceYears, Location, VisaStatus,
                    AllocationStatus, CreatedAt, UpdatedAt, SyncStatus
                )
                SELECT 
                    'Candidate' as ResourceType,
                    'Candidates' as SourceTable,
                    id as SourceId,
                    Name,
                    Email,
                    Phone,
                    Skills,
                    CAST(LEFT(Experience, CHARINDEX(' ', Experience)) as INT) as ExperienceYears,
                    Location,
                    VisaStatus,
                    Status as AllocationStatus,
                    CreatedAt,
                    GETDATE() as UpdatedAt,
                    'Synced' as SyncStatus
                FROM Candidates
                WHERE id NOT IN (
                    SELECT SourceId 
                    FROM ResourceManagement 
                    WHERE SourceTable = 'Candidates'
                )
            `;

            const result = await this.pool.request().query(query);
            console.log(`✅ Synced ${result.rowsAffected[0]} candidates`);
            
            return result;
        } catch (error) {
            console.error('Error syncing from Candidates:', error);
            throw error;
        }
    }

    // Sync from ResumeSubmissions table
    async syncFromResumeSubmissions() {
        try {
            const query = `
                INSERT INTO ResourceManagement (
                    ResourceType, SourceTable, SourceId,
                    Name, Email, Phone, Skills, ExperienceYears, Location, VisaStatus,
                    AllocationStatus, Notes, CreatedAt, UpdatedAt, SyncStatus
                )
                SELECT 
                    'External' as ResourceType,
                    'ResumeSubmissions' as SourceTable,
                    id as SourceId,
                    Name,
                    Email,
                    Phone,
                    Skills,
                    Experience as ExperienceYears,
                    Location,
                    VisaStatus,
                    'Available' as AllocationStatus,
                    AdditionalInfo as Notes,
                    CreatedAt,
                    GETDATE() as UpdatedAt,
                    'Synced' as SyncStatus
                FROM ResumeSubmissions
                WHERE id NOT IN (
                    SELECT SourceId 
                    FROM ResourceManagement 
                    WHERE SourceTable = 'ResumeSubmissions'
                )
            `;

            const result = await this.pool.request().query(query);
            console.log(`✅ Synced ${result.rowsAffected[0]} resume submissions`);
            
            return result;
        } catch (error) {
            console.error('Error syncing from ResumeSubmissions:', error);
            throw error;
        }
    }

    // Update sync status for a resource
    async updateSyncStatus(resourceId, status) {
        try {
            await this.pool.request()
                .input('id', sql.Int, resourceId)
                .input('status', sql.NVarChar, status)
                .query(`
                    UPDATE ResourceManagement 
                    SET SyncStatus = @status, UpdatedAt = GETDATE() 
                    WHERE Id = @id
                `);
        } catch (error) {
            console.error('Error updating sync status:', error);
        }
    }
}

module.exports = new ResourceSyncService();