export interface Project {
  id: string
  name: string
  description: string
  status: string
  statusColor: string
  coverage: number
  requirements: number
  scenarios: number
  testCases: number
  members: number
  date: string
  borderColor: string
}

export const projects: Project[] = [
  {
    id: '1',
    name: 'E-commerce Platform',
    description: 'Online shopping platform with payment integration',
    status: 'In Progress',
    statusColor: 'bg-cyan-100 text-cyan-700',
    coverage: 87,
    requirements: 24,
    scenarios: 42,
    testCases: 156,
    members: 4,
    date: 'Mar 15, 2026',
    borderColor: 'border-cyan-500'
  },
  {
    id: '2',
    name: 'Banking App',
    description: 'Mobile banking application for iOS and Android',
    status: 'Review',
    statusColor: 'bg-purple-100 text-purple-700',
    coverage: 92,
    requirements: 31,
    scenarios: 67,
    testCases: 243,
    members: 6,
    date: 'Mar 20, 2026',
    borderColor: 'border-purple-500'
  },
  {
    id: '3',
    name: 'Healthcare Portal',
    description: 'Patient management and appointment system',
    status: 'In Progress',
    statusColor: 'bg-green-100 text-green-700',
    coverage: 73,
    requirements: 18,
    scenarios: 28,
    testCases: 89,
    members: 3,
    date: 'Mar 25, 2026',
    borderColor: 'border-green-500'
  },
  {
    id: '4',
    name: 'CRM System',
    description: 'Customer relationship management platform',
    status: 'Planning',
    statusColor: 'bg-orange-100 text-orange-700',
    coverage: 45,
    requirements: 12,
    scenarios: 16,
    testCases: 54,
    members: 2,
    date: 'Apr 5, 2026',
    borderColor: 'border-orange-500'
  },
  {
    id: '5',
    name: 'Inventory Management',
    description: 'Warehouse and inventory tracking system',
    status: 'In Progress',
    statusColor: 'bg-pink-100 text-pink-700',
    coverage: 68,
    requirements: 21,
    scenarios: 35,
    testCases: 112,
    members: 5,
    date: 'Apr 10, 2026',
    borderColor: 'border-pink-500'
  },
  {
    id: '6',
    name: 'Analytics Dashboard',
    description: 'Business intelligence and reporting dashboard',
    status: 'In Progress',
    statusColor: 'bg-blue-100 text-blue-700',
    coverage: 81,
    requirements: 15,
    scenarios: 24,
    testCases: 78,
    members: 3,
    date: 'Apr 15, 2026',
    borderColor: 'border-blue-500'
  }
]
