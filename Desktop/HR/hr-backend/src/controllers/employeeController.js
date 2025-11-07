import Employee from "../models/employeeModel.js";

export const getEmployees = async (req, res) => {
  try {
    const employees = await Employee.find()
      .populate({
        path: "user",
        select: "firstName lastName email branch role",
      }) .populate("salaries");

    console.log("Employees fetched with user details:", employees);

    res.status(200).json(employees);
  } catch (error) {
    console.error("Error fetching employees:", error);
    res.status(500).json({
      message: "Failed to fetch employees",
      error: error.message,
    });
  }
};




