import React, { useState } from 'react';
import '../styles/DataTable.css';

export default function DataTable({ columns, data, onEdit, onDelete, onAdd }) {
  const [sortConfig, setSortConfig] = useState(null);
  const [filterText, setFilterText] = useState('');

  const handleSort = (key) => {
    setSortConfig(
      sortConfig?.key === key && sortConfig?.direction === 'asc'
        ? { key, direction: 'desc' }
        : { key, direction: 'asc' }
    );
  };

  const filteredData = data.filter((item) =>
    columns.some((col) =>
      String(item[col.key]).toLowerCase().includes(filterText.toLowerCase())
    )
  );

  const sortedData = [...filteredData].sort((a, b) => {
    if (!sortConfig) return 0;

    const aValue = a[sortConfig.key];
    const bValue = b[sortConfig.key];

    if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
    return 0;
  });

  return (
    <div className="datatable-container">
      <div className="datatable-header">
        <input
          type="text"
          placeholder="Search..."
          className="search-input"
          value={filterText}
          onChange={(e) => setFilterText(e.target.value)}
        />
        {onAdd && (
          <button className="btn-add" onClick={onAdd}>
            + Add New
          </button>
        )}
      </div>

      <div className="datatable-wrapper">
        <table className="datatable">
          <thead>
            <tr>
              {columns.map((col) => (
                <th
                  key={col.key}
                  onClick={() => handleSort(col.key)}
                  className={sortConfig?.key === col.key ? 'sorted' : ''}
                >
                  {col.label}
                  {sortConfig?.key === col.key && (
                    <span className="sort-icon">
                      {sortConfig.direction === 'asc' ? ' ↑' : ' ↓'}
                    </span>
                  )}
                </th>
              ))}
              {(onEdit || onDelete) && <th>Actions</th>}
            </tr>
          </thead>
          <tbody>
            {sortedData.map((row, index) => (
              <tr key={index}>
                {columns.map((col) => (
                  <td key={col.key}>
                    {col.render ? col.render(row[col.key], row) : row[col.key]}
                  </td>
                ))}
                {(onEdit || onDelete) && (
                  <td className="actions-cell">
                    {onEdit && (
                      <button className="btn-edit" onClick={() => onEdit(row)}>
                        Edit
                      </button>
                    )}
                    {onDelete && (
                      <button className="btn-delete" onClick={() => onDelete(row.id)}>
                        Delete
                      </button>
                    )}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
