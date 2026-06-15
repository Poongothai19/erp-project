-- DATABASE SCHEMA SYNC PATCH - ALIGNMENT & CLEANUP
-- Source: 65.38.99.253 (JobPost_DEV)
-- Target: 66.179.82.107 (Jobpost)

IF NOT EXISTS (SELECT * FROM sys.schemas WHERE name = 'recruit') EXEC('CREATE SCHEMA [recruit]');
IF NOT EXISTS (SELECT * FROM sys.schemas WHERE name = 'core') EXEC('CREATE SCHEMA [core]');
IF NOT EXISTS (SELECT * FROM sys.schemas WHERE name = 'hrm') EXEC('CREATE SCHEMA [hrm]');
IF NOT EXISTS (SELECT * FROM sys.schemas WHERE name = 'crm') EXEC('CREATE SCHEMA [crm]');

-- Type mismatch in hrm.Employee.UserId: Source=int, Target=bigint
ALTER TABLE [hrm].[Employee] ALTER COLUMN [UserId] int NOT NULL;
GO

-- Extra column in Target: recruit.CandidateDocument.CoreDocumentId
IF EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[recruit].[CandidateDocument]') AND name = 'CoreDocumentId')
BEGIN
    -- Warning: Dropping column that exists in Target but not in Source
    ALTER TABLE [recruit].[CandidateDocument] DROP COLUMN [CoreDocumentId];
END
GO

-- Extra column in Target: recruit.CandidateEmbedding.VectorFormat
IF EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[recruit].[CandidateEmbedding]') AND name = 'VectorFormat')
BEGIN
    -- Warning: Dropping column that exists in Target but not in Source
    ALTER TABLE [recruit].[CandidateEmbedding] DROP COLUMN [VectorFormat];
END
GO

-- Extra column in Target: recruit.CandidateIdentity.IdentityValueNorm
IF EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[recruit].[CandidateIdentity]') AND name = 'IdentityValueNorm')
BEGIN
    -- Warning: Dropping column that exists in Target but not in Source
    ALTER TABLE [recruit].[CandidateIdentity] DROP COLUMN [IdentityValueNorm];
END
GO

-- Extra column in Target: recruit.CandidateSearchText.BuildVersion
IF EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[recruit].[CandidateSearchText]') AND name = 'BuildVersion')
BEGIN
    -- Warning: Dropping column that exists in Target but not in Source
    ALTER TABLE [recruit].[CandidateSearchText] DROP COLUMN [BuildVersion];
END
GO

-- Extra column in Target: recruit.CandidateStatusHistory.StatusHistoryId
IF EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[recruit].[CandidateStatusHistory]') AND name = 'StatusHistoryId')
BEGIN
    -- Warning: Dropping column that exists in Target but not in Source
    ALTER TABLE [recruit].[CandidateStatusHistory] DROP COLUMN [StatusHistoryId];
END
GO

-- Extra column in Target: recruit.CandidateStatusHistory.StartOn
IF EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[recruit].[CandidateStatusHistory]') AND name = 'StartOn')
BEGIN
    -- Warning: Dropping column that exists in Target but not in Source
    ALTER TABLE [recruit].[CandidateStatusHistory] DROP COLUMN [StartOn];
END
GO

-- Extra column in Target: recruit.CandidateStatusHistory.ChangedOn
IF EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[recruit].[CandidateStatusHistory]') AND name = 'ChangedOn')
BEGIN
    -- Warning: Dropping column that exists in Target but not in Source
    ALTER TABLE [recruit].[CandidateStatusHistory] DROP COLUMN [ChangedOn];
END
GO

-- Extra column in Target: recruit.CandidateTag.CreatedOn
IF EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[recruit].[CandidateTag]') AND name = 'CreatedOn')
BEGIN
    -- Warning: Dropping column that exists in Target but not in Source
    ALTER TABLE [recruit].[CandidateTag] DROP COLUMN [CreatedOn];
END
GO

-- Extra column in Target: recruit.Skill.SkillNameNorm
IF EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[recruit].[Skill]') AND name = 'SkillNameNorm')
BEGIN
    -- Warning: Dropping column that exists in Target but not in Source
    ALTER TABLE [recruit].[Skill] DROP COLUMN [SkillNameNorm];
END
GO

-- Extra column in Target: recruit.Tag.TagNameNorm
IF EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[recruit].[Tag]') AND name = 'TagNameNorm')
BEGIN
    -- Warning: Dropping column that exists in Target but not in Source
    ALTER TABLE [recruit].[Tag] DROP COLUMN [TagNameNorm];
END
GO

