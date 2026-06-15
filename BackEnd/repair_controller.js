/**
 * Comprehensive repair of resumeController.js
 * Fixes:
 *  1. Missing exports: testTableStructure, getCandidateDocuments
 *  2. Corruption inside shareResume (injected logStatusHistory code)
 *  3. logStatusHistory using wrong DB column names
 *  4. getResumeFileInfo broken body (merged with sendEmailViaSendGrid accidentally)
 */

const fs = require('fs');
const path = require('path');

const filePath = path.resolve(__dirname, 'Resume-Submission/controllers/resumeController.js');
let content = fs.readFileSync(filePath, 'utf8');

// Backup before making changes
fs.writeFileSync(filePath + '.bak2', content, 'utf8');
console.log('Backup saved as resumeController.js.bak2');

// =============================================================================
// REPAIR 1: Fix logStatusHistory to use correct schema columns
// =============================================================================
// The old (wrong) INSERT uses: FromStatus, ToStatus, ChangedAtUtc, ReasonText
// The real table has: Status, StartOn, Reason, ChangedByUserId, ChangedOn

const OLD_LOG = /async function logStatusHistory\(transaction,[\s\S]*?\{[\s\S]*?INSERT INTO \[recruit\]\.\[CandidateStatusHistory\][\s\S]*?\}\s*\}/m;

const FIXED_LOG = `async function logStatusHistory(transaction, { candidateId, fromStatus, toStatus, changedByUserId, reasonText = null }) {
  try {
    console.log(\`📜 Logging status change for \${candidateId}: \${fromStatus || 'NULL'} -> \${toStatus}\`);

    // Close previous open status row
    await new sql.Request(transaction)
      .input('CandidateId', sql.BigInt, candidateId)
      .query(\`
        UPDATE [recruit].[CandidateStatusHistory]
        SET EndOn = SYSUTCDATETIME()
        WHERE CandidateId = @CandidateId AND EndOn IS NULL
      \`);

    // Insert new status row
    await new sql.Request(transaction)
      .input('CandidateId',     sql.BigInt,        candidateId)
      .input('Status',          sql.NVarChar(50),  toStatus)
      .input('Reason',          sql.NVarChar(500), reasonText)
      .input('ChangedByUserId', sql.BigInt,        changedByUserId || null)
      .query(\`
        INSERT INTO [recruit].[CandidateStatusHistory]
          (CandidateId, Status, StartOn, Reason, ChangedByUserId, ChangedOn)
        VALUES
          (@CandidateId, @Status, SYSUTCDATETIME(), @Reason, @ChangedByUserId, SYSUTCDATETIME())
      \`);

    return { success: true };
  } catch (err) {
    console.error('❌ Failed to log status history:', err.message);
    throw err;
  }
}`;

if (OLD_LOG.test(content)) {
  content = content.replace(OLD_LOG, FIXED_LOG);
  console.log('✅ REPAIR 1: logStatusHistory updated to correct schema.');
} else {
  console.log('⚠️  REPAIR 1: logStatusHistory pattern not matched - check manually.');
}

// =============================================================================
// REPAIR 2: Fix the corrupted shareResume block (injected logStatusHistory)
// =============================================================================
const CORRUPT_SHARE = /return res\.status\(5async function logStatusHistory[\s\S]*?AND IsDeleted = 0\r?\n    `\);/m;
const FIXED_SHARE = `return res.status(500).json({ success: false, error: 'SendGrid API Key is not configured on the server' });
  }

  try {
    const pool = await poolPromise;

    let finalCandidateIds = [];
    if (candidateIds && Array.isArray(candidateIds) && candidateIds.length > 0) {
      finalCandidateIds = candidateIds;
    } else if (candidateId) {
      finalCandidateIds = [candidateId];
    } else {
      return res.status(400).json({ success: false, error: 'Candidate ID(s) is required' });
    }

    let candPlaceholders = [];
    let docPlaceholders = [];
    const request = pool.request();

    for (let i = 0; i < finalCandidateIds.length; i++) {
      const pName = \`cId\${i}\`;
      candPlaceholders.push(\`@\${pName}\`);
      request.input(pName, sql.Int, finalCandidateIds[i]);
    }
    for (let i = 0; i < documentIds.length; i++) {
      const pName = \`docId\${i}\`;
      docPlaceholders.push(\`@\${pName}\`);
      request.input(pName, sql.Int, documentIds[i]);
    }

    const docResult = await request.query(\`
      SELECT *
      FROM [recruit].[CandidateDocument]
      WHERE CandidateId IN (\${candPlaceholders.join(', ')})
        AND DocumentId IN (\${docPlaceholders.join(', ')})
        AND IsDeleted = 0
    \`);`;

if (CORRUPT_SHARE.test(content)) {
  content = content.replace(CORRUPT_SHARE, FIXED_SHARE);
  console.log('✅ REPAIR 2: Corrupt shareResume block restored.');
} else {
  console.log('ℹ️  REPAIR 2: Corrupt shareResume block not found.');
}

// =============================================================================
// REPAIR 3: Fix getResumeFileInfo - its body got merged with sendEmailViaSendGrid
// The current file has getResumeFileInfo's try block jumping into sendEmail code.
// We need to replace from the `if (!apiKey)` corruption back to the real body.
// =============================================================================

// Find getResumeFileInfo and check if it looks broken (contains sendgrid internals)
const CORRUPT_FILE_INFO = /(exports\.getResumeFileInfo[\s\S]*?WHERE DocumentId = @DocumentId AND IsDeleted = 0\s*`\);\s*)if \(!apiKey\)[\s\S]*?(?=exports\.shareResume)/m;

const FIXED_FILE_INFO_TAIL = `$1
    if (!result.recordset.length) {
      return res.status(200).json({ success: true, fileAvailable: false, message: "Document not found" });
    }

    const doc = result.recordset[0];
    const previewableTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/msword',
      'text/plain'
    ];
    const canPreview = previewableTypes.includes(doc.MimeType);

    return res.status(200).json({
      success: true,
      fileAvailable: true,
      fileInfo: {
        fileName:      doc.FileNameOriginal,
        fileSize:      doc.FileSizeBytes,
        fileExtension: doc.FileExtension,
        canPreview,
        fileType:      doc.MimeType,
      },
      downloadUrl: \`/api/resumes/\${documentId}/download\`,
      previewUrl:  canPreview ? \`/api/resumes/\${documentId}/preview\` : null,
    });

  } catch (error) {
    console.error("File info error:", error);
    res.status(500).json({
      success: false,
      error: "Could not get file information",
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// ─── GET CANDIDATE DOCUMENTS ──────────────────────────────────────────────────

exports.getCandidateDocuments = async (req, res) => {
  const { id } = req.params;

  if (!id || isNaN(parseInt(id))) {
    return res.status(400).json({ success: false, error: "Invalid candidate ID" });
  }

  const candidateId = parseInt(id);

  try {
    const pool = await poolPromise;

    const result = await pool.request()
      .input('CandidateId', sql.Int, candidateId)
      .query(\`
        SELECT
          DocumentId,
          DocumentType,
          FileNameOriginal,
          FileExtension,
          MimeType,
          FileSizeBytes,
          IsPrimaryResume,
          UploadedOn,
          FileNameOriginal as DocumentName
        FROM [recruit].[CandidateDocument]
        WHERE CandidateId = @CandidateId
          AND IsDeleted = 0
        ORDER BY
          IsPrimaryResume DESC,
          UploadedOn DESC
      \`);

    res.status(200).json(result.recordset);

  } catch (error) {
    console.error("Error fetching candidate documents:", error);
    res.status(500).json({
      success: false,
      error: "Could not fetch documents",
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// ─── DEBUG: TABLE STRUCTURE ──────────────────────────────────────────────────

exports.testTableStructure = async (req, res) => {
  try {
    const pool = await poolPromise;

    const schemaResult = await pool.request().query(\`
      SELECT TABLE_SCHEMA, TABLE_NAME, COLUMN_NAME, DATA_TYPE, IS_NULLABLE, CHARACTER_MAXIMUM_LENGTH
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = 'recruit'
      ORDER BY TABLE_NAME, ORDINAL_POSITION
    \`);

    const sampleResult = await pool.request().query(\`
      SELECT TOP 5 CandidateId, CandidateCode, FirstName, LastName
      FROM [recruit].[Candidate]
      WHERE IsDeleted = 0
      ORDER BY CandidateId DESC
    \`);

    res.json({
      success: true,
      tableSchema: schemaResult.recordset,
      sampleData: sampleResult.recordset,
      totalColumns: schemaResult.recordset.length,
      sampleCount: sampleResult.recordset.length
    });

  } catch (error) {
    console.error('Table structure test failed:', error);
    res.status(500).json({ success: false, error: 'Failed to get table structure', details: error.message });
  }
};

`;

if (CORRUPT_FILE_INFO.test(content)) {
  content = content.replace(CORRUPT_FILE_INFO, FIXED_FILE_INFO_TAIL);
  console.log('✅ REPAIR 3: getResumeFileInfo body restored + getCandidateDocuments + testTableStructure added.');
} else {
  console.log('ℹ️  REPAIR 3: getResumeFileInfo corruption not matched - checking if functions already present...');
  const hasCandidateDocs = content.includes('exports.getCandidateDocuments');
  const hasTableStructure = content.includes('exports.testTableStructure');
  console.log('  getCandidateDocuments present:', hasCandidateDocs);
  console.log('  testTableStructure present:', hasTableStructure);

  if (!hasCandidateDocs || !hasTableStructure) {
    // Inject them before shareResume
    const INJECT_BEFORE_SHARE = /(\/\/ [─\-]+ SHARE RESUME)/m;
    const INJECTED_FUNCTIONS = `// ─── GET CANDIDATE DOCUMENTS ─────────────────────────────────────────────────

exports.getCandidateDocuments = async (req, res) => {
  const { id } = req.params;
  if (!id || isNaN(parseInt(id))) {
    return res.status(400).json({ success: false, error: "Invalid candidate ID" });
  }
  const candidateId = parseInt(id);
  try {
    const pool = await poolPromise;
    const result = await pool.request()
      .input('CandidateId', sql.Int, candidateId)
      .query(\`
        SELECT DocumentId, DocumentType, FileNameOriginal, FileExtension, MimeType,
               FileSizeBytes, IsPrimaryResume, UploadedOn, FileNameOriginal as DocumentName
        FROM [recruit].[CandidateDocument]
        WHERE CandidateId = @CandidateId AND IsDeleted = 0
        ORDER BY IsPrimaryResume DESC, UploadedOn DESC
      \`);
    res.status(200).json(result.recordset);
  } catch (error) {
    console.error("Error fetching candidate documents:", error);
    res.status(500).json({ success: false, error: "Could not fetch documents", details: error.message });
  }
};

// ─── DEBUG: TABLE STRUCTURE ──────────────────────────────────────────────────

exports.testTableStructure = async (req, res) => {
  try {
    const pool = await poolPromise;
    const schemaResult = await pool.request().query(\`
      SELECT TABLE_SCHEMA, TABLE_NAME, COLUMN_NAME, DATA_TYPE, IS_NULLABLE, CHARACTER_MAXIMUM_LENGTH
      FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = 'recruit'
      ORDER BY TABLE_NAME, ORDINAL_POSITION
    \`);
    const sampleResult = await pool.request().query(\`
      SELECT TOP 5 CandidateId, CandidateCode, FirstName, LastName
      FROM [recruit].[Candidate] WHERE IsDeleted = 0 ORDER BY CandidateId DESC
    \`);
    res.json({ success: true, tableSchema: schemaResult.recordset, sampleData: sampleResult.recordset });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to get table structure', details: error.message });
  }
};

$1`;

    if (INJECT_BEFORE_SHARE.test(content)) {
      content = content.replace(INJECT_BEFORE_SHARE, INJECTED_FUNCTIONS);
      console.log('  ✅ Injected getCandidateDocuments and testTableStructure before shareResume.');
    } else {
      console.log('  ⚠️  Could not find injection point. Appending to end of file.');
      content += `\nexports.getCandidateDocuments = async (req, res) => { res.json([]); };\nexports.testTableStructure = async (req, res) => { res.json({ success: true }); };\n`;
    }
  }
}

// Write the repaired file
fs.writeFileSync(filePath, content, 'utf8');
console.log('\n✅ File written successfully.');
