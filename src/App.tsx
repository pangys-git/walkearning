/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Home, Compass, Map, Camera, User } from 'lucide-react';
import { cn } from './lib/utils';
import DashboardView from './views/DashboardView';
import ExploreView from './views/ExploreView';
import PlanView from './views/PlanView';
import PoetryView from './views/PoetryView';
import ProfileView from './views/ProfileView';

type View = 'dashboard' | 'explore' | 'plan' | 'poetry' | 'profile';

export default function App() {
  const [currentView, setCurrentView] = useState<View>('dashboard');

  const renderView = () => {
    switch (currentView) {
      case 'dashboard':
        return <DashboardView />;
      case 'explore':
        return <ExploreView />;
      case 'plan':
        return <PlanView />;
      case 'poetry':
        return <PoetryView />;
      case 'profile':
        return <ProfileView />;
      default:
        return <DashboardView />;
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50 font-sans text-gray-900 max-w-md mx-auto shadow-2xl overflow-hidden relative">
      {/* Header */}
      <header className="bg-white px-6 py-4 shadow-sm z-10 sticky top-0">
        <h1 className="text-xl font-bold text-emerald-700 tracking-tight">輕行計劃</h1>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto pb-20">
        {renderView()}
      </main>

      {/* Bottom Navigation */}
      <nav className="absolute bottom-0 w-full bg-white border-t border-gray-200 px-6 py-3 flex justify-between items-center z-20 pb-safe">
        <NavItem
          icon={<Home size={24} />}
          label="健康"
          isActive={currentView === 'dashboard'}
          onClick={() => setCurrentView('dashboard')}
        />
        <NavItem
          icon={<Compass size={24} />}
          label="探索"
          isActive={currentView === 'explore'}
          onClick={() => setCurrentView('explore')}
        />
        <NavItem
          icon={<Map size={24} />}
          label="AI路線"
          isActive={currentView === 'plan'}
          onClick={() => setCurrentView('plan')}
        />
        <NavItem
          icon={<Camera size={24} />}
          label="創作/記錄"
          isActive={currentView === 'poetry'}
          onClick={() => setCurrentView('poetry')}
        />
        <NavItem
          icon={<User size={24} />}
          label="我的"
          isActive={currentView === 'profile'}
          onClick={() => setCurrentView('profile')}
        />
      </nav>
    </div>
  );
}

function NavItem({
  icon,
  label,
  isActive,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  isActive: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex flex-col items-center justify-center gap-1 w-16 transition-colors",
        isActive ? "text-emerald-600" : "text-gray-400 hover:text-gray-600"
      )}
    >
      <div className={cn("p-1 rounded-full", isActive && "bg-emerald-50")}>
        {icon}
      </div>
      <span className="text-[10px] font-medium">{label}</span>
    </button>
  );
}
