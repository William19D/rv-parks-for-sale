import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  LayoutDashboard, 
  List, 
  Users, 
  Settings, 
  BarChart, 
  MessageSquare,
  PanelLeft,
  PanelRight
} from 'lucide-react';

export function AdminSidebar() {
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);

  const isActive = (path: string) => {
    return location.pathname.startsWith(path);
  };

  const menuItems = [
    {
      title: 'Dashboard',
      icon: LayoutDashboard,
      href: '/admin/dashboard',
      active: isActive('/admin/dashboard')
    },
    {
      title: 'Listings',
      icon: List,
      href: '/admin/listings',
      active: isActive('/admin/listings')
    },
    {
      title: 'Users',
      icon: Users,
      href: '/admin/users',
      active: isActive('/admin/users')
    },
    {
      title: 'Analytics',
      icon: BarChart,
      href: '/admin/analytics',
      active: isActive('/admin/analytics')
    },
    {
      title: 'Messages',
      icon: MessageSquare,
      href: '/admin/messages',
      active: isActive('/admin/messages')
    },
    {
      title: 'Settings',
      icon: Settings,
      href: '/admin/settings',
      active: isActive('/admin/settings')
    }
  ];

  return (
    <div 
      className={cn(
        "h-screen bg-white border-r transition-all duration-300 ease-in-out hidden md:block",
        collapsed ? "w-16" : "w-64"
      )}
    >
      <div className="p-4 flex items-center justify-between">
        {!collapsed && (
          <div className="font-bold text-xl text-[#f74f4f]">Admin Panel</div>
        )}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setCollapsed(!collapsed)}
          className={cn(
            "rounded-full p-2 h-8 w-8",
            collapsed && "mx-auto"
          )}
        >
          {collapsed ? <PanelRight size={16} /> : <PanelLeft size={16} />}
        </Button>
      </div>
      
      <div className="mt-4 px-2">
        {menuItems.map((item) => (
          <Link
            key={item.href}
            to={item.href}
            className={cn(
              "flex items-center py-2 px-3 my-1 rounded-md transition-colors",
              item.active
                ? "bg-[#f74f4f]/10 text-[#f74f4f]"
                : "text-gray-700 hover:bg-gray-100",
              collapsed && "justify-center"
            )}
          >
            <item.icon
              className={cn(
                "h-5 w-5",
                item.active ? "text-[#f74f4f]" : "text-gray-500"
              )}
            />
            {!collapsed && <span className="ml-3">{item.title}</span>}
          </Link>
        ))}
      </div>
    </div>
  );
}

// Add default export to support both import styles
export default AdminSidebar;