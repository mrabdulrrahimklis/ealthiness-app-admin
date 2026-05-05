import React, { useState, useEffect, useRef } from "react";
import { useNavigate, Link } from "react-router";
import type { Route } from "./+types/regions";
import {
  Globe,
  Plus,
  Mail,
  Search,
  ChevronDown,
  Check,
  ChevronLeft,
  ChevronRight,
  Edit,
  Eye,
} from "lucide-react";
import { Button, Card, Badge, Input } from "~/components/ui";
import AppSidebar from "../../src/components/shared/AppSidebar";
import Navbar from "../../src/components/shared/Navbar";
import { RoleGuard } from "~/components/auth/RoleGuard";
import { useUser } from "~/hooks/useAuth";
import { useRegions } from "~/hooks/useAuthApi";
import type { ApiRegion } from "~/lib/auth/types";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Regions - Ealthiness Admin Portal" },
    {
      name: "description",
      content: "Manage regions and regional administrators",
    },
  ];
}

export default function RegionsPage() {
  const user = useUser();
  const navigate = useNavigate();
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [orderBy, setOrderBy] = useState<"name" | "createdAt">("name");
  const [sortType, setSortType] = useState<"ascending" | "descending">(
    "ascending",
  );
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [modalState, setModalState] = useState<{
    isOpen: boolean;
    type: string;
    data: any;
  }>({
    isOpen: false,
    type: "",
    data: null,
  });

  const sortOptions = [
    { value: "name", label: "Name" },
    { value: "createdAt", label: "Date Created" },
  ];

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
      setCurrentPage(1); // Reset to first page when search changes
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Fetch regions with React Query
  const {
    data: regionsResponse,
    isLoading,
    error,
    refetch,
  } = useRegions({
    page: currentPage,
    limit: 10,
    search: debouncedSearchTerm || undefined,
    orderBy: orderBy,
    type: sortType,
  });

  const handleRefresh = () => {
    setRefreshing(true);
    refetch().finally(() => setRefreshing(false));
  };

  const handleLogout = () => {
    navigate("/");
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex items-center space-x-2">
          <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-gray-600">Loading...</span>
        </div>
      </div>
    );
  }

  // Transform API regions to display format
  const transformRegion = (apiRegion: ApiRegion) => ({
    id: apiRegion._id,
    name: apiRegion.name,
    code: apiRegion.name.substring(0, 3).toUpperCase(), // Generate code from name
    adminCount: apiRegion.adminCount,
    image: apiRegion.image?.url || null, // Extract URL from image object
    createdAt: new Date(apiRegion.createdAt).toLocaleDateString(),
  });

  const visibleRegions = regionsResponse?.results?.map(transformRegion) || [];

  // Handle error state
  if (error) {
    console.error("Error fetching regions:", error);
  }

  const handleInviteAdmin = (regionName: string) => {
    setModalState({
      isOpen: true,
      type: "invite_admin",
      data: { entity: regionName, role: "Regional Admin" },
    });
  };

  return (
    <RoleGuard
      allowedRoles={["SUPER_ADMIN", "COUNTRY_ADMIN", "REGIONAL_ADMIN"]}
    >
      <div className="min-h-screen bg-[#F8F9FB] font-sans flex">
        <AppSidebar user={user} />

        <div className="flex-1 flex flex-col">
          <Navbar
            user={user}
            onLogout={handleLogout}
            onRefresh={handleRefresh}
            refreshing={refreshing}
          />

          <div className="flex-1 p-6">
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-extrabold text-[#1B173A] flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#E8E6FC] text-[#5850DE] flex items-center justify-center">
                      <Globe size={20} />
                    </div>
                    Regions
                  </h2>
                  <p className="text-[#60646C] text-sm font-medium mt-1">
                    Total {regionsResponse?.total || 0} regions found (
                    {visibleRegions.length} on this page)
                  </p>
                </div>
              </div>

              {/* Search and Filters */}
              <div className="bg-white rounded-xl border border-[#E0E1E6] p-4 mb-6 shadow-sm">
                <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
                  {/* Search Input */}
                  <div className="relative flex-1">
                    <Search
                      size={18}
                      className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#8E8E93]"
                    />
                    <Input
                      type="text"
                      placeholder="Search by region name..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 pr-4 py-2 w-full"
                    />
                  </div>

                  {/* Order By Filter */}
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-[#60646C] whitespace-nowrap">
                      Sort by:
                    </span>
                    <div className="relative" ref={dropdownRef}>
                      <Button
                        variant="outline"
                        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                        className="justify-between min-w-[140px] bg-white border border-[#E0E1E6] rounded-xl px-4 py-2.5 text-sm font-semibold text-[#1B173A] hover:border-[#5850DE] hover:bg-white focus:border-[#5850DE] focus:ring-2 focus:ring-[#5850DE]/10 transition-all duration-200 shadow-sm hover:shadow-md"
                      >
                        {
                          sortOptions.find((option) => option.value === orderBy)
                            ?.label
                        }
                        <ChevronDown
                          size={16}
                          className={`text-[#8E8E93] transition-transform duration-200 ${isDropdownOpen ? "rotate-180" : ""}`}
                        />
                      </Button>

                      {isDropdownOpen && (
                        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-[#E0E1E6] rounded-xl shadow-lg z-50 py-1">
                          {sortOptions.map((option) => (
                            <button
                              key={option.value}
                              onClick={() => {
                                setOrderBy(option.value as typeof orderBy);
                                setCurrentPage(1);
                                setIsDropdownOpen(false);
                              }}
                              className={`w-full px-4 py-2.5 text-left text-sm font-medium hover:bg-[#F0F0F3] transition-colors flex items-center justify-between ${
                                orderBy === option.value
                                  ? "text-[#5850DE] bg-[#F0F0F3]"
                                  : "text-[#1B173A]"
                              }`}
                            >
                              {option.label}
                              {orderBy === option.value && (
                                <Check size={16} className="text-[#5850DE]" />
                              )}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Sort Direction */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        setSortType(
                          sortType === "ascending" ? "descending" : "ascending",
                        );
                        setCurrentPage(1);
                      }}
                      className="flex items-center gap-2 px-4 py-2.5 border border-[#E0E1E6] rounded-xl text-sm font-semibold text-[#1B173A] hover:border-[#5850DE] hover:text-[#5850DE] hover:bg-[#F0F0F3] focus:border-[#5850DE] focus:ring-2 focus:ring-[#5850DE]/10 focus:outline-none transition-all duration-200 shadow-sm hover:shadow-md bg-white min-w-[80px] justify-center"
                    >
                      {sortType === "ascending" ? "↑ A-Z" : "↓ Z-A"}
                    </button>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-[24px] border border-[#E0E1E6] shadow-sm overflow-hidden relative">
                {/* Loading overlay */}
                {isLoading && (
                  <div className="absolute inset-0 bg-white/50 backdrop-blur-sm flex items-center justify-center z-10">
                    <div className="flex items-center space-x-2">
                      <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                      <span className="text-gray-600 font-medium">
                        Loading regions...
                      </span>
                    </div>
                  </div>
                )}

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead className="bg-[#F8F9FB] border-b border-[#E0E1E6]">
                      <tr>
                        <th className="p-4 text-xs font-bold text-[#8E8E93] uppercase tracking-widest">
                          Region
                        </th>
                        <th className="p-4 text-xs font-bold text-[#8E8E93] uppercase tracking-widest">
                          Code
                        </th>
                        <th className="p-4 text-xs font-bold text-[#8E8E93] uppercase tracking-widest">
                          Admins
                        </th>
                        <th className="p-4 text-xs font-bold text-[#8E8E93] uppercase tracking-widest">
                          Created
                        </th>
                        <th className="p-4 text-xs font-bold text-[#8E8E93] uppercase tracking-widest text-right">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E0E1E6]">
                      {visibleRegions.map((region) => (
                        <tr
                          key={region.id}
                          className="hover:bg-gray-50 transition"
                        >
                          <td className="p-4 font-bold text-[#1B173A] flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-[#E8E6FC] text-[#5850DE] flex items-center justify-center overflow-hidden">
                              {region.image ? (
                                <img
                                  src={region.image}
                                  alt={`${region.name} region`}
                                  className="w-full h-full object-cover rounded-lg"
                                />
                              ) : (
                                <Globe size={16} />
                              )}
                            </div>
                            <Link
                              to={`/regions/${region.id}`}
                              className="hover:text-[#5850DE] transition-colors font-bold"
                            >
                              {region.name}
                            </Link>
                          </td>
                          <td className="p-4 font-mono text-[#60646C] text-sm">
                            {region.code}
                          </td>
                          <td className="p-4">
                            <Badge
                              variant={
                                region.adminCount > 0 ? "default" : "secondary"
                              }
                            >
                              {region.adminCount}{" "}
                              {region.adminCount === 1 ? "Admin" : "Admins"}
                            </Badge>
                          </td>
                          <td className="p-4 font-medium text-[#60646C] text-sm">
                            {region.createdAt}
                          </td>
                          <td className="p-4 text-right">
                            <div className="flex justify-end gap-2">
                              {user?.role === "SUPER_ADMIN" ? (
                                <Link to={`/regions/${region.id}`}>
                                  <Button variant="outline" size="sm">
                                    <Edit size={16} className="mr-2" /> Edit
                                  </Button>
                                </Link>
                              ) : (
                                <Link to={`/regions/${region.id}`}>
                                  <Button variant="outline" size="sm">
                                    <Eye size={16} className="mr-2" /> View
                                  </Button>
                                </Link>
                              )}
                              <Button
                                variant="outline"
                                onClick={() => handleInviteAdmin(region.name)}
                                size="sm"
                              >
                                <Mail size={16} className="mr-2" /> Invite Admin
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {visibleRegions.length === 0 && !isLoading && (
                  <div className="p-8 text-center">
                    <div className="w-16 h-16 rounded-full bg-[#F0F0F3] flex items-center justify-center mx-auto mb-4">
                      <Globe size={24} className="text-[#8E8E93]" />
                    </div>
                    <h3 className="text-lg font-bold text-[#1B173A] mb-2">
                      No Regions Found
                    </h3>
                    <p className="text-[#60646C] text-sm">
                      There are no regions in your management scope yet.
                    </p>
                  </div>
                )}
              </div>

              {/* Pagination */}
              {regionsResponse && regionsResponse.pages > 1 && (
                <div className="bg-white rounded-xl border border-[#E0E1E6] mt-6 p-4 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-[#60646C]">
                        Showing {(currentPage - 1) * 10 + 1} to{" "}
                        {Math.min(currentPage * 10, regionsResponse.total)} of{" "}
                        {regionsResponse.total} results
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      {/* Previous Button */}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          setCurrentPage(Math.max(1, currentPage - 1))
                        }
                        disabled={currentPage === 1 || isLoading}
                        className="flex items-center gap-1"
                      >
                        <ChevronLeft size={16} />
                        Previous
                      </Button>

                      {/* Page Numbers */}
                      <div className="flex items-center gap-1">
                        {(() => {
                          const totalPages = regionsResponse.pages;
                          const current = currentPage;
                          let pages = [];

                          if (totalPages <= 7) {
                            // Show all pages if 7 or fewer
                            for (let i = 1; i <= totalPages; i++) {
                              pages.push(i);
                            }
                          } else {
                            // Show truncated pagination
                            if (current <= 4) {
                              pages = [1, 2, 3, 4, 5, "...", totalPages];
                            } else if (current >= totalPages - 3) {
                              pages = [
                                1,
                                "...",
                                totalPages - 4,
                                totalPages - 3,
                                totalPages - 2,
                                totalPages - 1,
                                totalPages,
                              ];
                            } else {
                              pages = [
                                1,
                                "...",
                                current - 1,
                                current,
                                current + 1,
                                "...",
                                totalPages,
                              ];
                            }
                          }

                          return pages.map((page, index) => {
                            if (page === "...") {
                              return (
                                <span
                                  key={`ellipsis-${index}`}
                                  className="px-2 py-1 text-[#8E8E93]"
                                >
                                  ...
                                </span>
                              );
                            }

                            const pageNum = page as number;
                            return (
                              <button
                                key={pageNum}
                                onClick={() => setCurrentPage(pageNum)}
                                disabled={isLoading}
                                className={`px-3 py-1 text-sm font-medium rounded transition-colors ${
                                  pageNum === current
                                    ? "bg-[#5850DE] text-white"
                                    : "text-[#60646C] hover:text-[#5850DE] hover:bg-[#F0F0F3]"
                                }`}
                              >
                                {pageNum}
                              </button>
                            );
                          });
                        })()}
                      </div>

                      {/* Next Button */}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          setCurrentPage(
                            Math.min(regionsResponse.pages, currentPage + 1),
                          )
                        }
                        disabled={
                          currentPage === regionsResponse.pages || isLoading
                        }
                        className="flex items-center gap-1"
                      >
                        Next
                        <ChevronRight size={16} />
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {/* Modal for invite admin */}
              {modalState.isOpen && (
                <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
                  <Card className="w-full max-w-md shadow-2xl animate-in zoom-in-95 duration-200">
                    <div className="p-6 border-b border-[#E0E1E6] flex items-center justify-between">
                      <h3 className="text-lg font-semibold text-[#1B173A]">
                        Invite ${modalState.data?.role}
                      </h3>
                      <button
                        onClick={() =>
                          setModalState({ isOpen: false, type: "", data: null })
                        }
                        className="text-[#8E8E93] hover:text-[#1B173A] transition"
                      >
                        ×
                      </button>
                    </div>
                    <div className="p-6 space-y-4">
                      <p className="text-sm text-[#60646C]">
                        You are inviting a new {modalState.data?.role} to manage{" "}
                        <strong>{modalState.data?.entity}</strong>. They will
                        receive an email to set up their account.
                      </p>
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-[#8E8E93] uppercase">
                          Email Address
                        </label>
                        <input
                          className="w-full px-3 py-2 border border-[#E0E1E6] rounded-lg focus:border-[#5850DE] outline-none"
                          placeholder="admin@example.com"
                          type="email"
                        />
                      </div>
                      <div className="pt-4 flex justify-end gap-3">
                        <Button
                          variant="outline"
                          onClick={() =>
                            setModalState({
                              isOpen: false,
                              type: "",
                              data: null,
                            })
                          }
                        >
                          Cancel
                        </Button>
                        <Button
                          onClick={() =>
                            setModalState({
                              isOpen: false,
                              type: "",
                              data: null,
                            })
                          }
                        >
                          Send Invitation
                        </Button>
                      </div>
                    </div>
                  </Card>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </RoleGuard>
  );
}
