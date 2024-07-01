import React from "react";
import { AiOutlineArrowUp } from "react-icons/ai";
import { BsEye } from "react-icons/bs";
import { HiOutlineShoppingBag } from "react-icons/hi";
import GraphSection from "@/components/DashBoard/Graph/page";
import TotalSales from "@/components/DashBoard/TotalSales/page";
import IncomeChart from "@/components/DashBoard/BarGraph/page";

const Dashboard: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-100 text-black dark:text-white">
      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Section 1: Recent Orders */}
          <div className="bg-white dark:bg-gray-700 dark:text-black dark:bg-primary p-4 rounded shadow-lg flex flex-col">
            <h3 className="text-base font-thin dark:text-white">
              Recent Orders
            </h3>
            <p className="text-xl font-bold dark:text-white mt-3">561</p>
            <div className="flex items-center pt-3 text-base font-semibold text-green-500 dark:text-green-500 text-center">
              11.95% <AiOutlineArrowUp className="w-3 h-3 ms-1" />
            </div>
            <GraphSection />
          </div>

          {/* Section 2: Weekly Sales */}
          <div className="bg-white dark:bg-gray-700 dark:text-black dark:bg-primary p-4 rounded shadow-lg flex flex-col">
            <h3 className="text-base font-thin dark:text-white">
              Weekly Sales
            </h3>
            <p className="text-xl font-bold dark:text-white mt-3">$25,000</p>
            <div className="flex items-center pt-3 text-base font-semibold text-green-500 dark:text-green-500 text-center">
              5.32% <AiOutlineArrowUp className="w-3 h-3 ms-1" />
            </div>
            <GraphSection />
          </div>

          {/* Section 3: Product Performance */}
          <div className="bg-white dark:bg-gray-700 dark:text-black dark:bg-primary p-4 rounded shadow-lg flex flex-col">
            <h3 className="text-base font-thin dark:text-white">
              Product Performance
            </h3>
            <p className="text-xl font-bold dark:text-white mt-3">
              Top Performing Products
            </p>
            <div className="flex items-center pt-3 text-base font-semibold text-green-500 dark:text-green-500 text-center">
              View Details <BsEye className="w-3 h-3 ms-1" />
            </div>
            <GraphSection />
          </div>

          {/* Section 4: Total Sales */}
          <div className="col-span-3 bg-white dark:bg-gray-700 dark:text-black dark:bg-primary p-4 rounded-lg shadow-md">
            <TotalSales />
          </div>

          {/* Section 5: Income */}
          <div className="col-span-3 dark:bg-gray-700 dark:text-black">
            <div className="flex justify-center items-start gap-4">
              <div className="w-full md:w-1/2 flex flex-col bg-white dark:bg-primary rounded-lg">
                <IncomeChart />
              </div>
              <div className="w-full md:w-1/2 mt-4 md:mt-0 dark:text-white bg-white dark:bg-primary rounded-lg p-4">
                <h2 className="text-xl font-light mb-6 text-gray-900">
                  Latest Transactions
                </h2>
                <div className="flex flex-col space-y-4">
                  <div className="flex items-center justify-between py-3 border-b border-gray-200 dark:border-gray-700">
                    <div className="flex flex-col">
                      <p className="text-lg font-semibold">Smartphone</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        22 June 2024
                      </p>
                    </div>
                    <p className="text-lg text-green-500 dark:text-green-500 font-semibold">
                      $650.00
                    </p>
                  </div>
                  <div className="flex items-center justify-between py-3 border-b border-gray-200 dark:border-gray-700">
                    <div className="flex flex-col">
                      <p className="text-lg font-semibold">Laptop</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        23 June 2024
                      </p>
                    </div>
                    <p className="text-lg text-red-500 dark:text-red-500 font-semibold">
                      -$1,200.00
                    </p>
                  </div>
                  <div className="flex items-center justify-between py-3 border-b border-gray-200 dark:border-gray-700">
                    <div className="flex flex-col">
                      <p className="text-lg font-semibold">Headphones</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        24 June 2024
                      </p>
                    </div>
                    <p className="text-lg text-green-500 dark:text-green-500 font-semibold">
                      $150.00
                    </p>
                  </div>
                  <div className="flex items-center justify-between py-3 border-b border-gray-200 dark:border-gray-700">
                    <div className="flex flex-col">
                      <p className="text-lg font-semibold">Tablet</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        25 June 2024
                      </p>
                    </div>
                    <p className="text-lg text-green-500 dark:text-green-500 font-semibold">
                      $300.00
                    </p>
                  </div>
                  {/* Add more transactions as needed */}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
