const { poolPromise, sql } = require("../../config/db");
const { uploadToS3, EMPLOYEE_DOCS_S3_FOLDER } = require("../../config/s3");
const path = require("path");

/**
 * Controller for handling [hrm].[EmployeeDocument] uploads and management
 */
exports.uploadEmployeeDocument = async (req, res) => {
  try {
    const { employeeId, documentType, notes } = req.body;
    const file = req.file;
    const loginUserId = req.user.id;

    if (!file) {
      return res.status(400).json({ success: false, message: "No file uploaded" });
    }

    if (!employeeId) {
      return res.status(400).json({ success: false, message: "EmployeeId is required" });
    }

    console.log(`📡 Starting S3 upload for employee: ${employeeId}, type: ${documentType}`);

    const pool = await poolPromise;

    // 1. Get EmployeeId for the uploader (Corrected Join for Business ID)
    const uploaderResult = await pool.request()
      .input("userId", sql.Int, loginUserId)
      .query(`
        SELECT e.EmployeeId 
        FROM [hrm].[Employee] e
        JOIN userinfo u ON u.EmployeeId = e.EmployeeCode
        WHERE u.id = @userId AND e.IsDeleted = 0
      `);

    const uploaderEmployeeId = uploaderResult.recordset.length > 0 
      ? uploaderResult.recordset[0].EmployeeId 
      : null;

    if (!uploaderEmployeeId) {
       console.warn(`⚠️ No EmployeeId found for UserId: ${loginUserId}. Auditing will use null.`);
    }

    // 2. Upload to S3
    const s3Result = await uploadToS3(
      file.buffer,
      file.originalname,
      file.mimetype,
      EMPLOYEE_DOCS_S3_FOLDER
    );

    if (!s3Result.success) {
      return res.status(500).json({ success: false, message: "S3 upload failed", error: s3Result.error });
    }

    // 3. Start Transaction for dual table insert
    const transaction = new sql.Transaction(pool);
    await transaction.begin();

    try {
      // Step A: Insert into [core].[Document]
      const fileExt = path.extname(file.originalname).replace('.', '');
      const coreDocResult = await transaction.request()
        .input("originalFileName", sql.NVarChar, file.originalname)
        .input("systemFileName", sql.NVarChar, s3Result.s3Key)
        .input("fileExtension", sql.NVarChar, fileExt)
        .input("mimeType", sql.NVarChar, file.mimetype)
        .input("fileSize", sql.BigInt, file.size)
        .input("storageProvider", sql.NVarChar, 'S3')
        .input("storageLocator", sql.NVarChar, s3Result.s3Key)
        .input("uploadedBy", sql.Int, uploaderEmployeeId)
        .query(`
          INSERT INTO [core].[Document] (
            OriginalFileName, SystemFileName, FileExtension, MimeType, 
            FileSizeBytes, StorageProvider, StorageLocator, UploadedByUserId, 
            UploadedAtUtc, IsDeleted
          )
          OUTPUT INSERTED.DocumentId
          VALUES (
            @originalFileName, @systemFileName, @fileExtension, @mimeType, 
            @fileSize, @storageProvider, @storageLocator, @uploadedBy, 
            SYSUTCDATETIME(), 0
          )
        `);

      const coreDocumentId = coreDocResult.recordset[0].DocumentId;

      // Step B: Insert into [hrm].[EmployeeDocument]
      const empDocResult = await transaction.request()
        .input("employeeId", sql.Int, parseInt(employeeId))
        .input("documentType", sql.NVarChar, documentType || 'General')
        .input("notes", sql.NVarChar, notes || null)
        .input("uploadedBy", sql.Int, uploaderEmployeeId)
        .input("coreDocumentId", sql.Int, coreDocumentId)
        .query(`
          INSERT INTO [hrm].[EmployeeDocument] (
            EmployeeId, DocumentType, IsActive, IsDeleted, 
            Notes, UploadedAtUtc, UploadedByUserId, UpdatedAtUtc, 
            UpdatedByUserId, CoreDocumentId
          )
          OUTPUT INSERTED.DocumentId
          VALUES (
            @employeeId, @documentType, 1, 0, 
            @notes, SYSUTCDATETIME(), @uploadedBy, SYSUTCDATETIME(), 
            @uploadedBy, @coreDocumentId
          )
        `);

      await transaction.commit();
      
      console.log('✅ Employee document saved to both tables. Core ID:', coreDocumentId);

      res.status(201).json({
        success: true,
        message: "Employee document uploaded successfully",
        data: {
          id: empDocResult.recordset[0].DocumentId,
          coreDocumentId,
          fileName: file.originalname,
          s3Url: s3Result.s3Url,
          documentType: documentType
        }
      });

    } catch (transError) {
      await transaction.rollback();
      throw transError;
    }

  } catch (error) {
    console.error("❌ Error uploading employee document:", error);
    res.status(500).json({
      success: false,
      message: "Server error during document upload",
      error: error.message
    });
  }
};

/**
 * Get all documents for a specific employee
 */
exports.getEmployeeDocuments = async (req, res) => {
  try {
    const { employeeId } = req.params;
    const pool = await poolPromise;
    
    const result = await pool.request()
      .input("employeeId", sql.Int, parseInt(employeeId))
      .query(`
        SELECT 
          ed.DocumentId, 
          ed.DocumentType, 
          ed.Notes, 
          ed.UploadedAtUtc, 
          ed.UploadedByUserId,
          d.OriginalFileName, 
          d.StorageLocator, 
          d.StorageProvider, 
          d.FileSizeBytes, 
          d.MimeType,
          d.FileExtension
        FROM [hrm].[EmployeeDocument] ed
        JOIN [core].[Document] d ON ed.CoreDocumentId = d.DocumentId
        WHERE ed.EmployeeId = @employeeId AND ed.IsDeleted = 0
        ORDER BY ed.UploadedAtUtc DESC
      `);

    res.status(200).json({
      success: true,
      data: result.recordset
    });
  } catch (error) {
    console.error("❌ Error fetching employee documents:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching documents"
    });
  }
};

/**
 * Soft delete an employee document
 */
exports.deleteEmployeeDocument = async (req, res) => {
  try {
    const { id } = req.params; // This is hrm.EmployeeDocument.DocumentId
    const loginUserId = req.user.id;
    const pool = await poolPromise;

    // 1. Get EmployeeId for auditing (Corrected Join)
    const uploaderResult = await pool.request()
      .input("userId", sql.Int, loginUserId)
      .query(`
        SELECT e.EmployeeId 
        FROM [hrm].[Employee] e
        JOIN userinfo u ON u.EmployeeId = e.EmployeeCode
        WHERE u.id = @userId AND e.IsDeleted = 0
      `);

    const uploaderEmployeeId = uploaderResult.recordset.length > 0 
      ? uploaderResult.recordset[0].EmployeeId 
      : null;

    // 2. Soft delete in both tables if linked
    const transaction = new sql.Transaction(pool);
    await transaction.begin();

    try {
      // Find CoreDocumentId
      const findResult = await transaction.request()
        .input("id", sql.Int, parseInt(id))
        .query("SELECT CoreDocumentId FROM [hrm].[EmployeeDocument] WHERE DocumentId = @id");

      if (findResult.recordset.length > 0) {
        const coreDocId = findResult.recordset[0].CoreDocumentId;

        // Update hrm record
        await transaction.request()
          .input("id", sql.Int, parseInt(id))
          .input("updatedBy", sql.Int, uploaderEmployeeId)
          .query(`
            UPDATE [hrm].[EmployeeDocument] 
            SET IsDeleted = 1, IsActive = 0, UpdatedByUserId = @updatedBy, UpdatedAtUtc = SYSUTCDATETIME()
            WHERE DocumentId = @id
          `);

        // Update core record
        if (coreDocId) {
          await transaction.request()
            .input("coreId", sql.Int, coreDocId)
            .query(`
              UPDATE [core].[Document] 
              SET IsDeleted = 1
              WHERE DocumentId = @coreId
            `);
        }
      }

      await transaction.commit();

      res.status(200).json({
        success: true,
        message: "Document deleted successfully"
      });
    } catch (transError) {
      await transaction.rollback();
      throw transError;
    }
  } catch (error) {
    console.error("❌ Error deleting employee document:", error);
    res.status(500).json({
      success: false,
      message: "Server error while deleting document"
    });
  }
};
