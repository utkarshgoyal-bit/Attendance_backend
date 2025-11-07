import React, { useState, useEffect } from "react";
import { calculateCTC, calculateNetPayable } from "../utils/calculations";
import { fetchSalaryConfig } from "../services/salaryConfigApi";

const CalculateEmi = () => {
  const [base, setBase] = useState(15000);
  const [hra, setHra] = useState(4000);
  const [conveyance, setConveyance] = useState(1000);
  const [attendanceDays, setAttendanceDays] = useState(30);
  const [totalDays] = useState(30);
  const [salaryConfig, setSalaryConfig] = useState(null);

  useEffect(() => {
    fetchSalaryConfigData();
  }, []);

  const fetchSalaryConfigData = async () => {
    try {
      const config = await fetchSalaryConfig();
      setSalaryConfig(config);
      console.log("Fetched salary config:", config);
    } catch (error) {
      console.error("Error fetching salary config:", error);
    }
  };



  const calculateEMI = () => {
    const employee = { base, hra, conveyance, attendanceDays, totalDays };
    return calculateCTC(employee, salaryConfig);
  };

  const calculateNetPay = () => {
    const employee = { base, hra, conveyance, attendanceDays, totalDays };
    return calculateNetPayable(employee, salaryConfig);
  };

  return (
    <div className=" bg-gray-100 py-8 px-4 sm:px-6 lg:px-8 ">
      <div className=" mx-auto bg-white shadow-lg rounded-lg overflow-hidden">
        <div className="px-6 py-4 bg-white">
          <h1 className="text-2xl font-bold text-black">Calculate CTC</h1>
        </div>
        <div className="px-6 py-4">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Base Salary
              </label>
              <input
                type="number"
                value={base}
                onChange={(e) => setBase(parseFloat(e.target.value) || 0)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                HRA
              </label>
              <input
                type="number"
                value={hra}
                onChange={(e) => setHra(parseFloat(e.target.value) || 0)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Conveyance
              </label>
              <input
                type="number"
                value={conveyance}
                onChange={(e) => setConveyance(parseFloat(e.target.value) || 0)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Attendance Days
              </label>
              <input
                type="number"
                value={attendanceDays}
                onChange={(e) => setAttendanceDays(parseFloat(e.target.value) || 0)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div className="text-sm text-gray-600">
              Total Days: {totalDays}
            </div>
            <div className="bg-gray-50 p-4 rounded-md">
              <h2 className="text-lg font-semibold text-gray-900">
                Calculated CTC: ₹{calculateEMI().toLocaleString()}
              </h2>
              <h2 className="text-lg font-semibold text-gray-900">
                Calculated Net Payable: ₹{calculateNetPay().toLocaleString()}
              </h2>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CalculateEmi;
