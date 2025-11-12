import Employee from '../models/Employee.js';
import Role from '../models/Role.js';

// EMPLOYEE FUNCTIONS 

// @desc    Get all employees
// @route   GET /api/admin/employees
// @access  Private
export const getEmployees = async (req, res) => {
  try {
    const employees = await Employee.find().select('-password');
    
    res.status(200).json({
      success: true,
      count: employees.length,
      data: employees
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get single employee
// @route   GET /api/admin/employees/:id
// @access  Private
export const getEmployee = async (req, res) => {
  try {
    const employee = await Employee.findById(req.params.id).select('-password');
    
    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: employee
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Create employee
// @route   POST /api/admin/employees
// @access  Private
export const createEmployee = async (req, res) => {
  try {
    const { name, email, password, role, basicSalary } = req.body;

    // Validate input
    if (!name || !email || !password || !role) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields'
      });
    }

    // Check if employee already exists
    const employeeExists = await Employee.findOne({ email });
    if (employeeExists) {
      return res.status(400).json({
        success: false,
        message: 'Employee already exists with this email'
      });
    }

    // Create employee
    const employee = await Employee.create({
      name,
      email,
      password,
      role,
      basicSalary: basicSalary || 0
    });

    res.status(201).json({
      success: true,
      message: 'Employee created successfully',
      data: {
        id: employee._id,
        name: employee.name,
        email: employee.email,
        role: employee.role,
        status: employee.status
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Update employee
// @route   PUT /api/admin/employees/:id
// @access  Private
export const updateEmployee = async (req, res) => {
  try {
    const { name, email, password, role, status, basicSalary, commission } = req.body;

    let employee = await Employee.findById(req.params.id);

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found'
      });
    }

    // Update fields
    if (name) employee.name = name;
    if (email) employee.email = email;
    if (role) employee.role = role;
    if (status) employee.status = status;
    if (basicSalary !== undefined) employee.basicSalary = basicSalary;
    if (commission !== undefined) employee.commission = commission;
    if (password) {
      // Password will be automatically hashed by the pre-save middleware
      employee.password = password;
    }

    await employee.save();

    res.status(200).json({
      success: true,
      message: 'Employee updated successfully',
      data: {
        id: employee._id,
        name: employee.name,
        email: employee.email,
        role: employee.role,
        status: employee.status
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Delete employee
// @route   DELETE /api/admin/employees/:id
// @access  Private
export const deleteEmployee = async (req, res) => {
  try {
    const employee = await Employee.findById(req.params.id);

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found'
      });
    }

    await employee.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Employee deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

//  ROLE FUNCTIONS 

// @desc    Get available roles
// @route   GET /api/admin/employees/roles
// @access  Private
export const getRoles = async (req, res) => {
  try {
    const roles = await Role.find().sort({ name: 1 });
    
    res.status(200).json({
      success: true,
      data: roles.map(role => ({
        id: role._id,
        name: role.name
      }))
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Create new role
// @route   POST /api/admin/employees/roles
// @access  Private
export const createRole = async (req, res) => {
  try {
    const { name } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'Role name is required'
      });
    }

    // Check if role already exists
    const roleExists = await Role.findOne({ name: name.trim() });
    if (roleExists) {
      return res.status(400).json({
        success: false,
        message: 'Role already exists'
      });
    }

    const role = await Role.create({ name: name.trim() });

    res.status(201).json({
      success: true,
      message: 'Role created successfully',
      data: {
        id: role._id,
        name: role.name
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Delete role
// @route   DELETE /api/admin/employees/roles/:id
// @access  Private
export const deleteRole = async (req, res) => {
  try {
    const role = await Role.findById(req.params.id);

    if (!role) {
      return res.status(404).json({
        success: false,
        message: 'Role not found'
      });
    }

    // Check if any employees are using this role
    const employeesWithRole = await Employee.findOne({ role: role.name });
    if (employeesWithRole) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete role that is assigned to employees'
      });
    }

    await Role.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Role deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Update employee permissions
// @route   PUT /api/admin/employees/:id/permissions
// @access  Private
export const updatePermissions = async (req, res) => {
  try {
    const { permissions } = req.body;

    const employee = await Employee.findById(req.params.id);

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found'
      });
    }

    // Update permissions
    if (permissions) {
      employee.permissions = permissions;
      await employee.save();
    }

    res.status(200).json({
      success: true,
      message: 'Permissions updated successfully',
      data: {
        id: employee._id,
        name: employee.name,
        permissions: employee.permissions
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Update employee commission
// @route   PUT /api/admin/employees/:id/commission
// @access  Private
export const updateCommission = async (req, res) => {
  try {
    const { commission } = req.body;

    if (commission === undefined || commission < 0) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid commission amount (>= 0)'
      });
    }

    const employee = await Employee.findById(req.params.id);

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found'
      });
    }

    employee.commission = commission;
    await employee.save();

    res.status(200).json({
      success: true,
      message: 'Commission updated successfully',
      data: {
        id: employee._id,
        name: employee.name,
        commission: employee.commission
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
