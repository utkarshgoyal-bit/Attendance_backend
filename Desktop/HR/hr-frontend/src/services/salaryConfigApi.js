import axios from "axios";

const API_BASE_URL = "http://localhost:5000/api";

export const fetchSalaryConfig = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/salary-config`);
    return response.data;
  } catch (error) {
    console.error("Error fetching salary config:", error);
    throw error;
  }
};

export const updateSalaryConfig = async (payload) => {
  try {
    const response = await axios.put(`${API_BASE_URL}/salary-config`, payload);
    return response.data;
  } catch (error) {
    console.error("Error updating salary config:", error);
    throw error;
  }
};
