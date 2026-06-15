const sql = require('mssql');
require('dotenv').config();

const sourceConfig = {
    user: 'sa',
    password: 'Strong!1234',
    server: '65.38.99.253',
    database: 'JobPost_DEV',
    options: {
        encrypt: true,
        trustServerCertificate: true
    }
};

const targetConfig = {
    user: 'sa',
    password: 'Strong!12345',
    server: '66.179.82.107',
    database: 'Jobpost',
    options: {
        encrypt: true,
        trustServerCertificate: true
    }
};

const schemas = ['recruit', 'core', 'hrm', 'crm'];

async function getSchemaInfo(config) {
    try {
        const pool = await sql.connect(config);
        const result = await pool.request().query(`
            SELECT 
                TABLE_SCHEMA, 
                TABLE_NAME, 
                COLUMN_NAME, 
                DATA_TYPE, 
                CHARACTER_MAXIMUM_LENGTH, 
                IS_NULLABLE,
                COLUMN_DEFAULT,
                NUMERIC_PRECISION,
                NUMERIC_SCALE
            FROM INFORMATION_SCHEMA.COLUMNS
            WHERE TABLE_SCHEMA IN (${schemas.map(s => `'${s}'`).join(',')})
            ORDER BY TABLE_SCHEMA, TABLE_NAME, ORDINAL_POSITION
        `);
        await pool.close();
        return result.recordset;
    } catch (err) {
        console.error(`Error connecting to ${config.server}:`, err.message);
        return null;
    }
}

function getColumnDefinition(col) {
    let def = `[${col.COLUMN_NAME}] ${col.DATA_TYPE}`;
    if (col.CHARACTER_MAXIMUM_LENGTH) {
        def += `(${col.CHARACTER_MAXIMUM_LENGTH === -1 ? 'MAX' : col.CHARACTER_MAXIMUM_LENGTH})`;
    } else if (col.NUMERIC_PRECISION !== null && col.DATA_TYPE !== 'int' && col.DATA_TYPE !== 'bigint' && col.DATA_TYPE !== 'smallint' && col.DATA_TYPE !== 'tinyint') {
        def += `(${col.NUMERIC_PRECISION}${col.NUMERIC_SCALE !== null ? `, ${col.NUMERIC_SCALE}` : ''})`;
    }
    def += col.IS_NULLABLE === 'YES' ? ' NULL' : ' NOT NULL';
    if (col.COLUMN_DEFAULT) {
        def += ` DEFAULT ${col.COLUMN_DEFAULT}`;
    }
    return def;
}

async function compare() {
    console.log('Fetching schema info from source (65.38.99.253)...');
    const sourceData = await getSchemaInfo(sourceConfig);
    if (!sourceData) return;

    console.log('Fetching schema info from target (66.179.82.107)...');
    const targetData = await getSchemaInfo(targetConfig);
    if (!targetData) return;

    const sourceMap = {};
    sourceData.forEach(row => {
        const key = `${row.TABLE_SCHEMA}.${row.TABLE_NAME}`;
        if (!sourceMap[key]) sourceMap[key] = [];
        sourceMap[key].push(row);
    });

    const targetMap = {};
    targetData.forEach(row => {
        const key = `${row.TABLE_SCHEMA}.${row.TABLE_NAME}`;
        if (!targetMap[key]) targetMap[key] = [];
        targetMap[key].push(row);
    });

    let sqlPatch = '-- DATABASE SCHEMA SYNC PATCH - ALIGNMENT & CLEANUP\n';
    sqlPatch += '-- Source: 65.38.99.253 (JobPost_DEV)\n';
    sqlPatch += '-- Target: 66.179.82.107 (Jobpost)\n\n';

    // Ensure schemas exist on target
    schemas.forEach(s => {
        sqlPatch += `IF NOT EXISTS (SELECT * FROM sys.schemas WHERE name = '${s}') EXEC('CREATE SCHEMA [${s}]');\n`;
    });
    sqlPatch += '\n';

    console.log('\n--- ANALYSIS RESULTS ---\n');

    const missingTables = [];
    const missingColumns = [];
    const extraColumns = [];
    const typeMismatches = [];

    for (const tableKey in sourceMap) {
        const [schema, table] = tableKey.split('.');
        if (!targetMap[tableKey]) {
            missingTables.push(tableKey);
            const cols = sourceMap[tableKey];
            sqlPatch += `-- Table missing in Target: ${tableKey}\n`;
            sqlPatch += `IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[${schema}].[${table}]') AND type in (N'U'))\n`;
            sqlPatch += `BEGIN\n`;
            sqlPatch += `    CREATE TABLE [${schema}].[${table}] (\n`;
            sqlPatch += cols.map(c => `        ${getColumnDefinition(c)}`).join(',\n');
            sqlPatch += `\n    );\n`;
            sqlPatch += `END\nGO\n\n`;
        } else {
            const sourceCols = sourceMap[tableKey];
            const targetCols = targetMap[tableKey];
            
            const sourceColMap = {};
            sourceCols.forEach(c => sourceColMap[c.COLUMN_NAME.toLowerCase()] = c);
            
            const targetColMap = {};
            targetCols.forEach(c => targetColMap[c.COLUMN_NAME.toLowerCase()] = c);

            // Check for missing columns in Target or type mismatches
            sourceCols.forEach(sCol => {
                const sColNameLower = sCol.COLUMN_NAME.toLowerCase();
                const tCol = targetColMap[sColNameLower];
                
                if (!tCol) {
                    missingColumns.push({
                        table: tableKey,
                        column: sCol.COLUMN_NAME,
                        type: sCol.DATA_TYPE,
                        length: sCol.CHARACTER_MAXIMUM_LENGTH,
                        nullable: sCol.IS_NULLABLE
                    });
                    sqlPatch += `-- Column missing in Target: ${tableKey}.${sCol.COLUMN_NAME}\n`;
                    sqlPatch += `IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[${schema}].[${table}]') AND name = '${sCol.COLUMN_NAME}')\n`;
                    sqlPatch += `BEGIN\n`;
                    sqlPatch += `    ALTER TABLE [${schema}].[${table}] ADD ${getColumnDefinition(sCol)};\n`;
                    sqlPatch += `END\nGO\n\n`;
                } else {
                    // Check for type/length mismatch
                    if (sCol.DATA_TYPE !== tCol.DATA_TYPE || sCol.CHARACTER_MAXIMUM_LENGTH !== tCol.CHARACTER_MAXIMUM_LENGTH) {
                        typeMismatches.push({
                            table: tableKey,
                            column: sCol.COLUMN_NAME,
                            sourceType: `${sCol.DATA_TYPE}${sCol.CHARACTER_MAXIMUM_LENGTH ? `(${sCol.CHARACTER_MAXIMUM_LENGTH})` : ''}`,
                            targetType: `${tCol.DATA_TYPE}${tCol.CHARACTER_MAXIMUM_LENGTH ? `(${tCol.CHARACTER_MAXIMUM_LENGTH})` : ''}`
                        });
                        sqlPatch += `-- Type mismatch in ${tableKey}.${sCol.COLUMN_NAME}: Source=${sCol.DATA_TYPE}, Target=${tCol.DATA_TYPE}\n`;
                        sqlPatch += `ALTER TABLE [${schema}].[${table}] ALTER COLUMN ${getColumnDefinition(sCol)};\nGO\n\n`;
                    }
                }
            });

            // Check for extra columns in Target
            targetCols.forEach(tCol => {
                if (!sourceColMap[tCol.COLUMN_NAME.toLowerCase()]) {
                    extraColumns.push({
                        table: tableKey,
                        column: tCol.COLUMN_NAME
                    });
                    sqlPatch += `-- Extra column in Target: ${tableKey}.${tCol.COLUMN_NAME}\n`;
                    sqlPatch += `IF EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[${schema}].[${table}]') AND name = '${tCol.COLUMN_NAME}')\n`;
                    sqlPatch += `BEGIN\n`;
                    sqlPatch += `    -- Warning: Dropping column that exists in Target but not in Source\n`;
                    sqlPatch += `    ALTER TABLE [${schema}].[${table}] DROP COLUMN [${tCol.COLUMN_NAME}];\n`;
                    sqlPatch += `END\nGO\n\n`;
                }
            });
        }
    }

    if (missingTables.length > 0) {
        console.log('MISSING TABLES in Target (Present in Source):');
        missingTables.forEach(t => console.log(` - ${t}`));
    } else {
        console.log('No missing tables found.');
    }

    if (missingColumns.length > 0) {
        console.log('\nMISSING COLUMNS in Target (Present in Source):');
        missingColumns.forEach(c => {
            console.log(` - ${c.table}: ${c.column} (${c.type}${c.length ? `(${c.length})` : ''}, ${c.nullable === 'YES' ? 'NULL' : 'NOT NULL'})`);
        });
    } else {
        console.log('\nNo missing columns found.');
    }

    if (extraColumns.length > 0) {
        console.log('\nEXTRA COLUMNS in Target (NOT in Source) - will be dropped:');
        extraColumns.forEach(c => {
            console.log(` - ${c.table}: ${c.column}`);
        });
    }

    if (typeMismatches.length > 0) {
        console.log('\nDATA TYPE MISMATCHES - will be aligned:');
        typeMismatches.forEach(m => {
            console.log(` - ${m.table}.${m.column}: Source=${m.sourceType}, Target=${m.targetType}`);
        });
    }

    const fs = require('fs');
    fs.writeFileSync('scratch/db_sync_patch_full.sql', sqlPatch);
    console.log('\nFull SQL patch generated: scratch/db_sync_patch_full.sql');
}

compare();
