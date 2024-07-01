// components/DashBoard/GraphSection.tsx
"use client";
import React from "react";
import dynamic from "next/dynamic";

const Chart = dynamic(() => import("react-apexcharts"), { ssr: false });

interface GraphSectionProps {
  height?: number;
  width?: number | string;
}

const GraphSection: React.FC<GraphSectionProps> = ({
  height = 100,
  width = "100%",
}) => {
  const options = {
    chart: {
      height,
      width,
      type: "area",
      fontFamily: "Inter, sans-serif",
      dropShadow: {
        enabled: false,
      },
      toolbar: {
        show: false,
      },
    },
    tooltip: {
      enabled: true,
      x: {
        show: false,
      },
    },
    fill: {
      type: "gradient",
      gradient: {
        opacityFrom: 0.55,
        opacityTo: 0,
        shade: "#F87171",
        gradientToColors: ["#F87171"],
      },
    },
    dataLabels: {
      enabled: false,
    },
    stroke: {
      width: 6,
    },
    grid: {
      show: false,
      strokeDashArray: 4,
      padding: {
        left: 2,
        right: 2,
        top: 0,
      },
    },
    xaxis: {
      categories: [
        "01 February",
        "02 February",
        "03 February",
        "04 February",
        "05 February",
        "06 February",
        "07 February",
      ],
      labels: {
        show: false,
      },
      axisBorder: {
        show: false,
      },
      axisTicks: {
        show: false,
      },
    },
    yaxis: {
      show: false,
    },
  };

  const series = [
    {
      name: "Total Revenue",
      data: [8000, 15000, 9000, 16000, 10000, 18000],
      color: "#F87171",
    },
  ];

  return (
    <div>
      <Chart
        options={options}
        series={series}
        type="area"
        height={height}
        width={width}
      />
    </div>
  );
};

export default GraphSection;
