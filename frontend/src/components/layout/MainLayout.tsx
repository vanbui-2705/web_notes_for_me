import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../dashboard/Sidebar';
import Topbar from '../dashboard/Topbar';
import TaskAddModal from '../TaskAddModal';

export default function MainLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden relative" style={{ background: 'var(--bg-base)' }}>
      {/* Ambient drifting glowing orbs (Mệnh Thủy theme background) */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute w-[45vw] h-[45vw] min-w-[300px] rounded-full filter blur-[120px] opacity-35 animate-orb-drift-1" style={{ background: 'radial-gradient(circle, rgba(0, 245, 212, 0.25) 0%, transparent 70%)', top: '-10%', left: '15%' }} />
        <div className="absolute w-[40vw] h-[40vw] min-w-[280px] rounded-full filter blur-[120px] opacity-30 animate-orb-drift-2" style={{ background: 'radial-gradient(circle, rgba(0, 187, 249, 0.25) 0%, transparent 70%)', bottom: '5%', right: '10%' }} />
        <div className="absolute w-[35vw] h-[35vw] min-w-[250px] rounded-full filter blur-[140px] opacity-25 animate-orb-drift-3" style={{ background: 'radial-gradient(circle, rgba(144, 224, 239, 0.2) 0%, transparent 70%)', top: '35%', left: '-5%' }} />
      </div>

      {/* SIDEBAR */}
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* MAIN AREA */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0 relative z-10">
        <Topbar onHamburgerClick={() => setSidebarOpen(true)} />

        {/* SCROLLABLE CONTENT */}
        <main className="flex-1 overflow-y-auto px-4 md:px-8 py-6">
          <Outlet />
        </main>
      </div>

      {/* Global Task Add Modal */}
      <TaskAddModal />
    </div>
  );
}
