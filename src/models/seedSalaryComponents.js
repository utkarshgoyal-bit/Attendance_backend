import mongoose from 'mongoose';
import dotenv from 'dotenv';
import SalaryComponent from '../models/salaryComponentModel.js';
import StatutoryConfig from '../models/statutoryConfigModel.js';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/hr_management';
const ORG_ID = '673db4bb4ea85b50f50f20d4'; // Your organization ID

// Default salary components
const defaultComponents = [
  // ========== EARNINGS ==========
  {
    orgId: ORG_ID,
    name: 'Basic Salary',
    code: 'BASE',
    category: 'EARNING',
    type: 'FIXED',
    calculationType: 'FLAT',
    isActive: true,
    isTaxable: true,
    isStatutory: false,
    isAttendanceBased: true,
    displayOrder: 1,
    applicableRoles: ['ALL'],
    applicableBranches: ['ALL'],
    description: 'Basic salary component - typically 40-50% of CTC. This is the primary component for PF/ESI calculations.'
  },
  {
    orgId: ORG_ID,
    name: 'House Rent Allowance',
    code: 'HRA',
    category: 'EARNING',
    type: 'PERCENTAGE',
    calculationType: 'PERCENTAGE_OF_BASE',
    value: 40,
    isActive: true,
    isTaxable: true,
    isStatutory: false,
    isAttendanceBased: true,
    displayOrder: 2,
    applicableRoles: ['ALL'],
    applicableBranches: ['ALL'],
    description: 'House Rent Allowance - typically 40-50% of basic salary. Partially tax-exempt subject to conditions.'
  },
  {
    orgId: ORG_ID,
    name: 'Conveyance Allowance',
    code: 'CONVEYANCE',
    category: 'EARNING',
    type: 'FIXED',
    calculationType: 'FLAT',
    value: 1600,
    isActive: true,
    isTaxable: false,
    isStatutory: false,
    isAttendanceBased: false,
    displayOrder: 3,
    applicableRoles: ['ALL'],
    applicableBranches: ['ALL'],
    description: 'Transportation allowance - up to ₹1,600/month is tax-exempt. Not attendance-based.'
  },
  {
    orgId: ORG_ID,
    name: 'Medical Allowance',
    code: 'MEDICAL',
    category: 'EARNING',
    type: 'FIXED',
    calculationType: 'FLAT',
    value: 1250,
    isActive: true,
    isTaxable: false,
    isStatutory: false,
    isAttendanceBased: false,
    displayOrder: 4,
    applicableRoles: ['ALL'],
    applicableBranches: ['ALL'],
    description: 'Medical allowance - up to ₹1,250/month is tax-exempt. Not attendance-based.'
  },
  {
    orgId: ORG_ID,
    name: 'Special Allowance',
    code: 'SPECIAL',
    category: 'EARNING',
    type: 'FIXED',
    calculationType: 'FLAT',
    isActive: true,
    isTaxable: true,
    isStatutory: false,
    isAttendanceBased: true,
    displayOrder: 5,
    applicableRoles: ['ALL'],
    applicableBranches: ['ALL'],
    description: 'Special allowance - balancing component to reach desired CTC. Fully taxable.'
  },
  {
    orgId: ORG_ID,
    name: 'Performance Bonus',
    code: 'BONUS',
    category: 'EARNING',
    type: 'VARIABLE',
    calculationType: 'FLAT',
    isActive: true,
    isTaxable: true,
    isStatutory: false,
    isAttendanceBased: false,
    displayOrder: 6,
    applicableRoles: ['ALL'],
    applicableBranches: ['ALL'],
    description: 'Variable performance-based bonus. Not affected by attendance. Added manually when applicable.'
  },
  {
    orgId: ORG_ID,
    name: 'Overtime Pay',
    code: 'OVERTIME',
    category: 'EARNING',
    type: 'VARIABLE',
    calculationType: 'FLAT',
    isActive: true,
    isTaxable: true,
    isStatutory: false,
    isAttendanceBased: false,
    displayOrder: 7,
    applicableRoles: ['EMPLOYEE'],
    applicableBranches: ['ALL'],
    description: 'Overtime compensation. Calculated separately and added as variable component.'
  },
  {
    orgId: ORG_ID,
    name: 'Mobile Reimbursement',
    code: 'MOBILE',
    category: 'EARNING',
    type: 'FIXED',
    calculationType: 'FLAT',
    value: 500,
    isActive: true,
    isTaxable: false,
    isStatutory: false,
    isAttendanceBased: false,
    displayOrder: 8,
    applicableRoles: ['MANAGER', 'HR_ADMIN', 'SUPER_ADMIN'],
    applicableBranches: ['ALL'],
    description: 'Mobile/communication allowance for managers and above. Not attendance-based.'
  },
  {
    orgId: ORG_ID,
    name: 'Leave Travel Allowance',
    code: 'LTA',
    category: 'EARNING',
    type: 'FIXED',
    calculationType: 'FLAT',
    isActive: false, // Typically paid once or twice a year
    isTaxable: false,
    isStatutory: false,
    isAttendanceBased: false,
    displayOrder: 9,
    applicableRoles: ['ALL'],
    applicableBranches: ['ALL'],
    description: 'Leave Travel Allowance - paid periodically for vacation travel. Tax-exempt with bills.'
  },

  // ========== DEDUCTIONS ==========
  {
    orgId: ORG_ID,
    name: 'Provident Fund',
    code: 'PF',
    category: 'DEDUCTION',
    type: 'PERCENTAGE',
    calculationType: 'PERCENTAGE_OF_BASE',
    value: 12,
    isActive: true,
    isTaxable: false,
    isStatutory: true,
    isAttendanceBased: false,
    displayOrder: 1,
    applicableRoles: ['ALL'],
    applicableBranches: ['ALL'],
    maxThreshold: 15000,
    description: 'Provident Fund deduction - 12% of basic salary (capped at ₹15,000). Statutory deduction.'
  },
  {
    orgId: ORG_ID,
    name: 'Employee State Insurance',
    code: 'ESI',
    category: 'DEDUCTION',
    type: 'PERCENTAGE',
    calculationType: 'PERCENTAGE_OF_GROSS',
    value: 0.75,
    isActive: true,
    isTaxable: false,
    isStatutory: true,
    isAttendanceBased: false,
    displayOrder: 2,
    applicableRoles: ['ALL'],
    applicableBranches: ['ALL'],
    maxThreshold: 21000,
    description: 'ESI deduction - 0.75% of gross salary (applicable if gross ≤ ₹21,000). Statutory deduction.'
  },
  {
    orgId: ORG_ID,
    name: 'Professional Tax',
    code: 'PT',
    category: 'DEDUCTION',
    type: 'FIXED',
    calculationType: 'FLAT',
    isActive: false, // Enable based on state
    isTaxable: false,
    isStatutory: true,
    isAttendanceBased: false,
    displayOrder: 3,
    applicableRoles: ['ALL'],
    applicableBranches: ['ALL'],
    description: 'Professional Tax - state-specific statutory deduction. Amount varies by state.'
  },
  {
    orgId: ORG_ID,
    name: 'Tax Deducted at Source',
    code: 'TDS',
    category: 'DEDUCTION',
    type: 'VARIABLE',
    calculationType: 'CUSTOM_FORMULA',
    isActive: false, // Enable when TDS is configured
    isTaxable: false,
    isStatutory: true,
    isAttendanceBased: false,
    displayOrder: 4,
    applicableRoles: ['ALL'],
    applicableBranches: ['ALL'],
    description: 'Income Tax deducted at source. Calculated based on annual income and tax slabs.'
  },
  {
    orgId: ORG_ID,
    name: 'Loan EMI',
    code: 'LOAN_EMI',
    category: 'DEDUCTION',
    type: 'VARIABLE',
    calculationType: 'FLAT',
    isActive: true,
    isTaxable: false,
    isStatutory: false,
    isAttendanceBased: false,
    displayOrder: 5,
    applicableRoles: ['ALL'],
    applicableBranches: ['ALL'],
    description: 'Loan EMI deduction from salary. Amount varies per employee based on loan agreement.'
  },
  {
    orgId: ORG_ID,
    name: 'Advance Recovery',
    code: 'ADVANCE',
    category: 'DEDUCTION',
    type: 'VARIABLE',
    calculationType: 'FLAT',
    isActive: true,
    isTaxable: false,
    isStatutory: false,
    isAttendanceBased: false,
    displayOrder: 6,
    applicableRoles: ['ALL'],
    applicableBranches: ['ALL'],
    description: 'Recovery of salary advance. Amount varies per employee.'
  },

  // ========== EMPLOYER CONTRIBUTIONS (for reporting) ==========
  {
    orgId: ORG_ID,
    name: 'Employer PF Contribution',
    code: 'EMPLOYER_PF',
    category: 'EMPLOYER_CONTRIBUTION',
    type: 'PERCENTAGE',
    calculationType: 'PERCENTAGE_OF_BASE',
    value: 12,
    isActive: true,
    isTaxable: false,
    isStatutory: true,
    isAttendanceBased: false,
    displayOrder: 1,
    applicableRoles: ['ALL'],
    applicableBranches: ['ALL'],
    maxThreshold: 15000,
    description: 'Employer contribution to PF - 12% of basic (3.67% to PF + 8.33% to Pension Fund).'
  },
  {
    orgId: ORG_ID,
    name: 'Employer ESI Contribution',
    code: 'EMPLOYER_ESI',
    category: 'EMPLOYER_CONTRIBUTION',
    type: 'PERCENTAGE',
    calculationType: 'PERCENTAGE_OF_GROSS',
    value: 3.25,
    isActive: true,
    isTaxable: false,
    isStatutory: true,
    isAttendanceBased: false,
    displayOrder: 2,
    applicableRoles: ['ALL'],
    applicableBranches: ['ALL'],
    maxThreshold: 21000,
    description: 'Employer contribution to ESI - 3.25% of gross salary.'
  }
];

// Default statutory configuration
const defaultStatutoryConfig = {
  orgId: ORG_ID,
  pf: {
    enabled: true,
    slabs: [
      {
        name: 'Standard',
        minSalary: 0,
        maxSalary: 15000,
        employeeContribution: 12,
        employerContribution: 12,
        pensionContribution: 8.33
      }
    ],
    ceiling: 15000,
    isMandatory: true,
    minEmployeesForApplicability: 20
  },
  esi: {
    enabled: true,
    slabs: [
      {
        name: 'Standard',
        minSalary: 0,
        maxSalary: 21000,
        employeeContribution: 0.75,
        employerContribution: 3.25
      }
    ],
    ceiling: 21000,
    isMandatory: true,
    minEmployeesForApplicability: 10
  },
  professionalTax: {
    enabled: false,
    // Configure based on your state
  },
  tds: {
    enabled: false,
    financialYear: '2024-25',
    regime: 'NEW',
    slabs: [
      { minIncome: 0, maxIncome: 300000, rate: 0 },
      { minIncome: 300001, maxIncome: 700000, rate: 5 },
      { minIncome: 700001, maxIncome: 1000000, rate: 10 },
      { minIncome: 1000001, maxIncome: 1200000, rate: 15 },
      { minIncome: 1200001, maxIncome: 1500000, rate: 20 },
      { minIncome: 1500001, maxIncome: null, rate: 30 }
    ],
    cess: 4,
    standardDeduction: {
      enabled: true,
      amount: 50000
    }
  },
  gratuity: {
    enabled: true,
    minServiceYears: 5,
    maxAmount: 2000000
  }
};

async function seedSalaryComponents() {
  try {
    console.log('🔄 Connecting to MongoDB...');
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB\n');

    // Clear existing data
    console.log('🗑️  Clearing existing salary components...');
    await SalaryComponent.deleteMany({ orgId: ORG_ID });
    console.log('✅ Cleared existing components\n');

    // Insert default components
    console.log('📦 Inserting default salary components...');
    const components = await SalaryComponent.insertMany(defaultComponents);
    console.log(`✅ Inserted ${components.length} salary components\n`);

    // Print inserted components
    console.log('📋 Created Components:\n');
    
    console.log('🟢 EARNINGS:');
    components
      .filter(c => c.category === 'EARNING')
      .forEach(c => {
        console.log(`   • ${c.name} (${c.code})`);
        console.log(`     Type: ${c.type} | Calculation: ${c.calculationType}`);
        console.log(`     Attendance-based: ${c.isAttendanceBased ? 'Yes' : 'No'}`);
        console.log('');
      });

    console.log('🔴 DEDUCTIONS:');
    components
      .filter(c => c.category === 'DEDUCTION')
      .forEach(c => {
        console.log(`   • ${c.name} (${c.code})`);
        console.log(`     Statutory: ${c.isStatutory ? 'Yes' : 'No'}`);
        console.log('');
      });

    console.log('🔵 EMPLOYER CONTRIBUTIONS:');
    components
      .filter(c => c.category === 'EMPLOYER_CONTRIBUTION')
      .forEach(c => {
        console.log(`   • ${c.name} (${c.code})`);
        console.log('');
      });

    // Setup statutory configuration
    console.log('\n⚙️  Setting up statutory configuration...');
    await StatutoryConfig.deleteOne({ orgId: ORG_ID });
    const config = await StatutoryConfig.create(defaultStatutoryConfig);
    console.log('✅ Created statutory configuration');
    
    console.log('\n📊 Statutory Configuration:');
    console.log(`   PF: ${config.pf.enabled ? 'Enabled' : 'Disabled'} | Ceiling: ₹${config.pf.ceiling}`);
    console.log(`   ESI: ${config.esi.enabled ? 'Enabled' : 'Disabled'} | Ceiling: ₹${config.esi.ceiling}`);
    console.log(`   PT: ${config.professionalTax.enabled ? 'Enabled' : 'Disabled'}`);
    console.log(`   TDS: ${config.tds.enabled ? 'Enabled' : 'Disabled'}`);

    console.log('\n✅ Seeding completed successfully!');
    console.log('\n📝 Next Steps:');
    console.log('   1. Create employee salary structures using these components');
    console.log('   2. Configure statutory settings if needed');
    console.log('   3. Run salary calculations for employees');
    console.log('   4. Review and approve salaries\n');

  } catch (error) {
    console.error('❌ Error seeding data:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

// Run the seed function
seedSalaryComponents();
