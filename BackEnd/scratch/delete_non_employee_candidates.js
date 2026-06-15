require('dotenv').config();
const { sql, poolPromise } = require('../config/db');

async function deleteNonEmployeeCandidates() {
    let pool;
    try {
        pool = await poolPromise;
        console.log('Connected to DB');

        // Start transaction
        const transaction = new sql.Transaction(pool);
        await transaction.begin();

        try {
            const request = new sql.Request(transaction);

            console.log('Identifying candidates to delete from recruit.Candidate...');
            
            const countResult = await request.query(`
                SELECT COUNT(CandidateId) as count 
                FROM recruit.Candidate 
                WHERE EmployeeId IS NULL
            `);
            const candidatesToDelete = countResult.recordset[0].count;
            console.log(`Found ${candidatesToDelete} candidates to delete.`);

            if (candidatesToDelete === 0) {
                console.log('No candidates to delete. Exiting.');
                await transaction.commit();
                process.exit(0);
            }

            const targetCondition = `
                CandidateId IN (
                    SELECT CandidateId 
                    FROM recruit.Candidate 
                    WHERE EmployeeId IS NULL
                )
            `;

            // List of dependent tables with 'CandidateId' column in recruit schema
            const dependentTables = [
                'CandidateSkill',
                'CandidateTag',
                'CandidateEducation',
                'CandidateWorkExperience',
                'CandidateComplianceDocument',
                'CandidateReference',
                'CandidateCertification',
                'CandidateStatusHistory',
                'CandidateActivity',
                'CandidateCommunication',
                'CandidateSearchText',
                'CandidateEmbedding',
                'CandidateDocument',
                'CandidateIdentity'
            ];
            
            const submissionDependents = [
                'SubmissionStatusHistory',
                'SubmissionResume',
                'SubmissionClientEvent',
                'SubmissionOwnerHistory'
            ];

            // Helper function to resolve schemas dynamically
            const schemaCache = {};
            const getTableWithSchema = async (tableName) => {
                if (schemaCache[tableName]) return schemaCache[tableName];
                const res = await request.query(`SELECT TABLE_SCHEMA FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = '${tableName}'`);
                if (res.recordset.length > 0) {
                    schemaCache[tableName] = `[${res.recordset[0].TABLE_SCHEMA}].[${tableName}]`;
                    return schemaCache[tableName];
                }
                return `[dbo].[${tableName}]`; // fallback
            };

            console.log('Deleting from recruit.ResumeParseRun...');
            try {
                const query = `
                    DELETE FROM recruit.ResumeParseRun 
                    WHERE DocumentId IN (
                        SELECT DocumentId FROM recruit.CandidateDocument WHERE ${targetCondition}
                    )
                `;
                const res = await request.query(query);
                console.log(`Deleted ${res.rowsAffected[0]} records from recruit.ResumeParseRun`);
            } catch (e) {
                console.error(`Error deleting from recruit.ResumeParseRun:`, e.message);
            }

            console.log('Deleting from Submission dependents...');
            for (const table of submissionDependents) {
                const fullTableName = await getTableWithSchema(table);
                const query = `
                    DELETE FROM ${fullTableName} 
                    WHERE SubmissionId IN (
                        SELECT SubmissionId FROM recruit.Submission WHERE ${targetCondition}
                    )
                `;
                try {
                    const res = await request.query(query);
                    console.log(`Deleted ${res.rowsAffected[0]} records from ${fullTableName}`);
                } catch (e) {
                    console.error(`Error deleting from ${fullTableName}:`, e.message);
                }
            }

            const fullSubmissionTable = await getTableWithSchema('Submission');
            console.log(`Deleting from ${fullSubmissionTable}...`);
            try {
                const subRes = await request.query(`DELETE FROM ${fullSubmissionTable} WHERE ${targetCondition}`);
                console.log(`Deleted ${subRes.rowsAffected[0]} records from ${fullSubmissionTable}`);
            } catch(e) {
                console.error(`Error deleting from ${fullSubmissionTable}:`, e.message);
            }

            console.log('Deleting from dependent tables...');
            for (const table of dependentTables) {
                const fullTableName = await getTableWithSchema(table);
                const query = `DELETE FROM ${fullTableName} WHERE ${targetCondition}`;
                try {
                    const res = await request.query(query);
                    console.log(`Deleted ${res.rowsAffected[0]} records from ${fullTableName}`);
                } catch (e) {
                    console.error(`Error deleting from ${fullTableName}:`, e.message);
                }
            }

            console.log('Nullifying PromotedCandidateId and SuggestedCandidateId in recruit.InboundDocument...');
            try {
                const inboundUpdate1 = await request.query(`
                    UPDATE recruit.InboundDocument 
                    SET PromotedCandidateId = NULL 
                    WHERE PromotedCandidateId IN (
                        SELECT CandidateId FROM recruit.Candidate WHERE EmployeeId IS NULL
                    )
                `);
                console.log(`Updated ${inboundUpdate1.rowsAffected[0]} records in InboundDocument (PromotedCandidateId)`);
                
                const inboundUpdate2 = await request.query(`
                    UPDATE recruit.InboundDocument 
                    SET SuggestedCandidateId = NULL 
                    WHERE SuggestedCandidateId IN (
                        SELECT CandidateId FROM recruit.Candidate WHERE EmployeeId IS NULL
                    )
                `);
                console.log(`Updated ${inboundUpdate2.rowsAffected[0]} records in InboundDocument (SuggestedCandidateId)`);
            } catch(e) {
                console.error('Error updating InboundDocument:', e.message);
            }


            console.log('Deleting from recruit.Candidate table...');
            const candRes = await request.query(`DELETE FROM recruit.Candidate WHERE EmployeeId IS NULL`);
            console.log(`Deleted ${candRes.rowsAffected[0]} candidates.`);

            // Commit transaction
            await transaction.commit();
            console.log('Transaction committed successfully.');

        } catch (err) {
            console.error('Error during deletion, rolling back transaction:', err);
            await transaction.rollback();
        }

        process.exit(0);

    } catch (err) {
        console.error('Database connection failed:', err);
        process.exit(1);
    }
}

deleteNonEmployeeCandidates();
