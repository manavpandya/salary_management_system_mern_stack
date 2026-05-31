import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

const COUNTRIES = [
  'United States', 'United Kingdom', 'Canada', 'Australia', 'Germany',
  'France', 'India', 'Japan', 'Brazil', 'Netherlands', 'Sweden', 'Singapore',
  'Spain', 'Italy', 'Mexico', 'South Korea', 'Switzerland', 'Poland',
  'Argentina', 'South Africa',
];

const JOB_TITLES = [
  'Software Engineer', 'Senior Software Engineer', 'Staff Engineer', 'Principal Engineer',
  'Engineering Manager', 'Product Manager', 'Senior Product Manager',
  'Data Scientist', 'Senior Data Scientist', 'Data Engineer',
  'DevOps Engineer', 'Site Reliability Engineer', 'Cloud Architect',
  'UX Designer', 'UI Designer', 'Product Designer',
  'QA Engineer', 'Security Engineer', 'Mobile Developer',
  'Frontend Developer', 'Backend Developer', 'Full Stack Developer',
  'Machine Learning Engineer', 'Business Analyst', 'Scrum Master',
  'Technical Lead', 'Solutions Architect', 'Database Administrator',
  'Network Engineer', 'IT Support Specialist',
];

const SALARY_RANGES: Record<string, [number, number]> = {
  'Software Engineer': [70000, 130000],
  'Senior Software Engineer': [110000, 180000],
  'Staff Engineer': [150000, 230000],
  'Principal Engineer': [180000, 280000],
  'Engineering Manager': [140000, 220000],
  'Product Manager': [90000, 160000],
  'Senior Product Manager': [130000, 200000],
  'Data Scientist': [85000, 150000],
  'Senior Data Scientist': [120000, 190000],
  'Data Engineer': [90000, 155000],
  'DevOps Engineer': [85000, 150000],
  'Site Reliability Engineer': [110000, 175000],
  'Cloud Architect': [130000, 210000],
  'UX Designer': [70000, 130000],
  'UI Designer': [65000, 120000],
  'Product Designer': [80000, 145000],
  'QA Engineer': [60000, 110000],
  'Security Engineer': [100000, 170000],
  'Mobile Developer': [80000, 145000],
  'Frontend Developer': [70000, 130000],
  'Backend Developer': [75000, 140000],
  'Full Stack Developer': [75000, 145000],
  'Machine Learning Engineer': [110000, 190000],
  'Business Analyst': [65000, 115000],
  'Scrum Master': [75000, 130000],
  'Technical Lead': [120000, 190000],
  'Solutions Architect': [130000, 210000],
  'Database Administrator': [75000, 135000],
  'Network Engineer': [65000, 120000],
  'IT Support Specialist': [45000, 80000],
};

const COUNTRY_MULTIPLIERS: Record<string, number> = {
  'United States': 1.0, 'Switzerland': 1.1, 'Australia': 0.85, 'Canada': 0.82,
  'United Kingdom': 0.88, 'Germany': 0.78, 'Netherlands': 0.80, 'Sweden': 0.82,
  'Singapore': 0.90, 'France': 0.72, 'Japan': 0.70, 'South Korea': 0.65,
  'Spain': 0.60, 'Italy': 0.58, 'Poland': 0.45, 'Brazil': 0.40,
  'Mexico': 0.38, 'Argentina': 0.30, 'India': 0.28, 'South Africa': 0.32,
};

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomElement<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function generateSalary(jobTitle: string, country: string): number {
  const [min, max] = SALARY_RANGES[jobTitle] ?? [50000, 100000];
  const multiplier = COUNTRY_MULTIPLIERS[country] ?? 0.5;
  const adjusted = Math.round(randomInt(min, max) * multiplier);
  return Math.round(adjusted / 500) * 500;
}

async function main() {
  console.log('🌱 Starting seed...');

  // Load name files
  const dataDir = path.join(__dirname, '..', 'data');
  const firstNames = fs.readFileSync(path.join(dataDir, 'first_names.txt'), 'utf-8')
    .split('\n').map((n) => n.trim()).filter(Boolean);
  const lastNames = fs.readFileSync(path.join(dataDir, 'last_names.txt'), 'utf-8')
    .split('\n').map((n) => n.trim()).filter(Boolean);

  console.log(`Loaded ${firstNames.length} first names, ${lastNames.length} last names`);

  // Clear existing data (idempotent)
  console.log('Clearing existing data...');
  await prisma.employee.deleteMany();

  const TOTAL = 10000;
  const BATCH_SIZE = 2000; // Increased to 2000 for fewer round trips

  // Pre-allocate the array to avoid repeated resizing
  // Pre-generate all employee data first for faster batch insertion
  let created = 0;
  const batches = Math.ceil(TOTAL / BATCH_SIZE);

  for (let batch = 0; batch < batches; batch++) {
    const count = Math.min(BATCH_SIZE, TOTAL - batch * BATCH_SIZE);
    const employees = new Array(count);

    for (let i = 0; i < count; i++) {
      const jobTitle = randomElement(JOB_TITLES);
      const country = randomElement(COUNTRIES);
      employees[i] = {
        fullName: `${randomElement(firstNames)} ${randomElement(lastNames)}`,
        jobTitle,
        country,
        // store salary as a decimal string to match Prisma Decimal type
        salary: String(generateSalary(jobTitle, country).toFixed(2)),
      };
    }

    const result = await prisma.employee.createMany({ data: employees });
    created += result.count;
    console.log(`  Inserted ${created}/${TOTAL} employees...`);
  }

  console.log(`✅ Seed complete: ${created} employees created`);
  console.log(`   Countries represented: ${COUNTRIES.length}`);
  console.log(`   Job titles available: ${JOB_TITLES.length}`);
}

main()
  .catch((err) => {
    console.error('❌ Seed failed:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });