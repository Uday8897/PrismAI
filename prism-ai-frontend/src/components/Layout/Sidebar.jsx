// src/components/Layout/Sidebar.jsx
import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Search, 
  History, 
  Settings, 
  Activity,
  Cloud,
  GitBranch,
  Shield
} from 'lucide-react';

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Incident Analysis', href: '/analyze', icon: Search },
  { name: 'Analysis History', href: '/history', icon: History },
  { name: 'Settings', href: '/settings', icon: Settings },
];

const services = [
  { name: 'Kubernetes', icon: Activity, status: 'healthy' },
  { name: 'AWS CloudWatch', icon: Cloud, status: 'degraded' },
  { name: 'GitHub Actions', icon: GitBranch, status: 'healthy' },
];

const Sidebar = () => {
  return (
    <div className="w-64 bg-gray-900 text-white flex flex-col">
      {/* Logo */}
      <div className="flex items-center space-x-3 px-6 py-4 border-b border-gray-700">
        <Shield className="h-8 w-8 text-primary-400" />
        <div>
          <h1 className="text-xl font-bold">Prism AI</h1>
          <p className="text-xs text-gray-400">Fix problems faster</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-2">
        {navigation.map((item) => (
          <NavLink
            key={item.name}
            to={item.href}
            className={({ isActive }) =>
              `flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-primary-600 text-white'
                  : 'text-gray-300 hover:bg-gray-800 hover:text-white'
              }`
            }
          >
            <item.icon className="h-5 w-5" />
            <span>{item.name}</span>
          </NavLink>
        ))}
      </nav>

      {/* Services Status */}
      <div className="px-4 py-4 border-t border-gray-700">
        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
          Services Status
        </h3>
        <div className="space-y-2">
          {services.map((service) => (
            <div key={service.name} className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <service.icon className="h-4 w-4 text-gray-400" />
                <span className="text-sm text-gray-300">{service.name}</span>
              </div>
              <div className={`w-2 h-2 rounded-full ${
                service.status === 'healthy' ? 'bg-green-400' :
                service.status === 'degraded' ? 'bg-yellow-400' : 'bg-red-400'
              }`} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Sidebar;