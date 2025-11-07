import Salary from "../models/salaryModel.js";
import Employee from "../models/employeeModel.js";
import SalaryConfig from "../models/salaryConfigModel.js";



export const createSalary = async (req, res) => {
  try {
    const {
      employeeId,
      attendanceDays,
      totalDays,
      base,
      hra,
      conveyance,
      netPayable,
      ctc,
      month,
      year,
    } = req.body;

    const salary = new Salary({
      employeeId,
      attendanceDays,
      totalDays,
      base,
      hra,
      conveyance,
      netPayable,
      ctc,
      month,
      year,
    });

    await salary.save();
    await Employee.findByIdAndUpdate(employeeId, {
      $push: { salaries: salary._id }
    });

    res.status(201).json({ message: "Salary saved successfully", salary });
  } catch (error) {
    console.error("Error creating salary:", error);
    res
      .status(500)
      .json({ message: "Failed to save salary", error: error.message });
  }
};

export const getSalaries = async (req, res) => {
  try {
    const salaries = await Salary.find().populate(
      "employeeId",
      "firstName lastName email"
    );
    res.status(200).json(salaries);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to fetch salaries", error: error.message });
  }
};

export const editSalary = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const updatedSalary = await Salary.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    }).populate("employeeId", "firstName lastName email");

    if (!updatedSalary) {
      return res.status(404).json({ message: "Salary not found" });
    }

    res.status(200).json({ message: "Salary updated successfully", salary: updatedSalary });
  } catch (error) {
    console.error("Error updating salary:", error);
    res.status(500).json({ message: "Failed to update salary", error: error.message });
  }
};


