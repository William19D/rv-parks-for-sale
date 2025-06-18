import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { 
  LayoutDashboard, 
  MessageSquare
} from "lucide-react";

interface AdminSidebarProps {
  collapsed?: boolean;
}

// Define admin navigation items - reduced to only Dashboard and Support Tickets
const adminNavItems = [
  {
    title: "Dashboard",
    href: "/admin/dashboard/",
    icon: LayoutDashboard,
  },
  {
    title: "Support Tickets",
    href: "/admin/support/",
    icon: MessageSquare,
  }
];

export function AdminSidebar({ collapsed = false }: AdminSidebarProps) {
  const location = useLocation();
  
  return (
    <aside className={cn(
      "h-screen fixed top-0 left-0 z-40 bg-white border-r border-gray-200 transition-all",
      collapsed ? "w-16" : "w-64"
    )}>
      <div className="h-full flex flex-col justify-between py-4">
        <div>
          <div className="flex items-center justify-center h-16 mb-6">
            {collapsed ? (
              <div className="h-8 w-8 bg-[#f74f4f] rounded-md flex items-center justify-center">
                <span className="text-white font-bold text-sm">RP</span>
              </div>
            ) : (
              <h1 className="text-xl font-bold text-[#f74f4f]">RoverPass Admin</h1>
            )}
          </div>
          
          <div className="px-3">
            <ul className="space-y-2">
              {adminNavItems.map((item) => {
                const isActive = location.pathname === item.href || 
                                location.pathname.startsWith(item.href);
                                
                return (
                  <li key={item.href}>
                    <Link
                      to={item.href}
                      className={cn(
                        "flex items-center py-2 px-3 rounded-md group transition-colors",
                        isActive 
                          ? "bg-[#f74f4f]/10 text-[#f74f4f]" 
                          : "hover:bg-gray-100"
                      )}
                    >
                      <item.icon className={cn(
                        "flex-shrink-0 w-5 h-5 transition-colors",
                        isActive 
                          ? "text-[#f74f4f]" 
                          : "text-gray-500 group-hover:text-[#f74f4f]"
                      )} />
                      
                      {!collapsed && (
                        <span className={cn(
                          "ml-3 transition-colors flex-1",
                          isActive ? "font-medium" : ""
                        )}>
                          {item.title}
                        </span>
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      </div>
    </aside>
  );
}

// Add default export to support both import styles
export default AdminSidebar;