"use client";
import React, { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { FaInfoCircle, FaChevronDown, FaFileAlt } from "react-icons/fa";
import { getMonthlySales } from "@/api/orders";

const Chart = dynamic(() => import("react-apexcharts"), { ssr: false });

const TotalSales: React.FC = () => {
  const [selectedPeriod, setSelectedPeriod] = useState("Last week");

  const options = {
    chart: {
      id: "basic-bar",
    },
    xaxis: {
      categories: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
    },
    fill: {
      type: "gradient",
      gradient: {
        shadeIntensity: 1,
        opacityFrom: 0.7,
        opacityTo: 0.9,
        stops: [0, 100],
      },
    },
  };

  const series = [
    {
      name: "series-1",
      data: [30, 50, 35, 60, 45, 70, 40],
      color: "#ff0000",
    },
    {
      name: "series-2",
      data: [70, 40, 60, 20, 35, 40, 30],
      color: "#894BA9",
      fill: {
        opacity: 1,
      },
    },
  ];

  const handlePeriodChange = (period: string) => {
    setSelectedPeriod(period);
  };

  useEffect(() => {
    let access = localStorage.getItem("access");
    if (access) {
      getMonthlySales(access).then((data)=>{
        console.log(data.data)
      })
    }
  }, []);

  return (
    <div className="w-full dark:bg-gray-800 p-4 md:p-6">
      <div className="flex justify-between mb-5 relative">
        <div className="grid gap-4 grid-cols-2">
          <div>
            <h5 className="inline-flex items-center text-gray-500 dark:text-gray-400 leading-none font-normal mb-2">
              Clicks
              <FaInfoCircle
                data-popover-target="clicks-info"
                data-popover-placement="bottom"
                className="w-3 h-3 text-gray-400 hover:text-gray-900 dark:hover:text-white cursor-pointer ms-1"
              />
              <div
                data-popover
                id="clicks-info"
                role="tooltip"
                className="absolute z-10 invisible inline-block text-sm text-gray-500 transition-opacity duration-300 bg-white border border-gray-200 rounded-lg shadow-sm opacity-0 w-72 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-400"
              >
                <div className="p-3 space-y-2">
                  <h3 className="font-semibold text-gray-900 dark:text-white">
                    Clicks growth - Incremental
                  </h3>
                  <p>
                    Report helps navigate cumulative growth of community
                    activities. Ideally, the chart should have a growing trend,
                    as stagnating chart signifies a significant decrease of
                    community activity.
                  </p>
                  <h3 className="font-semibold text-gray-900 dark:text-white">
                    Calculation
                  </h3>
                  <p>
                    For each date bucket, the all-time volume of activities is
                    calculated. This means that activities in period n contain
                    all activities up to period n, plus the activities generated
                    by your community in period.
                  </p>
                  <a
                    href="#"
                    className="flex items-center font-medium text-blue-600 dark:text-blue-500 dark:hover:text-blue-600 hover:text-blue-700 hover:underline"
                  >
                    Read more
                    <FaChevronDown className="w-2 h-2 ms-1.5 rtl:rotate-180" />
                  </a>
                </div>
                <div data-popper-arrow></div>
              </div>
            </h5>
            <p className="text-gray-900 dark:text-white text-2xl leading-none font-bold">
              42,3k
            </p>
          </div>
          <div>
            <h5 className="inline-flex items-center text-gray-500 dark:text-gray-400 leading-none font-normal mb-2">
              CPC
              <FaInfoCircle
                data-popover-target="cpc-info"
                data-popover-placement="bottom"
                className="w-3 h-3 text-gray-400 hover:text-gray-900 dark:hover:text-white cursor-pointer ms-1"
              />
              <div
                data-popover
                id="cpc-info"
                role="tooltip"
                className="absolute z-10 invisible inline-block text-sm text-gray-500 transition-opacity duration-300 bg-white border border-gray-200 rounded-lg shadow-sm opacity-0 w-72 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-400"
              >
                <div className="p-3 space-y-2">
                  <h3 className="font-semibold text-gray-900 dark:text-white">
                    CPC growth - Incremental
                  </h3>
                  <p>
                    Report helps navigate cumulative growth of community
                    activities. Ideally, the chart should have a growing trend,
                    as stagnating chart signifies a significant decrease of
                    community activity.
                  </p>
                  <h3 className="font-semibold text-gray-900 dark:text-white">
                    Calculation
                  </h3>
                  <p>
                    For each date bucket, the all-time volume of activities is
                    calculated. This means that activities in period n contain
                    all activities up to period n, plus the activities generated
                    by your community in period.
                  </p>
                  <a
                    href="#"
                    className="flex items-center font-medium text-blue-600 dark:text-blue-500 dark:hover:text-blue-600 hover:text-blue-700 hover:underline"
                  >
                    Read more
                    <FaChevronDown className="w-2 h-2 ms-1.5 rtl:rotate-180" />
                  </a>
                </div>
                <div data-popper-arrow></div>
              </div>
            </h5>
            <p className="text-gray-900 dark:text-white text-2xl leading-none font-bold">
              $5.40
            </p>
          </div>
        </div>
        <div className="relative">
          <button
            id="dropdownDefaultButton"
            onClick={() => {
              const dropdown = document.getElementById("lastDaysdropdown");
              if (dropdown) {
                dropdown.classList.toggle("hidden");
              }
            }}
            type="button"
            className="px-3 py-2 inline-flex items-center text-sm font-medium text-gray-900 focus:outline-none bg-white rounded-lg border border-gray-200 hover:bg-gray-100 hover:text-blue-700 focus:z-10 focus:ring-4 focus:ring-gray-200 dark:focus:ring-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-600 dark:hover:text-white dark:hover:bg-gray-700"
          >
            {selectedPeriod}
            <FaChevronDown className="w-2.5 h-2.5 ms-2.5" />
          </button>
          <div
            id="lastDaysdropdown"
            className="z-20 hidden bg-white divide-y divide-gray-100 rounded-lg shadow w-44 dark:bg-gray-700 absolute"
            style={{ top: "100%" }}
          >
            <ul
              className="py-2 text-sm text-gray-700 dark:text-gray-200"
              aria-labelledby="dropdownDefaultButton"
            >
              <li>
                <a
                  href="#"
                  onClick={() => handlePeriodChange("Yesterday")}
                  className="block px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-600 dark:hover:text-white"
                >
                  Yesterday
                </a>
              </li>
              <li>
                <a
                  href="#"
                  onClick={() => handlePeriodChange("Today")}
                  className="block px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-600 dark:hover:text-white"
                >
                  Today
                </a>
              </li>
              <li>
                <a
                  href="#"
                  onClick={() => handlePeriodChange("Last 7 days")}
                  className="block px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-600 dark:hover:text-white"
                >
                  Last 7 days
                </a>
              </li>
              <li>
                <a
                  href="#"
                  onClick={() => handlePeriodChange("Last 30 days")}
                  className="block px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-600 dark:hover:text-white"
                >
                  Last 30 days
                </a>
              </li>
              <li>
                <a
                  href="#"
                  onClick={() => handlePeriodChange("Last 90 days")}
                  className="block px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-600 dark:hover:text-white"
                >
                  Last 90 days
                </a>
              </li>
            </ul>
          </div>
        </div>
      </div>

      <Chart options={options} series={series} type="area" height="350" />

      <div className="flex justify-between items-center text-gray-900 dark:text-white border-t border-gray-200 dark:border-gray-700 py-3.5">
        <div className="inline-flex items-center text-base font-medium text-gray-900 dark:text-white">
          <span className="w-2 h-2 bg-indigo-500 rounded-full ltr:mr-2 rtl:ml-2"></span>
          Current
        </div>
        <div className="flex items-center space-x-3 md:space-x-4 rtl:space-x-reverse">
          <a
            href="#"
            className="inline-flex justify-center text-sm font-medium text-center text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
          >
            <FaFileAlt className="w-4 h-4 ltr:mr-2 rtl:ml-2" />
            Download report
          </a>
        </div>
      </div>
    </div>
  );
};

export default TotalSales;
