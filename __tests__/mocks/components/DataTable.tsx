import React from 'react';

/**
 * Mock implementation of the DataTable component for testing
 * This mock includes all the necessary data-testid attributes and event handlers
 * to support the ActiveJobsTable tests
 */
export const DataTable = jest.fn(({ 
  data, 
  columns, 
  onRowClick, 
  onViewDetails,
  onEdit,
  onArchive,
  onDeleteSelected,
  onArchiveSelected,
  onSegmentChange,
  onPageChange,
  onPageSizeChange,
  onSortChange,
  onFilterChange,
  onReset,
  segments,
  segmentValue,
  segmentCounts,
  stickyLastColumn,
  tableRef,
}) => {
  return (
    <div data-testid="data-table">
      {/* Mock segment controls with data-testid attributes */}
      <div className="segments">
        {segments?.map((segment: any, index: number) => (
          <button 
            key={index} 
            onClick={() => onSegmentChange && onSegmentChange(segment.value)}
            data-testid={`segment-${segment.value}`}
          >
            {segment.label}
          </button>
        ))}
      </div>
      
      {/* Mock table header with column titles and data-testid attributes */}
      <div className="table-header">
        {columns.map((column: { key: string; title: string }, index: number) => (
          <button 
            key={index} 
            onClick={() => onSortChange && onSortChange(column.key, 'asc')}
            data-testid={`column-header-${column.key}`}
          >
            {column.title}
          </button>
        ))}
      </div>
      
      {/* Mock table rows with data-testid attributes */}
      <div className="table-body">
        {data.map((item: any, rowIndex: number) => (
          <div 
            key={rowIndex} 
            className="table-row" 
            onClick={() => onRowClick && onRowClick(item)}
            data-testid={`row-${rowIndex}`}
          >
            {/* Mock row selection checkbox */}
            <input 
              type="checkbox" 
              data-testid={`row-checkbox-${rowIndex}`}
              onChange={(e) => {
                if (e.target.checked) {
                  if (onArchiveSelected) onArchiveSelected([item]);
                  if (onDeleteSelected) onDeleteSelected([item]);
                }
              }} 
            />
            
            {/* Mock row cells with data-testid attributes */}
            {columns.map((column: { key: string; title: string }, cellIndex: number) => (
              <div key={cellIndex} className="table-cell" data-testid={`cell-${rowIndex}-${column.key}`}>
                {/* Render the actual data from the item */}
                {String(item[column.key as keyof typeof item] || '')}
              </div>
            ))}
            
            {/* Mock row actions with data-testid attributes */}
            <div className="row-actions">
              <button 
                data-testid={`row-actions-${rowIndex}`}
                onClick={(e) => {
                  e.stopPropagation();
                }}
              >
                Actions
              </button>
              <button 
                data-testid={`view-details-${rowIndex}`} 
                onClick={(e) => {
                  e.stopPropagation();
                  if (onViewDetails) onViewDetails(item);
                }}
              >
                View Details
              </button>
              <button 
                data-testid={`edit-${rowIndex}`} 
                onClick={(e) => {
                  e.stopPropagation();
                  if (onEdit) onEdit(item);
                }}
              >
                Edit
              </button>
              <button 
                data-testid={`archive-${rowIndex}`} 
                onClick={(e) => {
                  e.stopPropagation();
                  if (onArchive) onArchive(item);
                }}
              >
                Archive
              </button>
            </div>
          </div>
        ))}
      </div>
      
      {/* Mock pagination controls with data-testid attributes */}
      <div className="pagination-controls">
        <button 
          data-testid="pagination-first" 
          onClick={() => onPageChange && onPageChange(0)}
        >
          First
        </button>
        <button 
          data-testid="pagination-next" 
          onClick={() => onPageChange && onPageChange(1)}
        >
          Next
        </button>
        <select 
          data-testid="page-size-select"
          onChange={(e) => onPageSizeChange && onPageSizeChange(Number(e.target.value))}
        >
          <option value="10">10</option>
          <option value="25">25</option>
          <option value="50">50</option>
        </select>
      </div>
      
      {/* Mock filter controls with data-testid attributes */}
      <div className="filter-controls">
        <button data-testid="filter-button">Filter</button>
        <button 
          data-testid="apply-filters" 
          onClick={() => onFilterChange && onFilterChange({ branch: ['West'] })}
        >
          Apply
        </button>
        <button 
          data-testid="reset-filters" 
          onClick={() => onReset && onReset()}
        >
          Reset
        </button>
      </div>
    </div>
  );
});

export default DataTable;
