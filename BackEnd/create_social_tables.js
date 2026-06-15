require('dotenv').config();
const { poolPromise } = require('./config/db');

async function createSocialTables() {
    try {
        const pool = await poolPromise;
        
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
        console.log("RecruiterSocialMediaConfig table created or already exists.");

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
        console.log("JobSocialPostHistory table created or already exists.");
        
        process.exit(0);
    } catch (e) {
        console.error("Error creating tables:", e);
        process.exit(1);
    }
}

createSocialTables();
