import './App.css';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import EmployeeTable from './pages/EmployeeTable';
import Login from './pages/login';
import AdminPanel from './pages/admin/AdminPanel';
import SalaryManagement from './pages/admin/SalaryManagement';

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/home" element={<Home />} />
          <Route path="/employees" element={<EmployeeTable />} />
          <Route path="/admin" element={<AdminPanel />} />
          <Route path="/admin/salary-management" element={<SalaryManagement />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
