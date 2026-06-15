-- =============================================================================
-- Gap Analysis Patch DDL - Part 2
-- =============================================================================

-- 4b. recruit.Candidate — Fix ModifiedOn
IF EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = 'recruit' AND TABLE_NAME = 'Candidate' AND COLUMN_NAME = 'ModifiedOn')
BEGIN
    EXEC sp_rename 'recruit.Candidate.ModifiedOn', 'UpdatedAtUtc', 'COLUMN';
    PRINT 'Renamed recruit.Candidate.ModifiedOn to UpdatedAtUtc';
END

-- 5. recruit.SubmissionResume.ResumeBinary DROP
IF EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = 'recruit' AND TABLE_NAME = 'SubmissionResume' AND COLUMN_NAME = 'ResumeBinary')
BEGIN
    ALTER TABLE [recruit].[SubmissionResume] DROP COLUMN [ResumeBinary];
    PRINT 'Dropped recruit.SubmissionResume.ResumeBinary';
END
