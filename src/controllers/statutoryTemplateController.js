import StatutoryTemplate from "../models/statutoryTemplateModel.js";

// ========== CREATE TEMPLATE ==========
export const createTemplate = async (req, res) => {
  try {
    const templateData = req.body;

    // Validate required fields
    if (!templateData.templateName || !templateData.code || !templateData.category || !templateData.calculationMethod) {
      return res.status(400).json({
        message: "Missing required fields: templateName, code, category, and calculationMethod are required"
      });
    }

    // Check if code already exists
    const existing = await StatutoryTemplate.findOne({ code: templateData.code.toUpperCase() });
    if (existing) {
      return res.status(409).json({
        message: `Template with code '${templateData.code}' already exists`
      });
    }

    // Create template
    const template = new StatutoryTemplate({
      ...templateData,
      code: templateData.code.toUpperCase(),
      orgId: templateData.orgId || 'ORG001',
      createdBy: req.user?.id
    });

    // Validate template
    template.validate();

    await template.save();

    res.status(201).json({
      message: "Statutory template created successfully",
      template
    });
  } catch (error) {
    console.error("Error creating template:", error);
    res.status(500).json({
      message: "Failed to create template",
      error: error.message
    });
  }
};

// ========== GET ALL TEMPLATES ==========
export const getTemplates = async (req, res) => {
  try {
    const { orgId, category, isActive } = req.query;

    const query = {};
    if (orgId) query.orgId = orgId;
    if (category) query.category = category;
    if (isActive !== undefined) query.isActive = isActive === 'true';

    const templates = await StatutoryTemplate.find(query)
      .sort({ displayOrder: 1, templateName: 1 });

    res.status(200).json({
      count: templates.length,
      templates
    });
  } catch (error) {
    console.error("Error fetching templates:", error);
    res.status(500).json({
      message: "Failed to fetch templates",
      error: error.message
    });
  }
};

// ========== GET SINGLE TEMPLATE ==========
export const getTemplate = async (req, res) => {
  try {
    const { id } = req.params;

    const template = await StatutoryTemplate.findById(id);

    if (!template) {
      return res.status(404).json({
        message: "Template not found"
      });
    }

    res.status(200).json({ template });
  } catch (error) {
    console.error("Error fetching template:", error);
    res.status(500).json({
      message: "Failed to fetch template",
      error: error.message
    });
  }
};

// ========== UPDATE TEMPLATE ==========
export const updateTemplate = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const template = await StatutoryTemplate.findById(id);

    if (!template) {
      return res.status(404).json({
        message: "Template not found"
      });
    }

    // Update fields
    Object.keys(updateData).forEach(key => {
      if (key !== '_id' && key !== 'createdAt' && key !== 'createdBy') {
        template[key] = updateData[key];
      }
    });

    template.updatedBy = req.user?.id;

    // Validate before saving
    template.validate();

    await template.save();

    res.status(200).json({
      message: "Template updated successfully",
      template
    });
  } catch (error) {
    console.error("Error updating template:", error);
    res.status(500).json({
      message: "Failed to update template",
      error: error.message
    });
  }
};

// ========== DELETE TEMPLATE ==========
export const deleteTemplate = async (req, res) => {
  try {
    const { id } = req.params;

    const template = await StatutoryTemplate.findByIdAndDelete(id);

    if (!template) {
      return res.status(404).json({
        message: "Template not found"
      });
    }

    res.status(200).json({
      message: "Template deleted successfully"
    });
  } catch (error) {
    console.error("Error deleting template:", error);
    res.status(500).json({
      message: "Failed to delete template",
      error: error.message
    });
  }
};

// ========== TOGGLE TEMPLATE STATUS ==========
export const toggleTemplateStatus = async (req, res) => {
  try {
    const { id } = req.params;

    const template = await StatutoryTemplate.findById(id);

    if (!template) {
      return res.status(404).json({
        message: "Template not found"
      });
    }

    template.isActive = !template.isActive;
    template.updatedBy = req.user?.id;

    await template.save();

    res.status(200).json({
      message: `Template ${template.isActive ? 'activated' : 'deactivated'} successfully`,
      template
    });
  } catch (error) {
    console.error("Error toggling template status:", error);
    res.status(500).json({
      message: "Failed to toggle template status",
      error: error.message
    });
  }
};

// ========== GET ACTIVE TEMPLATES ==========
export const getActiveTemplates = async (req, res) => {
  try {
    const { orgId, category } = req.query;

    if (!orgId) {
      return res.status(400).json({
        message: "orgId is required"
      });
    }

    const templates = await StatutoryTemplate.getActiveTemplates(orgId, category);

    res.status(200).json({
      count: templates.length,
      templates
    });
  } catch (error) {
    console.error("Error fetching active templates:", error);
    res.status(500).json({
      message: "Failed to fetch active templates",
      error: error.message
    });
  }
};

// ========== IMPORT DEFAULT TEMPLATES ==========
export const importDefaultTemplates = async (req, res) => {
  try {
    const { orgId } = req.body;

    if (!orgId) {
      return res.status(400).json({
        message: "orgId is required"
      });
    }

    // Check if templates already exist
    const existing = await StatutoryTemplate.findOne({ orgId });
    if (existing) {
      return res.status(409).json({
        message: "Templates already exist for this organization. Use update to modify them."
      });
    }

    // Default templates
    const defaultTemplates = [
      // PF Template
      {
        templateName: "Provident Fund",
        code: "PF",
        category: "DEDUCTION",
        type: "STATUTORY",
        calculationMethod: "PERCENTAGE",
        percentageConfig: {
          employeePercentage: 12,
          employerPercentage: 12,
          calculateOn: "BASIC_SALARY"
        },
        hasCeiling: true,
        ceilingAmount: 15000,
        isAttendanceBased: true,
        hasEmployerContribution: true,
        employerConfig: {
          percentage: 12,
          split: [
            { name: "PF", percentage: 3.67 },
            { name: "Pension", percentage: 8.33 }
          ],
          calculateOn: "SAME_AS_EMPLOYEE"
        },
        applicability: {
          mandatory: true,
          conditions: []
        },
        orgId,
        createdBy: req.user?.id
      },
      
      // ESI Template
      {
        templateName: "Employee State Insurance",
        code: "ESI",
        category: "DEDUCTION",
        type: "STATUTORY",
        calculationMethod: "PERCENTAGE",
        percentageConfig: {
          employeePercentage: 0.75,
          employerPercentage: 3.25,
          calculateOn: "GROSS_SALARY"
        },
        isAttendanceBased: true,
        hasEmployerContribution: true,
        employerConfig: {
          percentage: 3.25,
          calculateOn: "SAME_AS_EMPLOYEE"
        },
        applicability: {
          mandatory: false,
          conditions: [
            {
              field: "GROSS_SALARY",
              operator: "<",
              value: 21000
            }
          ]
        },
        orgId,
        createdBy: req.user?.id
      },
      
      // PT Template (Maharashtra)
      {
        templateName: "Professional Tax",
        code: "PT",
        category: "DEDUCTION",
        type: "STATUTORY",
        calculationMethod: "SLAB_BASED",
        slabs: [
          { minAmount: 0, maxAmount: 10000, value: 0, isPercentage: false },
          { minAmount: 10001, maxAmount: 999999, value: 200, isPercentage: false }
        ],
        isAttendanceBased: false,
        isStateSpecific: true,
        stateConfigs: new Map([
          ['Maharashtra', {
            slabs: [
              { minAmount: 0, maxAmount: 10000, value: 0 },
              { minAmount: 10001, maxAmount: 999999, value: 200 }
            ],
            isActive: true
          }],
          ['Karnataka', {
            slabs: [
              { minAmount: 0, maxAmount: 15000, value: 0 },
              { minAmount: 15001, maxAmount: 999999, value: 200 }
            ],
            isActive: true
          }]
        ]),
        applicability: {
          mandatory: false,
          conditions: [
            {
              field: "GROSS_SALARY",
              operator: ">",
              value: 10000
            }
          ]
        },
        orgId,
        createdBy: req.user?.id
      }
    ];

    const created = await StatutoryTemplate.insertMany(defaultTemplates);

    res.status(201).json({
      message: "Default templates imported successfully",
      count: created.length,
      templates: created
    });
  } catch (error) {
    console.error("Error importing default templates:", error);
    res.status(500).json({
      message: "Failed to import default templates",
      error: error.message
    });
  }
};
