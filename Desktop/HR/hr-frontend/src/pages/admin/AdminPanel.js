import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Sidebar from './Sidebar';
import { ChevronLeft, Users, DollarSign, Clock, FileText } from 'lucide-react';
import { fetchEmployees } from '../../services/employeeTableApi';
import { fetchSalaryConfig } from '../../services/salaryConfigApi';
import { calculateNetPayable } from '../../utils/calculations';

const AdminPanel = () => {
  const [employees, setEmployees] = useState([]);
  const [salaryConfig, setSalaryConfig] = useState(null);
  const [currentMonth, setCurrentMonth] = useState('October');
  const [currentYear, setCurrentYear] = useState('2025');

  useEffect(() => {
    const loadData = async () => {
      try {
        const [employeesData, configData] = await Promise.all([
          fetchEmployees(),
          fetchSalaryConfig()
        ]);
        setEmployees(employeesData);
        setSalaryConfig(configData);
      } catch (error) {
        console.error('Error loading dashboard data:', error);
      }
    };
    loadData();
  }, []);

  const totalEmployees = employees.length;

  const currentMonthSalaries = employees.map(emp => {
    const salary = emp.salaries?.find(s => s.month === currentMonth && s.year === parseInt(currentYear));
    return {
      ...emp,
      salary: salary || null
    };
  });

  const totalSalaryPaid = currentMonthSalaries
    .filter(emp => emp.salary)
    .reduce((sum, emp) => sum + (emp.salary.netPayable || 0), 0);

  const pendingSalaries = currentMonthSalaries.filter(emp => !emp.salary).length;

  const monthlyReports = currentMonthSalaries.filter(emp => emp.salary).length;

  return (
    <div className="min-h-screen bg-gray-100 flex">
      <Sidebar />
      <div className="flex-1 transition-all duration-300 ease-in-out ">
        <div className="bg-white h-20 flex items-center justify-start px-6 m-4 rounded-lg shadow-lg">
          <Link
            to="/home"
            className="bg-gray-300 text-black py-2 px-2 rounded-full shadow-lg transform transition hover:scale-105 flex items-center gap-2 mr-4"
          >
             <ChevronLeft className="w-5 h-5 " />
          </Link>
          <h1 className="text-4xl font-bold text-black">
            Admin Dashboard
          </h1>
        </div>

        <div className="container mx-auto px-4 py-8 mt-10">
          <div className="bg-white rounded-lg shadow-lg p-4 mb-6">
            <div className="flex flex-wrap gap-4 items-center">
              <label className="text-sm font-medium text-gray-700">Select Month/Year:</label>
              <select
                value={currentMonth}
                onChange={(e) => setCurrentMonth(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'].map(month => (
                  <option key={month} value={month}>{month}</option>
                ))}
              </select>
              <select
                value={currentYear}
                onChange={(e) => setCurrentYear(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {['2023', '2024', '2025'].map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow-lg p-6">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-blue-100 text-blue-600">
                  <Users className="w-8 h-8" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Employees</p>
                  <p className="text-2xl font-bold text-gray-900">{totalEmployees}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-lg p-6">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-green-100 text-green-600">
                  <DollarSign className="w-8 h-8" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Salary Paid ({currentMonth} {currentYear})</p>
                  <p className="text-2xl font-bold text-gray-900">₹{totalSalaryPaid.toLocaleString()}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-lg p-6">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-yellow-100 text-yellow-600">
                  <Clock className="w-8 h-8" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Pending Salaries ({currentMonth} {currentYear})</p>
                  <p className="text-2xl font-bold text-gray-900">{pendingSalaries}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-lg p-6">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-purple-100 text-purple-600">
                  <FileText className="w-8 h-8" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Processed Salaries ({currentMonth} {currentYear})</p>
                  <p className="text-2xl font-bold text-gray-900">{monthlyReports}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Quick Actions</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Link
                to="/employee-table"
                className="flex items-center p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
              >
                <Users className="w-6 h-6 text-blue-600 mr-3" />
                <div>
                  <p className="font-medium text-gray-900">Manage Employee Salaries</p>
                  <p className="text-sm text-gray-600">View and edit employee salary details</p>
                </div>
              </Link>
              <Link
                to="/admin/salary-management"
                className="flex items-center p-4 bg-green-50 rounded-lg hover:bg-green-100 transition-colors"
              >
                <DollarSign className="w-6 h-6 text-green-600 mr-3" />
                <div>
                  <p className="font-medium text-gray-900">Salary Management Settings</p>
                  <p className="text-sm text-gray-600">Configure PF, ESI, and other deductions</p>
                </div>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;
