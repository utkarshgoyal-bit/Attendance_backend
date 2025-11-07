import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import Sidebar from "./Sidebar";
import {
  fetchSalaryConfig,
  updateSalaryConfig,
} from "../../services/salaryConfigApi";
import Box from '@mui/material/Box';
import Slider from '@mui/material/Slider';
import Tooltip from '@mui/material/Tooltip';
import { ChevronLeft } from "lucide-react";

const SalaryManagement = () => {
  const [pfEmployee, setPfEmployee] = useState(12);
  const [pfEmployer, setPfEmployer] = useState(3.67);
  const [pfPension, setPfPension] = useState(8.33);
  const [pfMin, setPfMin] = useState(15000);
  const [pfMax, setPfMax] = useState(15000);
  const [esiEmployee, setEsiEmployee] = useState(0.75);
  const [esiEmployer, setEsiEmployer] = useState(3.25);
  const [esiMin, setEsiMin] = useState(21000);
  const [esiMax, setEsiMax] = useState(21000);
  const [otherCharges, setOtherCharges] = useState(0);
  const [empContributionInput, setEmpContributionInput] = useState(12.75);
  const [employerContributionInput, setEmployerContributionInput] =
    useState(6.92);

  const empContribution = pfEmployee + esiEmployee;
  const employerContribution = pfEmployer + esiEmployer;
  const [pfSliderValue, setPfSliderValue] = useState([0, 15000]);
  const [esiSliderValue, setEsiSliderValue] = useState([0, 21000]);

  const handlePfSliderChange = (event, newValue) => {
    setPfSliderValue(newValue);
    setPfMin(newValue[0]);
    setPfMax(newValue[1]);
  };

  const handleEsiSliderChange = (event, newValue) => {
    setEsiSliderValue(newValue);
    setEsiMin(newValue[0]);
    setEsiMax(newValue[1]);
  };

  function valuetext(value) {
    return `₹${value}`;
  }

  useEffect(() => {
    const loadConfig = async () => {
      try {
        const config = await fetchSalaryConfig();
        if (config) {
          setPfEmployee(config.employeePF || 12);
          setPfEmployer(config.companyPF || 3.67);
          setPfPension(config.companyPension || 8.33);
          setPfMin(config.pfThresholdMin || 0);
          setPfMax(config.pfThresholdMax || 15000);
          setEsiEmployee(config.employeeESI || 0.75);
          setEsiEmployer(config.companyESI || 3.25);
          setEsiMin(config.esiThresholdMin || 0);
          setEsiMax(config.esiThresholdMax || 21000);
          setPfSliderValue([config.pfThresholdMin || 0, config.pfThresholdMax || 15000]);
          setEsiSliderValue([config.esiThresholdMin || 0, config.esiThresholdMax || 21000]);
        }
      } catch (error) {
        console.error("Failed to load salary config:", error);
      }
    };
    loadConfig();
  }, []);

  const handleSave = async () => {
    try {
      const payload = {
        employeePF: pfEmployee,
        employeeESI: esiEmployee,
        companyPF: pfEmployer,
        companyESI: esiEmployer,
        companyPension: pfPension,
        pfThresholdMin: pfMin,
        pfThresholdMax: pfMax,
        esiThresholdMin: esiMin,
        esiThresholdMax: esiMax,
      };
      await updateSalaryConfig(payload);
      alert("Salary settings saved successfully!");
    } catch (error) {
      console.error("Failed to save salary config:", error);
      alert("Failed to save salary settings.");
    }
  };
  
  return (
    <div className="min-h-screen bg-gray-100 flex">
      <Sidebar />

      <div className="flex-1 transition-all duration-300 ease-in-out">
        <div className="bg-white h-20 flex items-center justify-start px-6 m-4 rounded-lg shadow-lg">
          <Link
            to="/admin"
            className="bg-gray-300 text-black py-2 px-2 rounded-full shadow-lg transform transition hover:scale-105 flex items-center gap-2 mr-4"
          >
            <ChevronLeft className="w-5 h-5 " />
          </Link>
          <h1 className="text-4xl font-bold text-black">
            Salary Management Settings
          </h1>
        </div>

        <div className="container mx-auto px-4 py-8 mt-10">
          <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              Configure Salary Calculation Settings
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-800 mb-3">
                  Provident Fund (PF)
                </h3>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Employee Contribution (%)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={pfEmployee}
                      onChange={(e) =>
                        setPfEmployee(parseFloat(e.target.value) || 0)
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="12.00"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Employer Contribution (%)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={pfEmployer}
                      onChange={(e) =>
                        setPfEmployer(parseFloat(e.target.value) || 0)
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="3.67"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Pension Fund (%)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={pfPension}
                      onChange={(e) =>
                        setPfPension(parseFloat(e.target.value) || 0)
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="8.33"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      PF Threshold
                    </label>
                    <div className="flex justify-center">
                      <Tooltip title={`Min: ₹${pfMin} Max: ₹${pfMax}`}>
                        <Box sx={{ width: 300 }}>
                          <Slider
                            getAriaLabel={() => "PF Threshold range"}
                            value={pfSliderValue}
                            onChange={handlePfSliderChange}
                            valueLabelDisplay="auto"
                            getAriaValueText={valuetext}
                            min={0}
                            max={50000}
                          />
                        </Box>
                      </Tooltip>
                    </div>
                  </div>
                </div>
              </div>


              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-800 mb-3">
                  Employee State Insurance (ESI)
                </h3>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Employee Contribution (%)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={esiEmployee}
                      onChange={(e) =>
                        setEsiEmployee(parseFloat(e.target.value) || 0)
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="0.75"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Employer Contribution (%)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={esiEmployer}
                      onChange={(e) =>
                        setEsiEmployer(parseFloat(e.target.value) || 0)
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="3.25"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      ESI Threshold
                    </label>
                    <div className="flex justify-center">
                      <Tooltip title={`Min: ₹${esiMin} Max: ₹${esiMax}`}>
                        <Box sx={{ width: 300 }}>
                          <Slider
                            getAriaLabel={() => "ESI Threshold range"}
                            value={esiSliderValue}
                            onChange={handleEsiSliderChange}
                            valueLabelDisplay="auto"
                            getAriaValueText={valuetext}
                            min={0}
                            max={50000}
                          />
                        </Box>
                      </Tooltip>
                    </div>
                  </div>
                </div>
              </div>
            </div>


            <div className="bg-gray-50 rounded-lg p-4 mt-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-3">
                Additional Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white rounded-lg p-3 shadow-sm">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Emp Contribution (%)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={empContributionInput}
                    onChange={(e) =>
                      setEmpContributionInput(parseFloat(e.target.value) || 0)
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="12.75"
                  />
                </div>
                <div className="bg-white rounded-lg p-3 shadow-sm">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Employer Contribution (%)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={employerContributionInput}
                    onChange={(e) =>
                      setEmployerContributionInput(
                        parseFloat(e.target.value) || 0
                      )
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="6.92"
                  />
                </div>
                <div className="bg-white rounded-lg p-3 shadow-sm">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Other Charges (Company) (%)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={otherCharges}
                    onChange={(e) =>
                      setOtherCharges(parseFloat(e.target.value) || 0)
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="0.00"
                  />
                </div>
              </div>
            </div>

            <div className="mt-6 text-center">
              <button
                onClick={handleSave}
                className="bg-blue-950 hover:bg-blue-900 text-white font-bold py-2 px-6 rounded-lg"
              >
                Save Salary Settings
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SalaryManagement;
