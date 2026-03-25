import * as React from 'react'
import { PlusCircle, MoreVertical, User } from 'lucide-react'
import Button from './Button'

interface Project {
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

const projects: Project[] = [
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
    borderColor: 'border-cyan-500',
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
    borderColor: 'border-purple-500',
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
    borderColor: 'border-green-500',
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
    borderColor: 'border-orange-500',
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
    borderColor: 'border-pink-500',
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
    borderColor: 'border-blue-500',
  }
]

export default function Projects() {
  return (
    <div>
      {/* header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-white">Projects</h1>
          <p className="text-slate-400">Manage your QA projects and track progress</p>
        </div>
        <div className="mt-4 lg:mt-0 flex items-center gap-4">
          <div className="relative">
            <input
              type="text"
              placeholder="Search projects..."
              className="w-full lg:w-64 pl-10 pr-4 py-2 rounded-lg bg-slate-800 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500"
            />
            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400">
              🔍
            </span>
          </div>
          <select className="bg-slate-800 text-slate-100 rounded-lg py-2 px-3">
            <option>All Status</option>
          </select>
          <select className="bg-slate-800 text-slate-100 rounded-lg py-2 px-3">
            <option>Sort by: Recent</option>
          </select>
          <Button
            className="ml-auto bg-cyan-500 hover:bg-cyan-600 text-white">
            <PlusCircle className="w-5 h-5 mr-2" /> New Project

          </Button>
        </div>
      </div>

      {/* grid */}
      <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        {projects.map(p => (
          <div key={p.id} className={`relative bg-slate-800 rounded-xl shadow ${p.borderColor} border-t-[4px]`}>
            <div className="p-6">
              <div className="flex justify-between items-start">
                <h2 className="text-lg font-semibold text-white">{p.name}</h2>
                <MoreVertical className="w-5 h-5 text-slate-400" />
              </div>
              <div className="mt-1">
                <span className={`inline-block px-2 py-1 text-xs font-medium rounded ${p.statusColor}`}>{p.status}</span>
              </div>
              <p className="mt-2 text-slate-400 text-sm">{p.description}</p>
              <div className="mt-4">
                <div className="text-slate-300 text-xs mb-1">Test Coverage</div>
                <div className="w-full bg-slate-700 h-2 rounded">
                  <div className="bg-cyan-500 h-2 rounded" style={{ width: `${p.coverage}%` }} />
                </div>
              </div>
              <div className="mt-4 grid grid-cols-3 text-center text-slate-300 text-xs">
                <div>
                  <div className="font-bold text-white">{p.requirements}</div>
                  <div>Requirements</div>
                </div>
                <div>
                  <div className="font-bold text-white">{p.scenarios}</div>
                  <div>Scenarios</div>
                </div>
                <div>
                  <div className="font-bold text-white">{p.testCases}</div>
                  <div>Test Cases</div>
                </div>
              </div>
              <div className="mt-4 flex justify-between items-center text-slate-400 text-xs">
                <div className="flex items-center gap-1">
                  <User className="w-4 h-4" /> {p.members} members
                </div>
                <div>
                  <span className="inline-block bg-slate-700 px-2 py-1 rounded">{p.date}</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
