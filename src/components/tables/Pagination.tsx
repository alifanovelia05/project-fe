type PaginationProps = {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
};

const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  onPageChange,
}) => {
  const getPageItems = () => {
    const pages: Array<number | string> = [];
    if (totalPages <= 5) {
      for (let i = 1; i <= totalPages; i += 1) pages.push(i);
      return pages;
    }

    const windowStart = Math.max(2, currentPage - 1);
    const windowEnd = Math.min(totalPages - 1, currentPage + 1);

    pages.push(1);
    if (windowStart > 2) pages.push("...");
    for (let i = windowStart; i <= windowEnd; i += 1) pages.push(i);
    if (windowEnd < totalPages - 1) pages.push("...");
    pages.push(totalPages);

    return pages;
  };

  const pageItems = getPageItems();

  const prevDisabled = currentPage === 1;
  const nextDisabled = currentPage === totalPages;

  const navButtonClass = (disabled: boolean) =>
    `p-2 rounded-lg border transition-all ${disabled
      ? "bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-600 cursor-not-allowed border-gray-200 dark:border-gray-700"
      : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700"
    }`;

  const pageButtonClass = (item: number | string) => {
    if (item === currentPage) {
      return "w-10 h-10 rounded-lg transition-all font-medium bg-blue-600 text-white shadow-lg";
    }

    if (item === "...") {
      return "w-10 h-10 rounded-lg transition-all font-medium text-gray-500 dark:text-gray-400 cursor-default";
    }

    return "w-10 h-10 rounded-lg transition-all font-medium bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700";
  };

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={prevDisabled}
        aria-label="Previous page"
        className={navButtonClass(prevDisabled)}
      >
        ←
      </button>
      {pageItems.map((item, index) => (
        <button
          key={typeof item === "number" ? item : `ellipsis-${index}`}
          onClick={() => {
            if (typeof item === "number") onPageChange(item);
          }}
          disabled={item === "..."}
          className={pageButtonClass(item)}
        >
          {item}
        </button>
      ))}
      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={nextDisabled}
        aria-label="Next page"
        className={navButtonClass(nextDisabled)}
      >
        →
      </button>
    </div>
  );
};

export default Pagination;
