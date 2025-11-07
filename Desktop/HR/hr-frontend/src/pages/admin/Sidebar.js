import { CircleDollarSign } from 'lucide-react';
import React from 'react';
import { Link } from 'react-router-dom';

const Sidebar = () => {
  return (
    <div className="h-screen bg-gray-100 text-blue-950 w-16 hover:w-52 transition-all duration-300 ease-in-out group border-r-2 border-gray-200 shadow-lg flex flex-col items-center">
      
      <div className="mt-8 flex justify-center">
        <img src="/logo2.png" alt="Logo" className="w-13 h-12 px-2" />
      </div>

      <div className="flex flex-col items-center mt-28 w-full">
        <Link
          to="/admin/salary-management"
          className="flex items-center w-full px-3 py-3 hover:bg-gray-200 transition-all duration-200"
        >

          <div className="flex justify-center w-14">
            <CircleDollarSign className="w-6 h-6 flex-shrink-0" />
          </div>
          
          <span className="ml-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap">
            Salary Management
          </span>
        </Link>
      </div>

    </div>
  );
};

export default Sidebar;
