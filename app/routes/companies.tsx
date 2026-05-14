import React, { useState, useEffect, useRef } from "react";
import { useNavigate, Link } from "react-router";
import type { Route } from "./+types/companies";
import {
  Building2,
  Plus,
  Mail,
  Edit,
  Search,
  ChevronDown,
  Check,
  ChevronLeft,
  ChevronRight,
  UserPlus,
} from "lucide-react";
import { Button, Card, Badge, Input } from "~/components/ui";
import AppSidebar from "~/components/shared/AppSidebar";
import Navbar from "~/components/shared/Navbar";
import { RoleGuard } from "~/components/auth/RoleGuard";
import { useUser } from "~/hooks/useAuth";
import { useCompanies } from "~/hooks/useAuthApi";
import type { ApiCompany } from "~/lib/auth/types";
import NewCompanyForm from "~/components/forms/NewCompanyForm";
import { InviteCompanyAdminModal } from "~/components/modals/InviteCompanyAdminModal";
import { InviteCompanyEmployeeModal } from "~/components/modals/InviteCompanyEmployeeModal";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Companies - Ealthiness Admin Portal" },
    {
      name: "description",
      content: "Manage companies across the Ealthiness platform",
    },
  ];
}

export default function CompaniesPage() {
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

  const [inviteModalState, setInviteModalState] = useState<{
    isOpen: boolean;
    companyId: string;
    companyName: string;
  }>({
    isOpen: false,
    companyId: "",
    companyName: "",
  });

  const [inviteEmployeeModalState, setInviteEmployeeModalState] = useState<{
    isOpen: boolean;
    companyId: string;
    companyName: string;
  }>({
    isOpen: false,
    companyId: "",
    companyName: "",
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

  // Fetch companies with React Query
  const {
    data: companiesResponse,
    isLoading,
    error,
    refetch,
  } = useCompanies({
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

  // Transform API companies to display format
  const transformCompany = (apiCompany: ApiCompany) => ({
    id: apiCompany._id,
    name: apiCompany.name,
    status: apiCompany.status,
    email: apiCompany.email,
    address: apiCompany.address,
    employees: apiCompany.employees.length,
    admins: apiCompany.admins.length,
    createdAt: new Date(apiCompany.createdAt).toLocaleDateString(),
  });

  const visibleCompanies =
    companiesResponse?.results?.map(transformCompany) || [];

  // Handle error state
  if (error) {
    console.error("Error fetching companies:", error);
  }

  const handleInviteAdmin = (companyId: string, companyName: string) => {
    setInviteModalState({
      isOpen: true,
      companyId,
      companyName,
    });
  };

  const handleInviteEmployee = (companyId: string, companyName: string) => {
    setInviteEmployeeModalState({
      isOpen: true,
      companyId,
      companyName,
    });
  };

  const handleAddCompany = () => {
    setModalState({ isOpen: true, type: "company", data: null });
  };

  const handleCompanyCreated = (newCompany: any) => {
    // Close modal
    setModalState({ isOpen: false, type: "", data: null });
    // Refetch companies to show the new one
    refetch();
  };

  return (
    <RoleGuard
      allowedRoles={[
        "SUPER_ADMIN",
        "COUNTRY_ADMIN",
        "REGIONAL_ADMIN",
        "COMPANY_ADMIN",
      ]}
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
                  <h2 className="text-2xl font-extrabold text-[#1B173A]">
                    Managed Companies
                  </h2>
                  <p className="text-[#60646C] text-sm font-medium mt-1">
                    {companiesResponse
                      ? `Total ${companiesResponse.total} companies in your jurisdiction.`
                      : `Total ${visibleCompanies.length} companies in your jurisdiction.`}
                  </p>
                </div>
                <Button onClick={handleAddCompany}>
                  <Plus size={18} className="mr-2" /> New Company
                </Button>
              </div>

              <Card>
                <div className="p-6 space-y-6">
                  {/* Search and Filter Section */}
                  <div className="flex flex-col sm:flex-row gap-4">
                    <div className="flex-1 relative">
                      <Search
                        size={16}
                        className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#8E8E93]"
                      />
                      <Input
                        type="text"
                        placeholder="Search companies..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-9"
                      />
                    </div>
                    <div className="flex gap-2">
                      <div className="relative" ref={dropdownRef}>
                        <Button
                          variant="outline"
                          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                          className="flex items-center gap-2 min-w-[140px] justify-between"
                        >
                          {sortOptions.find(
                            (option) => option.value === orderBy,
                          )?.label || "Sort by"}
                          <ChevronDown size={16} />
                        </Button>
                        {isDropdownOpen && (
                          <div className="absolute top-full left-0 mt-2 w-full bg-white border border-[#E0E1E6] rounded-lg shadow-lg z-10">
                            {sortOptions.map((option) => (
                              <button
                                key={option.value}
                                onClick={() => {
                                  setOrderBy(
                                    option.value as "name" | "createdAt",
                                  );
                                  setIsDropdownOpen(false);
                                }}
                                className="flex items-center justify-between w-full px-3 py-2 text-left hover:bg-[#F8F9FB] first:rounded-t-lg last:rounded-b-lg"
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
                      <Button
                        variant="outline"
                        onClick={() =>
                          setSortType(
                            sortType === "ascending"
                              ? "descending"
                              : "ascending",
                          )
                        }
                        className="px-3"
                        title={`Sort ${sortType === "ascending" ? "Descending" : "Ascending"}`}
                      >
                        {sortType === "ascending" ? "A↑" : "Z↓"}
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Loading Overlay */}
                {isLoading && (
                  <div className="relative">
                    <div className="absolute inset-0 bg-white/50 backdrop-blur-sm flex items-center justify-center z-10">
                      <div className="flex items-center space-x-2">
                        <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                        <span className="text-gray-600">
                          Loading companies...
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead className="bg-[#F8F9FB] border-b border-[#E0E1E6]">
                      <tr>
                        <th className="p-4 text-xs font-bold text-[#8E8E93] uppercase tracking-widest">
                          Company Name
                        </th>
                        <th className="p-4 text-xs font-bold text-[#8E8E93] uppercase tracking-widest">
                          Status
                        </th>
                        <th className="p-4 text-xs font-bold text-[#8E8E93] uppercase tracking-widest">
                          Address
                        </th>
                        <th className="p-4 text-xs font-bold text-[#8E8E93] uppercase tracking-widest">
                          Employees
                        </th>
                        <th className="p-4 text-xs font-bold text-[#8E8E93] uppercase tracking-widest">
                          Admins
                        </th>
                        <th className="p-4 text-xs font-bold text-[#8E8E93] uppercase tracking-widest text-right">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E0E1E6]">
                      {visibleCompanies.length > 0 ? (
                        visibleCompanies.map((comp) => (
                          <tr
                            key={comp.id}
                            className="hover:bg-gray-50 transition"
                          >
                            <td className="p-4 font-bold text-[#1B173A] flex items-center gap-3">
                              <div className="w-8 h-8 rounded-lg bg-[#F0F0F3] text-[#1B173A] flex items-center justify-center">
                                <Building2 size={16} />
                              </div>
                              <div>
                                <Link
                                  to={`/companies/${comp.id}`}
                                  className="hover:text-[#5850DE] transition-colors font-bold"
                                >
                                  {comp.name}
                                </Link>
                                <div className="text-xs text-[#8E8E93] font-normal">
                                  {comp.email}
                                </div>
                              </div>
                            </td>
                            <td className="p-4">
                              <Badge
                                variant={
                                  comp.status === "active"
                                    ? "secondary"
                                    : "outline"
                                }
                              >
                                {comp.status}
                              </Badge>
                            </td>
                            <td className="p-4 text-[#60646C]">
                              {comp.address || "No address"}
                            </td>
                            <td className="p-4 font-bold text-[#1B173A]">
                              {comp.employees}
                            </td>
                            <td className="p-4 font-bold text-[#1B173A]">
                              {comp.admins}
                            </td>
                            <td className="p-4 text-right">
                              <div className="flex justify-end gap-2">
                                <Button
                                  variant="ghost"
                                  className="px-2"
                                  title="Edit Company"
                                  asChild
                                >
                                  <Link to={`/companies/${comp.id}`}>
                                    <Edit size={18} />
                                  </Link>
                                </Button>
                                <Button
                                  variant="outline"
                                  onClick={() =>
                                    handleInviteAdmin(comp.id, comp.name)
                                  }
                                >
                                  <Mail size={16} className="mr-2" /> Invite
                                  Admin
                                </Button>
                                <Button
                                  variant="outline"
                                  onClick={() =>
                                    handleInviteEmployee(comp.id, comp.name)
                                  }
                                >
                                  <UserPlus size={16} className="mr-2" /> Invite
                                  Employee
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td
                            colSpan={6}
                            className="p-8 text-center text-[#8E8E93]"
                          >
                            {isLoading
                              ? "Loading..."
                              : error
                                ? "Error loading companies"
                                : "No companies found"}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                {companiesResponse && companiesResponse.pages > 1 && (
                  <div className="flex items-center justify-between px-6 py-4 border-t border-[#E0E1E6]">
                    <div className="text-sm text-[#8E8E93]">
                      Page {currentPage} of {companiesResponse.pages} (
                      {companiesResponse.total} total)
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        onClick={() => setCurrentPage(currentPage - 1)}
                        disabled={currentPage <= 1}
                        className="px-3"
                      >
                        <ChevronLeft size={16} />
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => setCurrentPage(currentPage + 1)}
                        disabled={currentPage >= companiesResponse.pages}
                        className="px-3"
                      >
                        <ChevronRight size={16} />
                      </Button>
                    </div>
                  </div>
                )}
              </Card>

              {/* Modal for add actions */}
              {modalState.isOpen && modalState.type === "company" && (
                <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
                  <NewCompanyForm
                    onSuccess={handleCompanyCreated}
                    onCancel={() =>
                      setModalState({ isOpen: false, type: "", data: null })
                    }
                  />
                </div>
              )}

              {/* Invite Company Admin Modal */}
              <InviteCompanyAdminModal
                isOpen={inviteModalState.isOpen}
                onClose={() =>
                  setInviteModalState({
                    isOpen: false,
                    companyId: "",
                    companyName: "",
                  })
                }
                companyId={inviteModalState.companyId}
                companyName={inviteModalState.companyName}
              />

              {/* Invite Company Employee Modal */}
              <InviteCompanyEmployeeModal
                isOpen={inviteEmployeeModalState.isOpen}
                onClose={() =>
                  setInviteEmployeeModalState({
                    isOpen: false,
                    companyId: "",
                    companyName: "",
                  })
                }
                companyId={inviteEmployeeModalState.companyId}
                companyName={inviteEmployeeModalState.companyName}
              />
            </div>
          </div>
        </div>
      </div>
    </RoleGuard>
  );
}
