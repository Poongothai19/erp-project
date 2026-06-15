-- =============================================================================
-- Gap Analysis Patch DDL
-- Platform: Prophecy Group Custom ATS / ERP / HR Platform
-- Produced: 2026-04-29
-- =============================================================================

-- 1. DROP hrm.Timesheet.Approver
IF EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = 'hrm' AND TABLE_NAME = 'Timesheet' AND COLUMN_NAME = 'Approver')
BEGIN
    ALTER TABLE [hrm].[Timesheet] DROP COLUMN [Approver];
    PRINT 'Dropped hrm.Timesheet.Approver';
END

-- 2. core.Team.EntityId NOT NULL + FK
IF EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = 'core' AND TABLE_NAME = 'Team' AND COLUMN_NAME = 'EntityId' AND IS_NULLABLE = 'YES')
BEGIN
    ALTER TABLE [core].[Team] ALTER COLUMN [EntityId] INT NOT NULL;
    PRINT 'Set core.Team.EntityId to NOT NULL';
END

-- 3. hrm.Employee.UserId NOT NULL + FK
IF EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = 'hrm' AND TABLE_NAME = 'Employee' AND COLUMN_NAME = 'UserId' AND IS_NULLABLE = 'YES')
BEGIN
    ALTER TABLE [hrm].[Employee] ALTER COLUMN [UserId] INT NOT NULL;
    PRINT 'Set hrm.Employee.UserId to NOT NULL';
END

-- 4. recruit.Candidate — Fix timestamp columns to UTC
IF EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = 'recruit' AND TABLE_NAME = 'Candidate' AND COLUMN_NAME = 'CreatedOn')
BEGIN
    EXEC sp_rename 'recruit.Candidate.CreatedOn', 'CreatedAtUtc', 'COLUMN';
    ALTER TABLE [recruit].[Candidate] ADD DEFAULT SYSUTCDATETIME() FOR [CreatedAtUtc];
    PRINT 'Renamed recruit.Candidate.CreatedOn to CreatedAtUtc';
END

IF EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = 'recruit' AND TABLE_NAME = 'Candidate' AND COLUMN_NAME = 'ModifiedOn')
BEGIN
    EXEC sp_rename 'recruit.Candidate.ModifiedOn', 'UpdatedAtUtc', 'COLUMN';
    ALTER TABLE [recruit].[Candidate] ADD DEFAULT SYSUTCDATETIME() FOR [UpdatedAtUtc];
    PRINT 'Renamed recruit.Candidate.ModifiedOn to UpdatedAtUtc';
END

-- 5. recruit.SubmissionResume.ResumeBinary DROP
IF EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = 'recruit' AND TABLE_NAME = 'SubmissionResume' AND COLUMN_NAME = 'ResumeBinary')
BEGIN
    ALTER TABLE [recruit].[SubmissionResume] DROP COLUMN [ResumeBinary];
    PRINT 'Dropped recruit.SubmissionResume.ResumeBinary';
END
