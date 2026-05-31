import { useState } from 'react';
import { Pencil, Trash2 } from 'lucide-react';
import type { Employee } from '../../types';

interface Props {
  employees: Employee[];
  onEdit: (employee: Employee) => void;
  onDelete: (id: number) => void;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  onSort: (field: string) => void;
}

const COLUMNS = [
  { key: 'fullName', label: 'Full Name' },
  { key: 'jobTitle', label: 'Job Title' },
  { key: 'country', label: 'Country' },
  { key: 'salary', label: 'Salary' },
] as const;

export default function EmployeeTable({ employees, onEdit, onDelete, sortBy, sortOrder, onSort }: Props) {
  const [confirmDelete, setConfirmDelete] = useState<number | null>(null);

  const formatSalary = (salary: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(salary);

  const SortIcon = ({ field }: { field: string }) => {
    if (sortBy !== field) return <span className="ml-1 text-gray-300">↕</span>;
    return <span className="ml-1 text-blue-600">{sortOrder === 'asc' ? '↑' : '↓'}</span>;
  };

  if (employees.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        No employees found. Try adjusting your filters or add a new employee.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            {COLUMNS.map((col) => (
              <th
                key={col.key}
                onClick={() => onSort(col.key)}
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:text-gray-700 select-none"
              >
                <span className="inline-flex items-center">
                  {col.label}
                  <SortIcon field={col.key} />
                </span>
              </th>
            ))}
            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {employees.map((emp) => (
            <tr key={emp.id} className="hover:bg-gray-50">
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                {emp.fullName}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{emp.jobTitle}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{emp.country}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatSalary(emp.salary)}</td>
              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => onEdit(emp)}
                    className="text-blue-600 hover:text-blue-900 p-1"
                    title="Edit"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  {confirmDelete === emp.id ? (
                    <div className="flex gap-1">
                      <button
                        onClick={() => { onDelete(emp.id); setConfirmDelete(null); }}
                        className="text-red-600 hover:text-red-900 text-xs px-2 py-1 border border-red-300 rounded"
                      >
                        Confirm
                      </button>
                      <button
                        onClick={() => setConfirmDelete(null)}
                        className="text-gray-600 hover:text-gray-900 text-xs px-2 py-1 border border-gray-300 rounded"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setConfirmDelete(emp.id)}
                      className="text-red-600 hover:text-red-900 p-1"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}