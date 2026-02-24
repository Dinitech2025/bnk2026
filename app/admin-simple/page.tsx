import { BarChart3, Users, ShoppingBag, Package, FileText } from 'lucide-react'

export default function AdminSimplePage() {
  return (
    <div className="min-h-screen p-8 bg-gray-100">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">🔧 Admin Simple - Sans Guard</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard 
            title="Test" 
            value="OK" 
            change="+100%" 
            icon={<Users className="h-8 w-8" />} 
          />
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h2 className="text-lg font-medium mb-4">Test Admin Sans Restrictions</h2>
          <p>Si vous voyez cette page, la route admin fonctionne.</p>
          <p>Le problème est donc dans le AdminGuard ou le layout.</p>
        </div>
      </div>
    </div>
  )
}

interface StatCardProps {
  title: string
  value: string
  change: string
  icon: React.ReactNode
}

function StatCard({ title, value, change, icon }: StatCardProps) {
  return (
    <div className="bg-white p-6 rounded-lg shadow-sm">
      <div className="flex justify-between">
        <div>
          <p className="text-sm text-gray-500">{title}</p>
          <p className="text-3xl font-bold mt-1">{value}</p>
          <p className="text-sm mt-2 text-green-600">{change}</p>
        </div>
        <div className="bg-blue-50 p-3 rounded-full">
          {icon}
        </div>
      </div>
    </div>
  )
}

