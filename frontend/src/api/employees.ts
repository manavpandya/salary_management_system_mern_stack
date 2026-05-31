import api from './client';
import type { Employee, PaginatedResponse, EmployeeFilters, EmployeeFormData } from '../types';

/**
 * Fetch employees with pagination, search, filter, and sort support.
 * Sends only defined filter values to keep query strings clean.
 */
export async function fetchEmployees(
  filters: EmployeeFilters
): Promise<PaginatedResponse<Employee>> {
  const params: Record<string, string | number> = {};
  if (filters.page) params.page = filters.page;
  if (filters.limit) params.limit = filters.limit;
  if (filters.search) params.search = filters.search;
  if (filters.country) params.country = filters.country;
  if (filters.jobTitle) params.jobTitle = filters.jobTitle;
  if (filters.sortBy) params.sortBy = filters.sortBy;
  if (filters.sortOrder) params.sortOrder = filters.sortOrder;

  const { data } = await api.get<PaginatedResponse<Employee>>('/employees', { params });
  return data;
}

export async function fetchEmployee(id: number): Promise<Employee> {
  const { data } = await api.get<Employee>(`/employees/${id}`);
  return data;
}

export async function createEmployee(input: EmployeeFormData): Promise<Employee> {
  // Ensure salary is rounded to 2 decimals before sending
  const payload = { ...input, salary: Number(Number(input.salary).toFixed(2)) };
  const { data } = await api.post<Employee>('/employees', payload);
  return data;
}

export async function updateEmployee(id: number, input: Partial<EmployeeFormData>): Promise<Employee> {
  const payload: any = { ...input };
  if (typeof input.salary !== 'undefined') payload.salary = Number(Number(input.salary).toFixed(2));
  const { data } = await api.put<Employee>(`/employees/${id}`, payload);
  return data;
}

export async function deleteEmployee(id: number): Promise<void> {
  await api.delete(`/employees/${id}`);
}

/** Fetch distinct countries from the employee dataset */
export async function fetchCountries(): Promise<string[]> {
  const { data } = await api.get<string[]>('/employees/countries');
  return data;
}

/** Fetch distinct job titles from the employee dataset */
export async function fetchJobTitles(): Promise<string[]> {
  const { data } = await api.get<string[]>('/employees/job-titles');
  return data;
}