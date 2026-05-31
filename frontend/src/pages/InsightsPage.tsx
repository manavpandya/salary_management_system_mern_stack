import { useState, useMemo, useCallback } from 'react';
import { ArrowUpDown, ArrowUp, ArrowDown, Globe2, Users, DollarSign, Briefcase } from 'lucide-react';
import { useSalaryByCountry, useSalaryByJobTitle, useSalaryStats } from '../hooks/useInsights';
import { useCountries } from '../hooks/useEmployees';
import type { SortOrder } from '../types';

type SortField = 'jobTitle' | 'country' | 'avgSalary' | 'employeeCount';

const formatCurrency = (v: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(v);

/** Renders the appropriate sort icon based on current sort state */
function SortIcon({ active, direction }: { active: boolean; direction: SortOrder }) {
  if (!active) return <ArrowUpDown className="w-3.5 h-3.5 ml-1 text-gray-300 inline" />;
  return direction === 'asc'
    ? <ArrowUp className="w-3.5 h-3.5 ml-1 text-blue-600 inline" />
    : <ArrowDown className="w-3.5 h-3.5 ml-1 text-blue-600 inline" />;
}

export default function InsightsPage() {
  const [selectedCountry, setSelectedCountry] = useState('');
  const [page, setPage] = useState(1);
  const [sortField, setSortField] = useState<SortField>('country');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  const [searchFilter, setSearchFilter] = useState('');

  const { data: countries = [] } = useCountries();
  const { data: countryInsights, isLoading: loadingCountries } = useSalaryByCountry();
  const { data: jobTitleResponse, isLoading: loadingJobTitles } = useSalaryByJobTitle(selectedCountry || undefined, page, 20);
  const { data: stats, isLoading: loadingStats } = useSalaryStats();

  // Client-side sort the paginated job title data within the current page
  const sortedData = useMemo(() => {
    if (!jobTitleResponse?.data) return [];
    const sorted = [...jobTitleResponse.data].sort((a, b) => {
      let cmp = 0;
      switch (sortField) {
        case 'jobTitle': cmp = a.jobTitle.localeCompare(b.jobTitle); break;
        case 'country': cmp = a.country.localeCompare(b.country); break;
        case 'avgSalary': cmp = a.avgSalary - b.avgSalary; break;
        case 'employeeCount': cmp = a.employeeCount - b.employeeCount; break;
      }
      return sortOrder === 'asc' ? cmp : -cmp;
    });
    // Client-side text filter on current page
    if (searchFilter.trim()) {
      const q = searchFilter.toLowerCase();
      return sorted.filter(
        (r) => r.jobTitle.toLowerCase().includes(q) || r.country.toLowerCase().includes(q)
      );
    }
    return sorted;
  }, [jobTitleResponse?.data, sortField, sortOrder, searchFilter]);

  const handleSort = useCallback((field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  }, [sortField, sortOrder]);

  const pagination = jobTitleResponse?.pagination;

  const statCards = stats ? [
    { label: 'Total Employees', value: stats.totalEmployees.toLocaleString(), icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Overall Avg Salary', value: formatCurrency(stats.overallAvgSalary), icon: DollarSign, color: 'text-green-600', bg: 'bg-green-50' },
    { label: 'Countries', value: stats.totalCountries.toString(), icon: Globe2, color: 'text-purple-600', bg: 'bg-purple-50' },
    { label: 'Job Titles', value: stats.totalJobTitles.toString(), icon: Briefcase, color: 'text-orange-600', bg: 'bg-orange-50' },
  ] : [];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Salary Insights</h1>

      {/* Summary Cards */}
      {loadingStats ? (
        <div className="flex justify-center py-6">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {statCards.map((card) => (
            <div key={card.label} className={`${card.bg} rounded-lg p-4 shadow-sm border border-gray-100`}>
              <div className="flex items-center gap-2 mb-2">
                <card.icon className={`w-5 h-5 ${card.color}`} />
                <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">{card.label}</span>
              </div>
              <p className={`text-2xl font-bold ${card.color}`}>{card.value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Country salary summary — always fits in one view (< 20 rows) */}
      <div className="rounded-lg border border-gray-200 bg-white shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Globe2 className="w-5 h-5 text-gray-500" />
            Salary Summary by Country
          </h2>
        </div>
        {loadingCountries ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Country</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Employees</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Min Salary</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Avg Salary</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Max Salary</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {countryInsights?.map((row) => (
                  <tr key={row.country} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-3 text-sm font-medium text-gray-900">{row.country}</td>
                    <td className="px-6 py-3 text-sm text-right text-gray-600">{row.employeeCount.toLocaleString()}</td>
                    <td className="px-6 py-3 text-sm text-right text-gray-600">{formatCurrency(row.minSalary)}</td>
                    <td className="px-6 py-3 text-sm text-right font-semibold text-gray-900">{formatCurrency(row.avgSalary)}</td>
                    <td className="px-6 py-3 text-sm text-right text-gray-600">{formatCurrency(row.maxSalary)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* By job title within country — paginated, sortable, searchable */}
      <div className="rounded-lg border border-gray-200 bg-white shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Briefcase className="w-5 h-5 text-gray-500" />
              Average Salary by Job Title
            </h2>
            <div className="flex gap-3">
              <input
                type="text"
                value={searchFilter}
                onChange={(e) => { setSearchFilter(e.target.value); setPage(1); }}
                placeholder="Search job title or country..."
                className="rounded-md border border-gray-300 px-3 py-1.5 text-sm w-48 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <select
                value={selectedCountry}
                onChange={(e) => { setSelectedCountry(e.target.value); setPage(1); }}
                className="rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="">All Countries</option>
                {countries.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
        {loadingJobTitles ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
          </div>
        ) : sortedData.length === 0 ? (
          <div className="text-center py-12 text-gray-500">No data available</div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    {([
                      { key: 'jobTitle', label: 'Job Title' },
                      { key: 'country', label: 'Country' },
                      { key: 'employeeCount', label: 'Employees' },
                      { key: 'avgSalary', label: 'Avg Salary' },
                    ] as { key: SortField; label: string }[]).map((col) => (
                      <th
                        key={col.key}
                        onClick={() => handleSort(col.key)}
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:text-gray-700 select-none"
                      >
                        <span className="inline-flex items-center">
                          {col.label}
                          <SortIcon active={sortField === col.key} direction={sortOrder} />
                        </span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {sortedData.map((row, i) => (
                    <tr key={`${row.jobTitle}-${row.country}-${i}`} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-3 text-sm font-medium text-gray-900">{row.jobTitle}</td>
                      <td className="px-6 py-3 text-sm text-gray-600">{row.country}</td>
                      <td className="px-6 py-3 text-sm text-right text-gray-600">{row.employeeCount.toLocaleString()}</td>
                      <td className="px-6 py-3 text-sm text-right font-semibold text-gray-900">{formatCurrency(row.avgSalary)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {pagination && pagination.totalPages > 1 && (
              <div className="flex items-center justify-between border-t border-gray-200 px-6 py-3 bg-gray-50">
                <p className="text-sm text-gray-600">
                  Showing {(pagination.page - 1) * pagination.limit + 1} to{' '}
                  {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
                  {pagination.total} records
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page <= 1}
                    className="rounded-md border border-gray-300 bg-white px-3 py-1 text-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                    disabled={page >= pagination.totalPages}
                    className="rounded-md border border-gray-300 bg-white px-3 py-1 text-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}