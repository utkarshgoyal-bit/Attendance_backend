const router = require('express').Router();
const Employee = require('../models/Employee');
const User = require('../models/User');
const { auth, hrAdmin } = require('../middleware/auth');
const upload = require('../middleware/upload');
const { uploadToCloudinary, deleteFromCloudinary } = require('../utils/cloudinary');

// GET All Employees
router.get('/', auth, async (req, res) => {
  try {
    const { page = 1, limit = 25, search, department, status } = req.query;
    
    const query = { orgId: req.orgId };
    
    // Search filter
    if (search) {
      query.$or = [
        { 'personal.firstName': new RegExp(search, 'i') },
        { 'personal.lastName': new RegExp(search, 'i') },
        { 'personal.email': new RegExp(search, 'i') },
        { eId: new RegExp(search, 'i') }
      ];
    }
    
    // Department filter
    if (department) query['professional.department'] = department;
    
    // Status filter
    if (status) query.status = status;
    
    const total = await Employee.countDocuments(query);
    const employees = await Employee.find(query)
      .populate('professional.department', 'name')
      .populate('professional.designation', 'name')
      .populate('professional.reportingManager', 'personal.firstName personal.lastName eId')
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });
    
    res.json({ 
      employees, 
      total, 
      page: parseInt(page), 
      pages: Math.ceil(total / limit) 
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET Single Employee
router.get('/:id', auth, async (req, res) => {
  try {
    const employee = await Employee.findOne({ _id: req.params.id, orgId: req.orgId })
      .populate('professional.department', 'name')
      .populate('professional.designation', 'name')
      .populate('professional.branch', 'name')
      .populate('professional.shift', 'name startTime endTime')
      .populate('professional.reportingManager', 'personal.firstName personal.lastName eId');
    
    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }
    
    res.json({ employee });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST Create Employee
router.post('/', auth, hrAdmin, async (req, res) => {
  try {
    const { personal, professional, statutory, banking, emergency, createUser } = req.body;
    
    // Generate Employee ID
    const lastEmployee = await Employee.findOne({ orgId: req.orgId }).sort({ eId: -1 });
    let newEId = 'EMP001';
    if (lastEmployee && lastEmployee.eId) {
      const lastNum = parseInt(lastEmployee.eId.replace(/\D/g, ''));
      newEId = 'EMP' + String(lastNum + 1).padStart(3, '0');
    }
    
    // Create employee
    const employee = new Employee({
      orgId: req.orgId,
      eId: newEId,
      personal,
      professional,
      statutory,
      banking,
      emergency,
      status: 'ACTIVE',
    });
    
    await employee.save();
    
    // Create user account if requested
    if (createUser && personal.email) {
      const userExists = await User.findOne({ email: personal.email });
      if (userExists) {
        return res.status(400).json({ message: 'User with this email already exists' });
      }
      
      const user = new User({
        email: personal.email,
        password: 'Welcome@123', // Default password
        role: 'EMPLOYEE',
        orgId: req.orgId,
        isFirstLogin: true,
        hasSecurityQuestions: false,
      });
      
      await user.save();
      
      // Link user to employee
      employee.userId = user._id;
      await employee.save();
    }
    
    res.status(201).json({ message: 'Employee created successfully', employee });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT Update Employee
router.put('/:id', auth, hrAdmin, async (req, res) => {
  try {
    const { personal, professional, statutory, banking, emergency } = req.body;
    
    const employee = await Employee.findOne({ _id: req.params.id, orgId: req.orgId });
    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }
    
    // Update fields
    if (personal) employee.personal = { ...employee.personal, ...personal };
    if (professional) employee.professional = { ...employee.professional, ...professional };
    if (statutory) employee.statutory = { ...employee.statutory, ...statutory };
    if (banking) employee.banking = { ...employee.banking, ...banking };
    if (emergency) employee.emergency = { ...employee.emergency, ...emergency };
    
    await employee.save();
    
    res.json({ message: 'Employee updated successfully', employee });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PATCH Update Status
router.patch('/:id/status', auth, hrAdmin, async (req, res) => {
  try {
    const { status } = req.body;
    
    const employee = await Employee.findOne({ _id: req.params.id, orgId: req.orgId });
    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }
    
    employee.status = status;
    await employee.save();
    
    // If status is INACTIVE or EXITED, deactivate user account
    if (['INACTIVE', 'EXITED'].includes(status) && employee.userId) {
      await User.findByIdAndUpdate(employee.userId, { isActive: false });
    }
    
    res.json({ message: 'Employee status updated', employee });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST Initiate Exit
router.post('/:id/exit', auth, hrAdmin, async (req, res) => {
  try {
    const { exitDate, reason, remarks } = req.body;
    
    const employee = await Employee.findOne({ _id: req.params.id, orgId: req.orgId });
    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }
    
    employee.status = 'NOTICE_PERIOD';
    employee.professional.exitDate = exitDate;
    employee.professional.exitReason = reason;
    employee.professional.exitRemarks = remarks;
    
    await employee.save();
    
    res.json({ message: 'Exit process initiated', employee });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE Soft Delete Employee
router.delete('/:id', auth, hrAdmin, async (req, res) => {
  try {
    const employee = await Employee.findOne({ _id: req.params.id, orgId: req.orgId });
    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }
    
    employee.isActive = false;
    await employee.save();
    
    // Deactivate user account
    if (employee.userId) {
      await User.findByIdAndUpdate(employee.userId, { isActive: false });
    }
    
    res.json({ message: 'Employee deactivated' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ========================================
// DOCUMENT MANAGEMENT ROUTES
// ========================================

// POST Upload Document
router.post('/:id/documents', auth, upload.single('file'), async (req, res) => {
  try {
    const { id } = req.params;
    const { category, name } = req.body;
    
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const employee = await Employee.findOne({ _id: id, orgId: req.orgId });
    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    // Upload to Cloudinary
    const result = await uploadToCloudinary(
      req.file.buffer,
      `org-${req.orgId}/employees/${employee.eId}`,
      category || 'general'
    );

    // Add document to employee
    const document = {
      name: name || req.file.originalname,
      category: category || 'OTHER',
      fileUrl: result.secure_url,
      publicId: result.public_id,
      fileType: req.file.mimetype,
      fileSize: req.file.size,
      uploadedAt: new Date(),
    };

    employee.documents.push(document);
    await employee.save();

    res.status(201).json({
      message: 'Document uploaded successfully',
      document: employee.documents[employee.documents.length - 1],
    });
  } catch (err) {
    console.error('Document upload error:', err);
    res.status(500).json({ message: err.message || 'Failed to upload document' });
  }
});

// GET Employee Documents
router.get('/:id/documents', auth, async (req, res) => {
  try {
    const { id } = req.params;
    
    const employee = await Employee.findOne({ _id: id, orgId: req.orgId }).select('documents');
    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    res.json({ documents: employee.documents || [] });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE Document
router.delete('/:id/documents/:docId', auth, async (req, res) => {
  try {
    const { id, docId } = req.params;
    
    const employee = await Employee.findOne({ _id: id, orgId: req.orgId });
    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    const document = employee.documents.id(docId);
    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }

    // Delete from Cloudinary
    if (document.publicId) {
      try {
        await deleteFromCloudinary(document.publicId);
      } catch (cloudinaryError) {
        console.error('Cloudinary deletion error:', cloudinaryError);
        // Continue anyway - remove from DB even if Cloudinary fails
      }
    }

    // Remove from employee
    employee.documents.pull(docId);
    await employee.save();

    res.json({ message: 'Document deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;