import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { handleExport } from "../utils/exportUtils";
import { fetchEmployees, saveSalary, updateSalary } from "../services/employeeTableApi";
import { fetchSalaryConfig } from "../services/salaryConfigApi";
import { calculateNetPayable, calculateCTC } from "../utils/calculations";
import { ChevronLeft } from "lucide-react";

const EmployeeTable = () => {
  const [employees, setEmployees] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedMonth, setSelectedMonth] = useState("October");
  const [selectedYear, setSelectedYear] = useState("2025");
  const [selectedBranch, setSelectedBranch] = useState("All");
  const [sortBy, setSortBy] = useState(null);
  const [sortOrder, setSortOrder] = useState("asc");
  const [salaryConfig, setSalaryConfig] = useState(null);

  const getDaysInMonth = (monthName, year) => {
    const monthIndex = [
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"
    ].indexOf(monthName);
    return new Date(parseInt(year), monthIndex + 1, 0).getDate();
  };

  useEffect(() => {
    fetchEmployeesData();
    fetchSalaryConfigData();
  }, [selectedMonth, selectedYear, selectedBranch]);

  const fetchSalaryConfigData = async () => {
    try {
      const config = await fetchSalaryConfig();
      setSalaryConfig(config);
      console.log("Fetched salary config:", config);
    } catch (error) {
      console.error("Error fetching salary config:", error);
    }
  };

  const fetchEmployeesData = async () => {
    try {
      const data = await fetchEmployees();

      console.log("Fetched employees:", data);

      const filtered = data.map((emp) => {
        const salary = emp.salaries?.find(s => s.month === selectedMonth && s.year === parseInt(selectedYear));
        return {
          employeeId: emp._id,
          name: `${emp.firstName || ""} ${emp.lastName || ""}`.trim(),
          base: emp.baseSalary || 5000,
          hra: emp.hra || 4000,
          conveyance: emp.conveyance || 1000,
          attendanceDays: salary ? salary.attendanceDays : 0,
          totalDays: salary ? salary.totalDays : getDaysInMonth(selectedMonth, selectedYear),
          netPayable: salary ? salary.netPayable : null,
          ctc: salary ? salary.ctc : null,
          salaryId: salary ? salary._id : null,
        };
      });

      setEmployees(filtered);
    } catch (error) {
      console.error("Error fetching employees:", error);
    }
  };



  const updateEmployee = (index, field, value) => {
    const updatedEmployees = [...employees];
    updatedEmployees[index][field] = field === "attendanceDays" ? parseInt(value) || 0 : parseFloat(value) || 0;
    setEmployees(updatedEmployees);
  };

  const [editing, setEditing] = useState(null);
  const [authModal, setAuthModal] = useState(false);
  const [authUsername, setAuthUsername] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [pendingEditIndex, setPendingEditIndex] = useState(null);

  const handleEdit = (index) => {
    setPendingEditIndex(index);
    setAuthModal(true);
  };

  const handleAuthSubmit = () => {
    // Simple authentication check (replace with actual API call if needed)
    if (authUsername === "admin" && authPassword === "password") {
      setEditing(pendingEditIndex);
      setAuthModal(false);
      setAuthUsername("");
      setAuthPassword("");
      setPendingEditIndex(null);
    } else {
      alert("Invalid username or password");
    }
  };

  const handleAuthCancel = () => {
    setAuthModal(false);
    setAuthUsername("");
    setAuthPassword("");
    setPendingEditIndex(null);
  };

  const handleSave = async (index) => {
    const emp = employees[index];
    setEditing(null);

    const payload = {
      employeeId: emp.employeeId,
      attendanceDays: emp.attendanceDays,
      totalDays: emp.totalDays,
      base: emp.base,
      hra: emp.hra,
      conveyance: emp.conveyance,
      netPayable: calculateNetPayable(emp, salaryConfig),
      ctc: calculateCTC(emp, salaryConfig),
      month: selectedMonth,
      year: selectedYear,
    };

    try {
      let data;
      if (emp.netPayable === null) {
        data = await saveSalary(payload);
        console.log("Salary saved:", data);
      } else {
        if (emp.salaryId) {
          data = await updateSalary(emp.salaryId, payload);
          console.log("Salary updated:", data);
        } else {
          console.error("Salary ID not found for update");
          return;
        }
      }
      const updatedEmployees = [...employees];
      updatedEmployees[index].netPayable = payload.netPayable;
      updatedEmployees[index].ctc = payload.ctc;
      setEmployees(updatedEmployees);
    } catch (error) {
      console.error("Error saving/updating salary:", error);
    }
  };

  const filteredAndSortedEmployees = employees
    .filter((emp) => emp.name.toLowerCase().includes(searchTerm.toLowerCase()))
    .filter((emp) => selectedBranch === "All" || emp.branch === selectedBranch)
    .sort((a, b) => {
      if (!sortBy) return 0;
      let aVal, bVal;
      if (sortBy === "name") {
        aVal = a.name.toLowerCase();
        bVal = b.name.toLowerCase();
      } else if (sortBy === "ctc") {
        aVal = a.ctc !== null ? a.ctc : calculateCTC(a, salaryConfig);
        bVal = b.ctc !== null ? b.ctc : calculateCTC(b, salaryConfig);
      } else if (sortBy === "netPayable") {
        aVal = a.netPayable !== null ? a.netPayable : calculateNetPayable(a, salaryConfig);
        bVal = b.netPayable !== null ? b.netPayable : calculateNetPayable(b, salaryConfig);
      }
      if (sortOrder === "asc") {
        return aVal > bVal ? 1 : -1;
      } else {
        return aVal < bVal ? 1 : -1;
      }
    });

  const handleSort = (column) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(column);
      setSortOrder("asc");
    }
  };

  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];
  const years = ["2023", "2024", "2025"];

  return (
    <>
      {authModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-96">
            <h2 className="text-xl font-bold mb-4">Authentication Required</h2>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700">Username</label>
              <input
                type="text"
                value={authUsername}
                onChange={(e) => setAuthUsername(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700">Password</label>
              <input
                type="password"
                value={authPassword}
                onChange={(e) => setAuthPassword(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div className="flex justify-end space-x-2">
              <button
                onClick={handleAuthCancel}
                className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
              >
                Cancel
              </button>
              <button
                onClick={handleAuthSubmit}
                className="px-4 py-2 bg-blue-950 text-white rounded hover:bg-blue-900"
              >
                Submit
              </button>
            </div>
          </div>
        </div>
      )}
      <div className="min-h-screen bg-gray-100 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white shadow-lg rounded-lg overflow-hidden">
            <div className="px-6 py-4 bg-white relative">
              <Link
                to="/home"
                className="absolute top-4 left-4 bg-gray-300 text-white py-2 px-2 rounded-full shadow-lg transform transition hover:scale-105 flex items-center gap-2"
              >
                <ChevronLeft className="w-5 h-5 text-black" />
              </Link>
              <h1 className="text-2xl font-bold text-black text-center">
                Employee Salary Details
              </h1>
            </div>
          <div className="px-6 py-4 bg-gray-50">
            <div className="flex flex-wrap gap-4 items-center justify-between">
              <div className="flex flex-wrap text-sm gap-4 items-center">
                <input
                  type="text"
                  placeholder="Search by name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="px-3 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="px-3 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {months.map((month) => (
                    <option key={month} value={month}>
                      {month}
                    </option>
                  ))}
                </select>
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(e.target.value)}
                  className="px-3 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {years.map((year) => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </select>
              </div>
              <button
                onClick={() => handleExport(selectedMonth, selectedYear, filteredAndSortedEmployees)}
                className="px-4 py-2 bg-blue-950 text-white rounded hover:bg-blue-900"
              >
                Export
              </button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Sr No.
                  </th>
                  <th
                    className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                    onClick={() => handleSort("name")}
                  >
                    Name {sortBy === "name" && (sortOrder === "asc" ? "↑" : "↓")}
                  </th>
                  <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Base
                  </th>
                  <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                    HRA
                  </th>
                  <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Conveyance
                  </th>
                  <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Attendance (Days)
                  </th>
                  <th
                    className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                    onClick={() => handleSort("netPayable")}
                  >
                    Net Payable {sortBy === "netPayable" && (sortOrder === "asc" ? "↑" : "↓")}
                  </th>
                  <th
                    className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                    onClick={() => handleSort("ctc")}
                  >
                    CTC {sortBy === "ctc" && (sortOrder === "asc" ? "↑" : "↓")}
                  </th>
                  <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredAndSortedEmployees.map((employee, index) => (
                  <tr
                    key={employee.employeeId}
                    className="hover:bg-gray-50 transition-colors duration-200"
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                      {index + 1}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {employee.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      ₹{employee.base.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      ₹{employee.hra.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      ₹{employee.conveyance.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {editing === index ? (
                        <div className="flex items-center space-x-2">
                          <input
                            type="number"
                            value={employee.attendanceDays}
                            onChange={(e) =>
                              updateEmployee(
                                index,
                                "attendanceDays",
                                e.target.value
                              )
                            }
                            className="w-16 px-2 py-1 border rounded"
                            min="0"
                            max={employee.totalDays}
                          />
                          <span>/ {employee.totalDays}</span>
                        </div>
                      ) : (
                        `${employee.attendanceDays}/${employee.totalDays}`
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-green-600">
                      ₹{(employee.netPayable !== null ? employee.netPayable : calculateNetPayable(employee, salaryConfig)).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-blue-600">
                      ₹{(employee.ctc !== null ? employee.ctc : calculateCTC(employee, salaryConfig)).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {editing === index ? (
                        <button
                          onClick={() => handleSave(index)}
                          className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600"
                        >
                          Save
                        </button>
                      ) : (
                        <button
                          onClick={() => handleEdit(index)}
                          className="px-3 py-1 bg-blue-950 text-white rounded hover:bg-blue-900"
                        >
                          {employee.netPayable === null ? "Add Attendance" : "Edit"}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      </div>
    </>
  );
};

export default EmployeeTable;
