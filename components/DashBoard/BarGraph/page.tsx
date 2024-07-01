// IncomeChart.tsx
"use client";
import React from "react";
import dynamic from "next/dynamic";

const Chart = dynamic(() => import("react-apexcharts"), { ssr: false });

const IncomeChart: React.FC = () => {
  const options = {
    chart: {
      id: "bar-chart",
      toolbar: {
        show: false,
      },
    },
    xaxis: {
      categories: [
        "Jan", "Feb", "Mar", "Apr", "May", "Jun",
        "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
      ],
    },
    tooltip: {
      y: {
        formatter: function (val: number) {
          return `$${val.toLocaleString()}`;
        },
      },
    },
    fill: {
      type: 'gradient',
      gradient: {
        shadeIntensity: 1,
        opacityFrom: 0.7,
        opacityTo: 0.9,
        stops: [0, 50, 100],
        colorStops: [
          {
            offset: 0,
            color: "#DC2430",
            opacity: 1
          },
          {
            offset: 50,
            color: "#DB2379",
            opacity: 1
          },
          {
            offset: 100,
            color: "#7B4397",
            opacity: 1
          }
        ]
      }
    },
    dataLabels: {
      enabled: false,
    },
  };

  const series = [
    {
      name: "Income",
      data: [5000, 6000, 7000, 6500, 8000, 9000, 8500, 9500, 10000, 11000, 10500, 12000],
    },
  ];

  return (
    <div className="w-full dark:bg-gray-800 p-4 md:p-6">
      <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">Income Overview</h2>
      <div className="mb-5">
        <Chart options={options} series={series} type="bar" height={350} />
      </div>
    </div>
  );
};

export default IncomeChart;
