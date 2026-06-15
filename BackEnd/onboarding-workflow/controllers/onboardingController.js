const sql = require('mssql');
const { dbConfig } = require('../../config/db');

// Get all clients
exports.getClients = async (req, res) => {
  try {
    await sql.connect(dbConfig);
    
    const result = await sql.query(`
      SELECT DISTINCT Id, ClientName, ClientCode, CreatedAt, UpdatedAt, IsActive
      FROM OnboardingClients
      WHERE IsActive = 1
      ORDER BY ClientName
    `);
    
    res.json({
      success: true,
      data: result.recordset
    });
  } catch (error) {
    console.error("Error getting clients:", error);
    res.status(500).json({ 
      success: false, 
      message: "Error fetching clients: " + error.message 
    });
  }
};

// Create new client
exports.createClient = async (req, res) => {
  const { clientName, clientCode } = req.body;

  try {
    await sql.connect(dbConfig);

    // Check if client already exists
    const checkResult = await sql.query(`
      SELECT Id FROM OnboardingClients 
      WHERE ClientName = N'${clientName.replace(/'/g, "''")}' AND IsActive = 1
    `);

    if (checkResult.recordset.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Client already exists"
      });
    }

    const result = await sql.query(`
      INSERT INTO OnboardingClients (ClientName, ClientCode, CreatedAt, UpdatedAt, IsActive)
      OUTPUT INSERTED.Id
      VALUES (
        N'${clientName.replace(/'/g, "''")}', 
        '${clientCode}', 
        GETDATE(), 
        GETDATE(), 
        1
      )
    `);

    res.status(201).json({
      success: true,
      message: "Client created successfully",
      data: { 
        Id: result.recordset[0].Id, 
        ClientName: clientName 
      }
    });
  } catch (error) {
    console.error("Error creating client:", error);
    res.status(500).json({ 
      success: false, 
      message: "Error creating client: " + error.message 
    });
  }
};

// Assign client to company
exports.assignClientToCompany = async (req, res) => {
  const { companyId, clientId } = req.body;

  try {
    await sql.connect(dbConfig);

    // Check if assignment exists
    const checkResult = await sql.query(`
      SELECT Id FROM CompanyClientAssignments 
      WHERE CompanyId = ${companyId} AND ClientId = ${clientId}
    `);

    if (checkResult.recordset.length > 0) {
      return res.json({
        success: true,
        message: "Client already assigned to this company",
        alreadyAssigned: true
      });
    }

    await sql.query(`
      INSERT INTO CompanyClientAssignments (CompanyId, ClientId, AssignedAt)
      VALUES (${companyId}, ${clientId}, GETDATE())
    `);

    res.json({
      success: true,
      message: "Client assigned to company successfully"
    });
  } catch (error) {
    console.error("Error assigning client:", error);
    res.status(500).json({ 
      success: false, 
      message: "Error assigning client: " + error.message 
    });
  }
};

// Get clients for a company
exports.getCompanyClients = async (req, res) => {
  const { companyId } = req.params;

  try {
    await sql.connect(dbConfig);
    
    const result = await sql.query(`
      SELECT c.Id, c.ClientName, c.ClientCode
      FROM CompanyClientAssignments a
      JOIN OnboardingClients c ON a.ClientId = c.Id
      WHERE a.CompanyId = ${companyId} AND c.IsActive = 1
      ORDER BY c.ClientName
    `);

    res.json({
      success: true,
      data: result.recordset,
      clients: result.recordset.map(c => c.ClientName)
    });
  } catch (error) {
    console.error("Error getting company clients:", error);
    res.status(500).json({ 
      success: false, 
      message: "Error fetching company clients: " + error.message 
    });
  }
};

// Get all templates
exports.getTemplates = async (req, res) => {
  try {
    await sql.connect(dbConfig);
    
    const result = await sql.query(`
      SELECT 
        t.Id, 
        t.TemplateName, 
        t.Description,
        t.CompanyId,
        t.ClientId,
        cmp.Name as CompanyName,
        cli.ClientName,
        (SELECT COUNT(*) FROM OnboardingSteps s WHERE s.TemplateId = t.Id AND s.IsActive = 1) as StepCount,
        t.CreatedAt,
        t.UpdatedAt
      FROM OnboardingTemplates t
      LEFT JOIN Companies cmp ON t.CompanyId = cmp.Id
      LEFT JOIN OnboardingClients cli ON t.ClientId = cli.Id
      WHERE t.IsActive = 1
      ORDER BY t.CreatedAt DESC
    `);

    // Remove duplicates by keeping only the latest for each company-client
    const uniqueTemplates = {};
    result.recordset.forEach(template => {
      const key = `${template.CompanyId}-${template.ClientId}`;
      if (!uniqueTemplates[key] || new Date(template.CreatedAt) > new Date(uniqueTemplates[key].CreatedAt)) {
        uniqueTemplates[key] = template;
      }
    });

    res.json({
      success: true,
      data: Object.values(uniqueTemplates)
    });
  } catch (error) {
    console.error("Error getting templates:", error);
    res.status(500).json({ 
      success: false, 
      message: "Error fetching templates: " + error.message 
    });
  }
};

// Get template by ID with steps
exports.getTemplateById = async (req, res) => {
  const { id } = req.params;

  try {
    await sql.connect(dbConfig);
    
    // Get template info
    const templateResult = await sql.query(`
      SELECT * FROM OnboardingTemplates WHERE Id = ${id} AND IsActive = 1
    `);
    
    if (templateResult.recordset.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Template not found"
      });
    }
    
    const template = templateResult.recordset[0];
    
    // Get steps
    const stepsResult = await sql.query(`
      SELECT 
        Id, 
        StepTitle as title, 
        StepDescription as description,
        StepOrder as [order], 
        StepType as [type], 
        IconName as icon,
        IsRequired as isRequired, 
        Instructions as instructions,
        EstimatedTimeDays as estimatedTimeDays
      FROM OnboardingSteps
      WHERE TemplateId = ${id} AND IsActive = 1
      ORDER BY StepOrder
    `);

    // Get documents for each step
    const steps = [];
    for (const step of stepsResult.recordset) {
      const docsResult = await sql.query(`
        SELECT DocumentName
        FROM StepDocuments
        WHERE StepId = ${step.Id}
      `);
      
      steps.push({
        id: step.Id,
        title: step.title,
        description: step.description,
        order: step.order,
        type: step.type,
        icon: step.icon,
        isRequired: step.isRequired === 1,
        instructions: step.instructions,
        estimatedTimeDays: step.estimatedTimeDays || 1,
        documents: docsResult.recordset.map(d => d.DocumentName)
      });
    }

    res.json({
      success: true,
      data: {
        id: template.Id,
        templateName: template.TemplateName,
        description: template.Description,
        companyId: template.CompanyId,
        clientId: template.ClientId,
        steps: steps
      }
    });
  } catch (error) {
    console.error("Error getting template:", error);
    res.status(500).json({ 
      success: false, 
      message: "Error fetching template: " + error.message 
    });
  }
};

// Save template - FIXED: Removed WorkflowType
exports.saveTemplate = async (req, res) => {
  const { templateName, description, companyId, clientId, steps, templateId } = req.body;

  console.log('Saving template:', { 
    templateName, 
    companyId, 
    clientId,
    stepsCount: steps?.length,
    templateId: templateId || 'new'
  });

  try {
    await sql.connect(dbConfig);
    
    let finalTemplateId = templateId;
    
    // Check if template exists for this company and client
    if (!templateId) {
      const checkResult = await sql.query(`
        SELECT Id FROM OnboardingTemplates 
        WHERE CompanyId = ${companyId} AND ClientId = ${clientId} AND IsActive = 1
      `);
      
      if (checkResult.recordset.length > 0) {
        finalTemplateId = checkResult.recordset[0].Id;
        // Soft delete old steps
        await sql.query(`
          UPDATE OnboardingSteps SET IsActive = 0 WHERE TemplateId = ${finalTemplateId}
        `);
      }
    }
    
    let newTemplateId;
    
    if (finalTemplateId) {
      // Update existing template
      await sql.query(`
        UPDATE OnboardingTemplates 
        SET TemplateName = N'${templateName.replace(/'/g, "''")}',
            Description = N'${description ? description.replace(/'/g, "''") : ''}',
            UpdatedAt = GETDATE()
        WHERE Id = ${finalTemplateId}
      `);
      newTemplateId = finalTemplateId;
    } else {
      // Create new template
      const templateResult = await sql.query(`
        INSERT INTO OnboardingTemplates (
          TemplateName, Description, CompanyId, ClientId,
          CreatedAt, UpdatedAt, IsActive
        )
        OUTPUT INSERTED.Id
        VALUES (
          N'${templateName.replace(/'/g, "''")}', 
          N'${description ? description.replace(/'/g, "''") : ''}', 
          ${companyId}, 
          ${clientId},
          GETDATE(), GETDATE(), 1
        )
      `);
      
      newTemplateId = templateResult.recordset[0].Id;
    }
    
    console.log('Template saved with ID:', newTemplateId);

    // Insert steps
    for (let i = 0; i < steps.length; i++) {
      const step = steps[i];
      
      const stepResult = await sql.query(`
        INSERT INTO OnboardingSteps (
          TemplateId, StepTitle, StepDescription, StepOrder,
          StepType, IconName, IsRequired, Instructions, EstimatedTimeDays,
          CreatedAt, UpdatedAt, IsActive
        )
        OUTPUT INSERTED.Id
        VALUES (
          ${newTemplateId}, 
          N'${step.title.replace(/'/g, "''")}', 
          N'${step.description ? step.description.replace(/'/g, "''") : ''}', 
          ${i + 1},
          '${step.type || 'document'}', 
          '${step.icon || 'LuFileText'}',
          ${step.isRequired ? 1 : 0}, 
          N'${step.instructions ? step.instructions.replace(/'/g, "''") : ''}',
          ${step.estimatedTimeDays || 1},
          GETDATE(), GETDATE(), 1
        )
      `);
      
      const stepId = stepResult.recordset[0].Id;

      // Insert documents if any
      if (step.documents && step.documents.length > 0) {
        for (const doc of step.documents) {
          await sql.query(`
            INSERT INTO StepDocuments (StepId, DocumentName, IsRequired, CreatedAt)
            VALUES (${stepId}, N'${doc.replace(/'/g, "''")}', 1, GETDATE())
          `);
        }
      }
    }

    res.json({
      success: true,
      message: finalTemplateId ? "Template updated successfully" : "Template created successfully",
      data: { Id: newTemplateId }
    });

  } catch (error) {
    console.error("Error saving template:", error);
    res.status(500).json({ 
      success: false, 
      message: "Error saving template: " + error.message 
    });
  }
};

// Delete template (soft delete)
exports.deleteTemplate = async (req, res) => {
  const { id } = req.params;

  try {
    await sql.connect(dbConfig);
    
    await sql.query(`
      UPDATE OnboardingTemplates 
      SET IsActive = 0, UpdatedAt = GETDATE()
      WHERE Id = ${id}
    `);

    res.json({
      success: true,
      message: "Template deleted successfully"
    });
  } catch (error) {
    console.error("Error deleting template:", error);
    res.status(500).json({ 
      success: false, 
      message: "Error deleting template: " + error.message 
    });
  }
};