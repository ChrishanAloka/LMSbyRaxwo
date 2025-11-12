import Admin from '../models/Admin.js';
import Employee from '../models/Employee.js';
import jwt from 'jsonwebtoken';

// Generate JWT Token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'your-secret-key', {
    expiresIn: '7d'
  });
};

// @desc    Register new admin
// @route   POST /api/admin/auth/register
// @access  Public
export const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Validate input
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields'
      });
    }

    // Check if admin already exists
    const adminExists = await Admin.findOne({ email });
    if (adminExists) {
      return res.status(400).json({
        success: false,
        message: 'Admin already exists with this email'
      });
    }

    // Create admin
    const admin = await Admin.create({
      name,
      email,
      password
    });

    res.status(201).json({
      success: true,
      message: 'Admin registered successfully',
      data: {
        admin: {
          id: admin._id,
          name: admin.name,
          email: admin.email,
          role: admin.role
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Login admin or employee
// @route   POST /api/admin/auth/login
// @access  Public
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password'
      });
    }

    let user = null;
    let userType = null;

    // Try to find as admin first
    const admin = await Admin.findOne({ email }).select('+password');
    
    if (admin) {
      // Check if admin is active
      if (admin.status !== 'active') {
        return res.status(401).json({
          success: false,
          message: 'Your account has been deactivated'
        });
      }

      // Check password
      const isPasswordCorrect = await admin.comparePassword(password);
      if (isPasswordCorrect) {
        user = admin;
        userType = 'admin';
      }
    } else {
      // Try to find as employee
      const employee = await Employee.findOne({ email }).select('+password');
      
      if (employee) {
        // Check if employee is active
        if (employee.status !== 'active') {
          return res.status(401).json({
            success: false,
            message: 'Your account has been deactivated'
          });
        }

        // Check password
        const isPasswordCorrect = await employee.comparePassword(password);
        if (isPasswordCorrect) {
          user = employee;
          userType = 'employee';
        }
      }
    }

    if (!user || !userType) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Generate token
    const token = generateToken(user._id);

    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          type: userType,
          permissions: user.permissions || {}
        },
        token
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get current admin
// @route   GET /api/admin/auth/me
// @access  Private
export const getMe = async (req, res) => {
  try {
    const admin = await Admin.findById(req.admin.id);
    
    res.status(200).json({
      success: true,
      data: {
        admin: {
          id: admin._id,
          name: admin.name,
          email: admin.email,
          role: admin.role,
          status: admin.status
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
