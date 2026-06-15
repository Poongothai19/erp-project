-- DATABASE SCHEMA SYNC PATCH
-- Source: 65.38.99.253 (JobPost_DEV)
-- Target: 66.179.82.107 (Jobpost)

IF NOT EXISTS (SELECT * FROM sys.schemas WHERE name = 'recruit') EXEC('CREATE SCHEMA [recruit]');
IF NOT EXISTS (SELECT * FROM sys.schemas WHERE name = 'core') EXEC('CREATE SCHEMA [core]');
IF NOT EXISTS (SELECT * FROM sys.schemas WHERE name = 'hrm') EXEC('CREATE SCHEMA [hrm]');
IF NOT EXISTS (SELECT * FROM sys.schemas WHERE name = 'crm') EXEC('CREATE SCHEMA [crm]');

