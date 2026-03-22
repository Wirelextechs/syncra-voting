import React from 'react';
import { Vote, LayoutDashboard, Users, UserCheck } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  const isAdmin = location.pathname.startsWith('/admin');

  return (
    <div className="min-h-screen flex flex-col">
      <nav className="glass sticky top-0 z-50 h-[var(--nav-height)] flex items-center px-8 justify-between">
        <div className="flex items-center gap-2">
          <Vote className="w-8 h-8 text-[#6366f1]" />
          <span className="text-2xl font-bold tracking-tight text-white">Syncra</span>
        </div>
        
        <div className="flex gap-8 items-center">
          {isAdmin ? (
            <>
              <Link to="/admin" className="flex items-center gap-2 hover:text-[#6366f1] transition-colors text-white no-underline">
                <LayoutDashboard className="w-5 h-5" />
                <span>Dashboard</span>
              </Link>
              <Link to="/admin/voters" className="flex items-center gap-2 hover:text-[#6366f1] transition-colors text-white no-underline">
                <Users className="w-5 h-5" />
                <span>Voters</span>
              </Link>
            </>
          ) : (
            <Link to="/voter/login" className="flex items-center gap-2 hover:text-[#6366f1] transition-colors text-white no-underline">
              <UserCheck className="w-5 h-5" />
              <span>Voter Portal</span>
            </Link>
          )}
        </div>
      </nav>

      <main className="flex-1 container mx-auto px-4 py-8 max-w-7xl animate-fade-in">
        {children}
      </main>

      <footer className="py-8 text-center text-[#94a3b8] glass-border border-t mt-12">
        <p>&copy; 2024 Syncra Voting System. Secure. Modern. Transparent.</p>
      </footer>
    </div>
  );
};

export default Layout;
