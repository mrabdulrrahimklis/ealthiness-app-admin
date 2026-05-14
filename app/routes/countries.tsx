import { useState, useEffect, useRef } from "react";
import { useNavigate, Link } from "react-router";
import type { Route } from "./+types/countries";
import {
  Mail,
  Edit,
  Eye,
  Search,
  ChevronDown,
  Check,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Button, Card, Badge, Input } from "~/components/ui";
import AppSidebar from "~/components/shared/AppSidebar";
import Navbar from "~/components/shared/Navbar";
import { RoleGuard } from "~/components/auth/RoleGuard";
import { useUser } from "~/hooks/useAuth";
import { useCountries } from "~/hooks/useAuthApi";
import type { ApiCountry } from "~/lib/auth/types";
import { InviteCountryAdminModal } from "~/components/modals/InviteCountryAdminModal";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Countries - Ealthiness Admin Portal" },
    {
      name: "description",
      content: "Manage countries and regional administrators",
    },
  ];
}

export default function CountriesPage() {
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

  const [inviteModal, setInviteModal] = useState<{
    isOpen: boolean;
    countryId: string;
    countryName: string;
  }>({
    isOpen: false,
    countryId: "",
    countryName: "",
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

  // Fetch countries with React Query
  const {
    data: countriesResponse,
    isLoading,
    error,
    refetch,
  } = useCountries({
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

  // Transform API countries to display format
  const transformCountry = (apiCountry: ApiCountry) => ({
    id: apiCountry._id,
    name: apiCountry.name,
    code: apiCountry.alpha2,
    alpha3: apiCountry.alpha3,
    numericId: apiCountry.numericId,
    regionId: apiCountry.regionId,
    adminCount: apiCountry.adminCount,
    flag: apiCountry.flag,
    createdAt: new Date(apiCountry.createdAt).toLocaleDateString(),
  });

  const visibleCountries =
    countriesResponse?.results?.map(transformCountry) || [];

  // Handle error state
  if (error) {
    console.error("Error fetching countries:", error);
  }

  const handleInviteAdmin = (countryId: string, countryName: string) => {
    setInviteModal({
      isOpen: true,
      countryId,
      countryName,
    });
  };

  const handleCloseInviteModal = () => {
    setInviteModal({
      isOpen: false,
      countryId: "",
      countryName: "",
    });
  };

  return (
    <RoleGuard allowedRoles={["SUPER_ADMIN", "REGIONAL_ADMIN", "COUNTRY_ADMIN"]}>
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
                    Countries
                  </h2>
                  <p className="text-[#60646C] text-sm font-medium mt-1">
                    {countriesResponse
                      ? `Total ${countriesResponse.total} countries in your jurisdiction.`
                      : `Total ${visibleCountries.length} countries in your jurisdiction.`}
                  </p>
                </div>
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
                        placeholder="Search countries..."
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
                          className="flex items-center gap-2 min-w-35 justify-between"
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
                          Loading countries...
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
                          Country
                        </th>
                        <th className="p-4 text-xs font-bold text-[#8E8E93] uppercase tracking-widest">
                          Code
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
                      {visibleCountries.length > 0 ? (
                        visibleCountries.map((country) => (
                          <tr
                            key={country.id}
                            className="hover:bg-gray-50 transition"
                          >
                            <td className="p-4 font-bold text-[#1B173A] flex items-center gap-3">
                              {country.flag ? (
                                <img
                                  src={country.flag.url}
                                  alt={`${country.name} flag`}
                                  className="w-8 h-6 object-cover rounded border shadow-sm"
                                  onError={(e) => {
                                    e.currentTarget.style.display = "none";
                                    const fallback =
                                      document.createElement("div");
                                    fallback.className =
                                      "w-8 h-6 rounded bg-[#E8E6FC] text-[#5850DE] flex items-center justify-center text-xs font-bold";
                                    fallback.textContent = country.code;
                                    e.currentTarget.parentNode?.replaceChild(
                                      fallback,
                                      e.currentTarget,
                                    );
                                  }}
                                />
                              ) : (
                                <div className="w-8 h-6 rounded bg-[#E8E6FC] text-[#5850DE] flex items-center justify-center text-xs font-bold">
                                  {country.code}
                                </div>
                              )}
                              <div>
                                <Link
                                  to={`/countries/${country.id}`}
                                  className="hover:text-[#5850DE] transition-colors font-bold"
                                >
                                  {country.name}
                                </Link>
                              </div>
                            </td>
                            <td className="p-4 font-mono text-[#60646C] text-sm">
                              <div>{country.code}</div>
                              <div className="text-xs text-[#8E8E93]">
                                {country.alpha3}
                              </div>
                            </td>
                            <td className="p-4">
                              <Badge variant="default">
                                {country.adminCount} Admin
                                {country.adminCount !== 1 ? "s" : ""}
                              </Badge>
                            </td>
                            <td className="p-4 text-right">
                              <div className="flex justify-end gap-2">
                                {user?.role === "SUPER_ADMIN" ? (
                                  <Button
                                    variant="ghost"
                                    className="px-2"
                                    title="Edit Country"
                                    onClick={() =>
                                      navigate(`/countries/${country.id}`)
                                    }
                                  >
                                    <Edit size={18} />
                                  </Button>
                                ) : (
                                  <Button
                                    variant="ghost"
                                    className="px-2"
                                    title="View Country"
                                    onClick={() =>
                                      navigate(`/countries/${country.id}`)
                                    }
                                  >
                                    <Eye size={18} />
                                  </Button>
                                )}
                                {user?.role === "SUPER_ADMIN" && (
                                  <Button
                                    variant="outline"
                                    onClick={() =>
                                      handleInviteAdmin(country.id, country.name)
                                    }
                                  >
                                    <Mail size={16} className="mr-2" /> Invite
                                    Admin
                                  </Button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td
                            colSpan={4}
                            className="p-8 text-center text-[#8E8E93]"
                          >
                            {isLoading
                              ? "Loading..."
                              : error
                                ? "Error loading countries"
                                : "No countries found"}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                {countriesResponse && countriesResponse.pages > 1 && (
                  <div className="flex items-center justify-between px-6 py-4 border-t border-[#E0E1E6]">
                    <div className="text-sm text-[#8E8E93]">
                      Page {currentPage} of {countriesResponse.pages} (
                      {countriesResponse.total} total)
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
                        disabled={currentPage >= countriesResponse.pages}
                        className="px-3"
                      >
                        <ChevronRight size={16} />
                      </Button>
                    </div>
                  </div>
                )}
              </Card>

              {/* Invite Country Admin Modal */}
              <InviteCountryAdminModal
                isOpen={inviteModal.isOpen}
                onClose={handleCloseInviteModal}
                countryId={inviteModal.countryId}
                countryName={inviteModal.countryName}
              />
            </div>
          </div>
        </div>
      </div>
    </RoleGuard>
  );
}
