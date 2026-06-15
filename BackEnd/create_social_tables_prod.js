const sql = require('mssql');

const config = {
    user: 'sa',
    password: 'Strong!12345',
    server: '66.179.82.107',
    database: 'Jobpost',
    port: 1433,
    options: {
        encrypt: false, // For testing/local development without SSL
        trustServerCertificate: true // Trust self-signed certificates
    }
};

async function createSocialTablesProd() {
    try {
        console.log("Attempting to connect to Production SQL Server (66.179.82.107)...");
        const pool = await sql.connect(config);
        console.log("✅ Connected to Production SQL Server successfully");
        
        await pool.request().query(`
            IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='RecruiterSocialMediaConfig' and xtype='U')
            BEGIN
                CREATE TABLE RecruiterSocialMediaConfig (
                    ConfigID BIGINT IDENTITY(1,1) PRIMARY KEY,
                    RecruiterID INT NOT NULL,
                    PlatformName VARCHAR(50) NOT NULL,
                    ClientID VARCHAR(255),
                    ClientSecretEncrypted TEXT,
                    AccessTokenEncrypted TEXT,
                    RefreshTokenEncrypted TEXT,
                    ProfileID VARCHAR(100),
                    OrganizationID VARCHAR(100),
                    PageID VARCHAR(100),
                    InstagramBusinessAccountID VARCHAR(100),
                    PostingModeAllowed VARCHAR(50),
                    ConnectionStatus VARCHAR(50),
                    IsActive BIT DEFAULT 1,
                    LastVerifiedDate DATETIME,
                    CreatedBy VARCHAR(100),
                    CreatedDate DATETIME DEFAULT GETDATE(),
                    UpdatedBy VARCHAR(100),
                    UpdatedDate DATETIME
                )
            END
        `);
        console.log("RecruiterSocialMediaConfig table created or already exists in Production DB.");

        await pool.request().query(`
            IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='JobSocialPostHistory' and xtype='U')
            BEGIN
                CREATE TABLE JobSocialPostHistory (
                    PostID BIGINT IDENTITY(1,1) PRIMARY KEY,
                    JobID INT NOT NULL,
                    RecruiterID INT NOT NULL,
                    PlatformName VARCHAR(50) NOT NULL,
                    PostingLevel VARCHAR(50),
                    PostContent NVARCHAR(MAX),
                    ExternalPostID VARCHAR(255),
                    PostURL NVARCHAR(MAX),
                    PostStatus VARCHAR(50),
                    ErrorMessage NVARCHAR(MAX),
                    PostedDate DATETIME DEFAULT GETDATE()
                )
            END
        `);
        console.log("JobSocialPostHistory table created or already exists in Production DB.");
        
        process.exit(0);
    } catch (e) {
        console.error("Error creating tables:", e);
        process.exit(1);
    }
}

createSocialTablesProd();
