import React from 'react';
import { useTasks } from '../context/TaskContext';
import { Filter, SortDesc } from 'lucide-react';

const FilterPanel = () => {
  const { filters, setFilters, clearFilters } = useTasks();

  const handleFilterChange = (e) => {
    setFilters({ [e.target.name]: e.target.value });
  };

  return (
    <div className="filter-panel" style={{ display: 'flex', gap: '16px', marginBottom: '24px', flexWrap: 'wrap' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <Filter size={16} className="text-muted" />
        <select 
          name="priority" 
          value={filters.priority} 
          onChange={handleFilterChange}
          className="form-select"
          style={{ width: 'auto', padding: '8px 12px', fontSize: '13px' }}
        >
          <option value="all">All Priorities</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>

        <select 
          name="status" 
          value={filters.status} 
          onChange={handleFilterChange}
          className="form-select"
          style={{ width: 'auto', padding: '8px 12px', fontSize: '13px' }}
        >
          <option value="all">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="in-progress">In Progress</option>
          <option value="completed">Completed</option>
        </select>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginLeft: 'auto' }}>
        <SortDesc size={16} className="text-muted" />
        <select 
          name="sort" 
          value={filters.sort} 
          onChange={handleFilterChange}
          className="form-select"
          style={{ width: 'auto', padding: '8px 12px', fontSize: '13px' }}
        >
          <option value="newest">Newest First</option>
          <option value="oldest">Oldest First</option>
          <option value="priority">Priority (High to Low)</option>
          <option value="dueDate">Due Date (Earliest)</option>
        </select>

        <button 
          onClick={clearFilters}
          style={{ padding: '8px 16px', fontSize: '13px', background: 'transparent', color: 'var(--accent)', border: '1px solid var(--accent)', borderRadius: '8px', cursor: 'pointer' }}
        >
          Clear
        </button>
      </div>
    </div>
  );
};

export default FilterPanel;
