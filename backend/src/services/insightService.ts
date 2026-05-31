import prisma from './prisma';
import type { CountrySalaryInsight, PaginatedJobTitleResponse } from '../types';

// Simple in-memory cache with TTL for aggregate queries
const cache = new Map<string, { data: any; expiry: number }>();
const CACHE_TTL = 60_000; // 1 minute

function getCached<T>(key: string): T | undefined {
  const entry = cache.get(key);
  if (entry && Date.now() < entry.expiry) return entry.data as T;
  cache.delete(key);
  return undefined;
}

function setCache(key: string, data: any): void {
  cache.set(key, { data, expiry: Date.now() + CACHE_TTL });
}

export async function getSalaryInsightsByCountry(): Promise<CountrySalaryInsight[]> {
  const cached = getCached<CountrySalaryInsight[]>('by-country');
  if (cached) return cached;

  const results = await prisma.employee.groupBy({
    by: ['country'],
    _min: { salary: true },
    _max: { salary: true },
    _avg: { salary: true },
    _count: { id: true },
    orderBy: { country: 'asc' },
  });

  const data = results.map((r) => ({
    country: r.country,
    minSalary: r._min.salary !== null && typeof r._min.salary !== 'undefined' ? Number(r._min.salary) : 0,
    maxSalary: r._max.salary !== null && typeof r._max.salary !== 'undefined' ? Number(r._max.salary) : 0,
    avgSalary: r._avg.salary !== null && typeof r._avg.salary !== 'undefined' ? Math.round(Number(r._avg.salary) * 100) / 100 : 0,
    employeeCount: r._count.id,
  }));

  setCache('by-country', data);
  return data;
}

export async function getSalaryInsightsByJobTitle(
  country?: string,
  page: number = 1,
  limit: number = 20,
): Promise<PaginatedJobTitleResponse> {
  const cacheKey = `by-job-title:${country || 'all'}`;
  const cached = getCached<{ results: any[]; total: number }>(cacheKey);

  let results: any[];
  let total: number;

  if (cached) {
    results = cached.results;
    total = cached.total;
  } else {
    const where = country ? { country } : undefined;

    // Single pass: fetch all matching records (max 600 rows even without filter)
    const allResults = await prisma.employee.groupBy({
      by: ['jobTitle', 'country'],
      where,
      _avg: { salary: true },
      _count: { id: true },
      orderBy: [{ country: 'asc' }, { jobTitle: 'asc' }],
    });

    total = allResults.length;
    results = allResults;

    setCache(cacheKey, { results, total });
  }

  // Apply pagination in-memory — total is small enough (<600 rows)
  const start = (page - 1) * limit;
  const paginated = results.slice(start, start + limit);

  const data = paginated.map((r) => ({
    jobTitle: r.jobTitle,
    country: r.country,
    avgSalary: r._avg.salary !== null && typeof r._avg.salary !== 'undefined' ? Math.round(Number(r._avg.salary) * 100) / 100 : 0,
    employeeCount: r._count.id,
  }));

  return {
    data,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
}

export async function getTotalSalaryStats(): Promise<{
  totalEmployees: number;
  overallAvgSalary: number;
  totalCountries: number;
  totalJobTitles: number;
}> {
  const cached = getCached<{ totalEmployees: number; overallAvgSalary: number; totalCountries: number; totalJobTitles: number }>('stats');
  if (cached) return cached;

  const [empCount, avgResult, countries, jobTitles] = await Promise.all([
    prisma.employee.count(),
    prisma.employee.aggregate({ _avg: { salary: true } }),
    prisma.employee.findMany({ distinct: ['country'], select: { country: true } }),
    prisma.employee.findMany({ distinct: ['jobTitle'], select: { jobTitle: true } }),
  ]);

  const stats = {
    totalEmployees: empCount,
    overallAvgSalary: avgResult._avg.salary !== null && typeof avgResult._avg.salary !== 'undefined' ? Math.round(Number(avgResult._avg.salary) * 100) / 100 : 0,
    totalCountries: countries.length,
    totalJobTitles: jobTitles.length,
  };

  setCache('stats', stats);
  return stats;
}