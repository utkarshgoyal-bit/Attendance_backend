import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import CalculateEmi from './CalculateEmi';

const Home = () => {
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleLogout = () => {
    navigate('/');
  };

  const openModal = () => {
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  return (
    <div className="min-h-screen bg-gray-100  ">
      <div className="bg-white  h-32 flex items-center justify-center px-6   mb-4 rounded-lg shadow-lg relative">
        <div className="">
          <h1 className="text-4xl font-bold text-black text-center">
            Employee Management Portal
          </h1>
        </div>
        <button
          onClick={handleLogout}
          className="absolute top-4 right-4 bg-gray-500 text-white py-2 px-4 rounded-full shadow-lg transform transition hover:scale-105"
        >
          Logout
        </button>
      </div>


      <div className="container mx-auto px-4 py-8 mt-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-7xl  mx-auto">
          <div className="bg-white rounded-lg shadow-lg p-4  hover:shadow-xl transition-shadow duration-300">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-950 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">View Salary</h3>
              <p className="text-gray-600 mb-4">View and manage employee salaries</p>
              <Link
                to="/employees"
                className="bg-blue-950 hover:bg-blue-900 text-white font-bold py-2 px-4 rounded-lg inline-block"
              >
                View All Employee Salary
              </Link>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-4 hover:shadow-xl transition-shadow duration-300">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-950 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Admin Panel</h3>
              <p className="text-gray-600 mb-4">Manage system settings and users</p>
              <Link
                to="/admin"
                className="bg-blue-950 hover:bg-blue-900 text-white font-bold py-2 px-4 rounded-lg inline-block"
              >
                Access Admin Panel
              </Link>
            </div>
          </div>

          <div className="bg-white  rounded-lg shadow-lg p-4 hover:shadow-xl transition-shadow duration-300">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-950 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Calculate EMI</h3>
              <p className="text-gray-600 mb-4">Calculate loan EMI and payments</p>
              <button
                onClick={openModal}
                className="bg-blue-950 hover:bg-blue-900 text-white font-bold py-2 px-4 rounded-lg inline-block"
              >
                Calculate EMI
              </button>
            </div>
          </div>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-4 border-b">
              <h2 className="text-xl font-bold">Calculate EMI</h2>
              <button
                onClick={closeModal}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                &times;
              </button>
            </div>
            <div className="p-4">
              <CalculateEmi />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Home;
