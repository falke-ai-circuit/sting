import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const location = useLocation();

  const navigation = [
    { name: 'Dashboard', href: '/', icon: '◉', symbol: '◉' },
    { name: 'Sessions', href: '/sessions', icon: '◇', symbol: '◆' },
    { name: 'Canaries', href: '/canaries', icon: '◈', symbol: '◈' },
    { name: 'Samples', href: '/samples', icon: '◎', symbol: '◎' },
    { name: 'Lab', href: '/lab', icon: '⬢', symbol: '⬡' },
    { name: 'Settings', href: '/settings', icon: '⚙', symbol: '⚙' },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="flex h-screen bg-cyber-black font-terminal">
      {/* Sidebar */}
      <div className={`${sidebarOpen ? 'w-64' : 'w-16'} bg-cyber-dark border-r border-cyber-gray flex flex-col`}>
        {/* Logo */}
        <div className="flex items-center justify-between p-4 border-b border-cyber-gray">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-cyber-red border border-cyber-red-dark flex items-center justify-center relative">
              <span className="text-cyber-red font-bold text-lg">S</span>
            </div>
            {sidebarOpen && (
              <span className="text-cyber-red font-bold text-lg tracking-wider">STING</span>
            )}
          </div>
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="text-cyber-gray-light hover:text-cyber-red transition-colors duration-300 text-lg"
            title={sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
          >
            {sidebarOpen ? '◀' : '▶'}
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-3">
          <ul className="space-y-1">
            {navigation.map((item) => (
              <li key={item.name}>
                <Link
                  to={item.href}
                  className={`flex items-center px-3 py-3 transition-all duration-300 border border-transparent relative ${
                    isActive(item.href)
                      ? 'bg-cyber-darker border-cyber-red text-cyber-red'
                      : 'text-cyber-gray-light hover:bg-cyber-darker hover:border-cyber-purple hover:text-cyber-purple'
                  }`}
                  title={!sidebarOpen ? item.name : undefined}
                >
                  <span className={`text-lg ${sidebarOpen ? 'mr-3' : 'mx-auto'}`}>
                    {isActive(item.href) ? item.symbol : item.icon}
                  </span>
                  {sidebarOpen && (
                    <span className="font-medium tracking-wide uppercase text-sm">
                      {item.name}
                    </span>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        {/* User info */}
        <div className="p-4 border-t border-cyber-gray">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-cyber-gray border border-cyber-purple flex items-center justify-center">
              <span className="text-cyber-purple text-sm font-bold">O</span>
            </div>
            {sidebarOpen && (
              <div className="flex-1">
                <p className="text-cyber-purple text-sm font-medium tracking-wide">Operator</p>
                <p className="text-cyber-gray-light text-xs uppercase tracking-wider">Deception</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-cyber-dark border-b border-cyber-gray px-6 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-cyber-red text-xl font-bold tracking-wider uppercase">
              {navigation.find(item => isActive(item.href))?.name || 'STING 2.0'}
            </h1>
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-cyber-green rounded-full"></div>
                <span className="text-cyber-green text-sm font-medium tracking-wide uppercase">System Online</span>
              </div>
              <div className="text-cyber-gray-light text-sm font-mono">
                {new Date().toLocaleTimeString('en-US', {
                  hour12: false,
                  hour: '2-digit',
                  minute: '2-digit',
                  second: '2-digit'
                })}
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-auto p-6 bg-cyber-black">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;
