"use client";
import Link from "next/link";
import { FiHome, FiChevronRight } from "react-icons/fi";

interface BreadcrumbProps {
  pageName: string;
}

const Breadcrumb = ({ pageName }: BreadcrumbProps) => {
  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <h2 className="text-2xl font-bold text-surface-900 dark:text-white">
        {pageName}
      </h2>

      <nav>
        <ol className="flex items-center gap-2 text-sm">
          <li>
            <Link 
              className="flex items-center gap-2 text-surface-500 dark:text-surface-400 hover:text-primary-500 dark:hover:text-primary-400 transition-colors"
              href="/dashboard"
            >
              <FiHome className="w-4 h-4" />
              <span>Dashboard</span>
            </Link>
          </li>
          <li>
            <FiChevronRight className="w-4 h-4 text-surface-400" />
          </li>
          <li className="font-medium text-primary-500 dark:text-primary-400">
            {pageName}
          </li>
        </ol>
      </nav>
    </div>
  );
};

export default Breadcrumb;
