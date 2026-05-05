import React from "react";
import { Link, useLocation, useNavigate } from "react-router";
import {
  LayoutGrid,
  Globe,
  Building2,
  Users,
  HeartPulse,
  Settings,
} from "lucide-react";

import type { User } from "~/lib/auth/types";
import { useLogout } from "~/hooks/useAuthApi";

interface AppSidebarProps {
  user: User;
}

interface NavItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ size?: number }>;
  roles: string[];
  path: string;
}

const AppSidebar: React.FC<AppSidebarProps> = ({ user }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const logoutMutation = useLogout();

  // Use user.role from the authenticated user
  const effectiveRole = user.role;

  // Normalize role for consistent checking
  const normalizedRole = effectiveRole.toUpperCase().replace(/[-\s]/g, "_");

  const handleLogout = async () => {
    try {
      await logoutMutation.mutateAsync();
      navigate("/");
    } catch (error) {
      console.error("Logout error:", error);
      // Force redirect even if logout fails
      navigate("/");
    }
  };

  const getRoleDisplayName = (role: string) => {
    switch (role) {
      case "SUPER_ADMIN":
        return "Super Admin";
      case "COUNTRY_ADMIN":
        return "Country Admin";
      case "COMPANY_ADMIN":
        return "Company Admin";
      case "REGIONAL_ADMIN":
        return "Regional Admin";
      default:
        return "Admin";
    }
  };

  const navItems: NavItem[] = [
    {
      id: "dashboard",
      label: "Overview",
      icon: LayoutGrid,
      roles: ["SUPER_ADMIN", "COUNTRY_ADMIN", "REGIONAL_ADMIN", "COMPANY_ADMIN"],
      path: "/home",
    },
    {
      id: "regions",
      label: "Regions",
      icon: Globe,
      roles: ["SUPER_ADMIN", "COUNTRY_ADMIN", "REGIONAL_ADMIN"],
      path: "/regions",
    },
    {
      id: "countries",
      label: "Countries",
      icon: Globe,
      roles: ["SUPER_ADMIN", "REGIONAL_ADMIN"],
      path: "/countries",
    },
    {
      id: "companies",
      label: "Companies",
      icon: Building2,
      roles: ["SUPER_ADMIN", "COUNTRY_ADMIN", "REGIONAL_ADMIN"],
      path: "/companies",
    },
    {
      id: "customers",
      label: normalizedRole === "COMPANY_ADMIN" ? "My Users" : "All Users",
      icon: Users,
      roles: ["SUPER_ADMIN", "COUNTRY_ADMIN", "REGIONAL_ADMIN", "COMPANY_ADMIN"],
      path: "/customers",
    },
  ];

  const brandItems: NavItem[] = [
    {
      id: "settings",
      label: "Settings",
      icon: Settings,
      roles: ["SUPER_ADMIN", "COUNTRY_ADMIN", "REGIONAL_ADMIN", "COMPANY_ADMIN"],
      path: "/settings",
    },
  ];

  const filteredNavItems = navItems.filter((item) =>
    item.roles.includes(normalizedRole),
  );
  const filteredBrandItems = brandItems.filter((item) =>
    item.roles.includes(normalizedRole),
  );

  const isActiveRoute = (itemId: string, itemPath: string) => {
    if (itemId === "dashboard") {
      return location.pathname === "/" || location.pathname === "/home";
    }
    return location.pathname === itemPath;
  };

  return (
    <aside className="w-64 bg-white border-r border-[#E0E1E6] flex flex-col h-screen sticky top-0 shrink-0 z-20">
      {/* Header */}
      <div className="p-6 flex items-center gap-3 border-b border-[#E0E1E6]">
        <div className="w-10 h-10 bg-gradient-to-br from-[#5850DE] to-[#248FEC] rounded-xl flex items-center justify-center text-white shadow-md">
          <HeartPulse size={20} />
        </div>
        <div>
          <span className="font-extrabold text-lg text-[#1B173A] leading-tight block">
            Ealthiness
          </span>
          <span className="text-[10px] font-bold text-[#8E8E93] uppercase tracking-wider">
            {getRoleDisplayName(normalizedRole)}
          </span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto min-h-0">
        <p className="text-[10px] font-bold text-[#8E8E93] uppercase tracking-widest px-3 mb-2">
          Management
        </p>

        {filteredNavItems.map((item) => {
          const Icon = item.icon;
          const isActive = isActiveRoute(item.id, item.path);

          const handleNavigation = (e: React.MouseEvent) => {
            e.preventDefault();
            navigate(item.path);
          };

          return (
            <button
              key={item.id}
              onClick={handleNavigation}
              className={`w-full flex items-center gap-3 p-3 rounded-xl font-semibold transition text-left ${
                isActive
                  ? "bg-[#F0F0F3] text-[#5850DE]"
                  : "text-[#60646C] hover:bg-gray-50"
              }`}
            >
              <Icon size={20} />
              {item.label}
            </button>
          );
        })}

        {filteredBrandItems.length > 0 && (
          <>
            <div className="mt-8 mb-4 border-t border-[#E0E1E6]"></div>
            <p className="text-[10px] font-bold text-[#8E8E93] uppercase tracking-widest px-3 mb-2 mt-4">
              Brand Resources
            </p>

            {filteredBrandItems.map((item) => {
              const Icon = item.icon;
              const isActive = isActiveRoute(item.id, item.path);

              const handleBrandNavigation = (e: React.MouseEvent) => {
                e.preventDefault();
                navigate(item.path);
              };

              return (
                <button
                  key={item.id}
                  onClick={handleBrandNavigation}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl font-semibold transition text-left ${
                    isActive
                      ? "bg-gradient-to-r from-[#5850DE] to-[#248FEC] text-white shadow-md"
                      : "text-[#60646C] hover:bg-gray-50"
                  }`}
                >
                  <Icon size={20} />
                  {item.label}
                </button>
              );
            })}
          </>
        )}
      </nav>

      {/* Footer - Logout Button */}
      <div className="p-4 border-t border-[#E0E1E6] mt-auto">
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 p-3 text-[#EF4444] font-bold hover:bg-red-50 rounded-xl transition-colors"
        >
          Logout Securely
        </button>
      </div>
    </aside>
  );
};

export default AppSidebar;
