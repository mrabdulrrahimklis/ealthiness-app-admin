import React, { useState, useRef } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router";
import { Link } from "react-router";
import type { Route } from "./+types/country.$id";
import {
  ArrowLeft,
  Globe,
  Mail,
  Users,
  Building,
  MapPin,
  Calendar,
  TrendingUp,
  Activity,
  Award,
  BarChart3,
  Eye,
  Edit,
  Save,
  X,
  Upload,
  ChevronDown,
  Check,
} from "lucide-react";
import {
  Button,
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Badge,
  Textarea,
  Input,
} from "~/components/ui";
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import AppSidebar from "~/components/shared/AppSidebar";
import Navbar from "~/components/shared/Navbar";
import { RoleGuard } from "~/components/auth/RoleGuard";
import { useUser } from "~/hooks/useAuth";
import {
  useCountryDetails,
  useUpdateCountry,
  useRegions,
} from "~/hooks/useAuthApi";
import type { ApiCountry } from "~/lib/auth/types";
import { useParams } from "react-router";
import { InviteCountryAdminModal } from "~/components/modals/InviteCountryAdminModal";

// Mock data for country statistics
const COUNTRY_STATS = {
  userGrowth: [
    { month: "Jan", users: 1250, companies: 45 },
    { month: "Feb", users: 1380, companies: 52 },
    { month: "Mar", users: 1520, companies: 58 },
    { month: "Apr", users: 1680, companies: 64 },
    { month: "May", users: 1850, companies: 71 },
    { month: "Jun", users: 2020, companies: 78 },
  ],
  demographics: [
    { name: "Healthcare", value: 35, color: "#5850DE" },
    { name: "Corporate", value: 28, color: "#248FEC" },
    { name: "Education", value: 22, color: "#4DAB46" },
    { name: "Government", value: 15, color: "#FFB900" },
  ],
  topCompanies: [
    { name: "MediCare Solutions", users: 320, growth: "+12%" },
    { name: "Tech Corp International", users: 285, growth: "+8%" },
    { name: "University Health Center", users: 240, growth: "+15%" },
    { name: "City Health Department", users: 180, growth: "+6%" },
  ],
};

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Country Details - Ealthiness Admin Portal" },
    {
      name: "description",
      content: "View detailed country statistics and administration",
    },
  ];
}

export async function loader({ params }: Route.LoaderArgs) {
  return { countryId: params.id };
}

export default function CountryDetailPage({
  loaderData,
}: Route.ComponentProps) {
  const { countryId } = loaderData;
  const params = useParams();
  const actualCountryId = countryId || params.id || "";

  const user = useUser();
  const navigate = useNavigate();
  const [refreshing, setRefreshing] = useState(false);
  const [adminNotes, setAdminNotes] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [isRegionDropdownOpen, setIsRegionDropdownOpen] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState({
    top: 0,
    left: 0,
    width: 0,
  });
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const regionDropdownRef = useRef<HTMLDivElement>(null);
  const regionButtonRef = useRef<HTMLButtonElement>(null);

  // Check if user can edit (only SUPER_ADMIN)
  const canEdit = user?.role === "COMPANY_ADMIN";

  // Form state
  const [editForm, setEditForm] = useState({
    name: "",
    regionId: "",
    alpha2: "",
    alpha3: "",
    flag: null as File | null,
  });
  const [flagPreview, setFlagPreview] = useState<string | null>(null);

  // Fetch country details from API
  const {
    data: apiCountry,
    isLoading: isLoadingCountry,
    error: countryError,
  } = useCountryDetails(actualCountryId);

  // Fetch regions for dropdown
  const { data: regionsResponse } = useRegions({ limit: 100 });

  // Update country mutation
  const updateCountryMutation = useUpdateCountry();

  const handleRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1500);
  };

  // Initialize form when country data loads
  React.useEffect(() => {
    if (apiCountry) {
      setEditForm({
        name: apiCountry.name,
        regionId: apiCountry.regionId || apiCountry.region?._id || "",
        alpha2: apiCountry.alpha2,
        alpha3: apiCountry.alpha3,
        flag: null,
      });
    }
  }, [apiCountry]);

  // Cleanup preview URL on component unmount
  React.useEffect(() => {
    return () => {
      if (flagPreview) {
        URL.revokeObjectURL(flagPreview);
      }
    };
  }, [flagPreview]);

  // Close dropdown when clicking outside
  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        regionDropdownRef.current &&
        !regionDropdownRef.current.contains(event.target as Node) &&
        regionButtonRef.current &&
        !regionButtonRef.current.contains(event.target as Node)
      ) {
        setIsRegionDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Handle scroll and resize events to close dropdown
  React.useEffect(() => {
    if (!isRegionDropdownOpen) return;

    const handleScroll = (event: Event) => {
      // Don't close if scrolling inside the dropdown itself
      if (
        regionDropdownRef.current &&
        regionDropdownRef.current.contains(event.target as Node)
      ) {
        return;
      }
      setIsRegionDropdownOpen(false);
    };

    const handleResize = () => {
      setIsRegionDropdownOpen(false);
    };

    // Listen to scroll events on the document and all scrollable containers
    document.addEventListener("scroll", handleScroll, true);
    window.addEventListener("resize", handleResize);

    return () => {
      document.removeEventListener("scroll", handleScroll, true);
      window.removeEventListener("resize", handleResize);
    };
  }, [isRegionDropdownOpen]);

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleRegionDropdownToggle = () => {
    if (!isRegionDropdownOpen && regionButtonRef.current) {
      const rect = regionButtonRef.current.getBoundingClientRect();
      setDropdownPosition({
        top: rect.bottom + 4, // Use viewport coordinates directly
        left: rect.left,
        width: rect.width,
      });
    }
    setIsRegionDropdownOpen(!isRegionDropdownOpen);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    // Reset form to original values
    if (apiCountry) {
      setEditForm({
        name: apiCountry.name,
        regionId: apiCountry.regionId || apiCountry.region?._id || "",
        alpha2: apiCountry.alpha2,
        alpha3: apiCountry.alpha3,
        flag: null,
      });
    }
    // Clean up preview URL
    if (flagPreview) {
      URL.revokeObjectURL(flagPreview);
      setFlagPreview(null);
    }
  };

  const handleSave = async () => {
    try {
      const updateData: any = {};

      // Only include fields that have changed
      if (editForm.name !== apiCountry?.name) updateData.name = editForm.name;
      const currentRegionId = apiCountry?.regionId || apiCountry?.region?._id;
      if (editForm.regionId !== currentRegionId)
        updateData.regionId = editForm.regionId;
      if (editForm.alpha2 !== apiCountry?.alpha2)
        updateData.alpha2 = editForm.alpha2;
      if (editForm.alpha3 !== apiCountry?.alpha3)
        updateData.alpha3 = editForm.alpha3;
      if (editForm.flag) updateData.flag = editForm.flag;

      // Only make request if there are changes
      if (Object.keys(updateData).length > 0) {
        await updateCountryMutation.mutateAsync({
          countryId: actualCountryId,
          data: updateData,
        });
      }

      setIsEditing(false);
      // Clean up preview URL after successful save
      if (flagPreview) {
        URL.revokeObjectURL(flagPreview);
        setFlagPreview(null);
      }
    } catch (error) {
      console.error("Error updating country:", error);
      // You might want to show an error toast here
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setEditForm((prev) => ({ ...prev, flag: file }));

      // Create preview URL for the selected image
      const previewUrl = URL.createObjectURL(file);
      setFlagPreview(previewUrl);
    }
  };

  // Transform API country to display format
  const transformApiCountryToDetails = (apiCountry: ApiCountry) => ({
    id: apiCountry._id,
    name: apiCountry.name,
    code: apiCountry.alpha2,
    alpha3: apiCountry.alpha3,
    numericId: apiCountry.numericId,
    regionId: apiCountry.regionId || apiCountry.region?._id,
    regionName: apiCountry.region?.name,
    adminCount: apiCountry.admins?.length || 0, // Calculate from admins array
    flag: apiCountry.flag,
    createdAt: new Date(apiCountry.createdAt).toLocaleDateString(),
    totalUsers: apiCountry.userCount || 0, // Use real data from API with fallback
    totalCompanies: apiCountry.companyCount || 0, // Use real data from API with fallback
    monthlyGrowth: "+12%", // Mock data - would need historical data to calculate
    healthScore: 87, // Mock data - would need analytics to calculate
  });

  const handleLogout = () => {
    navigate("/");
  };

  const handleOpenInviteModal = () => {
    setIsInviteModalOpen(true);
  };

  const handleCloseInviteModal = () => {
    setIsInviteModalOpen(false);
  };

  if (!user || isLoadingCountry) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex items-center space-x-2">
          <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-gray-600">
            {!user ? "Loading..." : "Loading country details..."}
          </span>
        </div>
      </div>
    );
  }

  if (countryError) {
    return (
      <RoleGuard
        allowedRoles={["SUPER_ADMIN", "REGIONAL_ADMIN", "COUNTRY_ADMIN"]}
      >
        <div className="min-h-screen bg-[#F8F9FB] font-sans flex">
          <AppSidebar user={user} />
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-red-600 mb-2">
                Country Not Found
              </h2>
              <p className="text-gray-600 mb-4">
                The country you're looking for could not be found.
              </p>
              <Link to="/countries" className="text-blue-500 hover:underline">
                Back to Countries
              </Link>
            </div>
          </div>
        </div>
      </RoleGuard>
    );
  }

  if (!apiCountry) {
    return null;
  }

  // Use the transformed country data
  const country = transformApiCountryToDetails(apiCountry);

  return (
    <RoleGuard
      allowedRoles={["SUPER_ADMIN", "REGIONAL_ADMIN", "COUNTRY_ADMIN"]}
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
            <div className="animate-in fade-in slide-in-from-right-8 duration-500 pb-12">
              <Link
                to="/countries"
                className="mb-6 flex items-center text-[#5850DE] font-bold hover:bg-[#F0F0F3] px-4 py-2 rounded-xl transition w-fit gap-2"
              >
                <ArrowLeft size={18} />
                Back to Countries
              </Link>

              {/* Hero Country Banner */}
              <div className="bg-[#1B173A] rounded-[32px] p-8 text-white shadow-2xl mb-8 relative overflow-hidden flex flex-col md:flex-row items-center md:items-start gap-8 border border-[#38383A]">
                <div className="absolute right-0 top-0 w-1/2 h-full bg-gradient-to-l from-[#5850DE]/40 to-transparent"></div>

                <div className="relative z-10 w-28 h-28 rounded-3xl bg-gradient-to-br from-[#5850DE] to-[#248FEC] flex items-center justify-center shadow-[0_0_40px_rgba(88,80,222,0.5)] border-4 border-[#1B173A]">
                  {flagPreview ? (
                    <img
                      src={flagPreview}
                      alt={`${country.name} flag preview`}
                      className="w-20 h-16 object-cover rounded-lg"
                    />
                  ) : country.flag ? (
                    <img
                      src={country.flag.url}
                      alt={`${country.name} flag`}
                      className="w-20 h-16 object-cover rounded-lg"
                    />
                  ) : (
                    <div className="text-4xl font-extrabold">
                      {country.code}
                    </div>
                  )}
                  {isEditing && !canEdit && (
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="absolute -bottom-2 -right-2 w-8 h-8 bg-[#5850DE] rounded-full flex items-center justify-center hover:bg-[#4A42C7] transition-colors"
                      title="Change flag"
                    >
                      <Upload size={14} />
                    </button>
                  )}
                </div>

                <div className="relative z-10 text-center md:text-left flex-1">
                  <div className="flex flex-col md:flex-row md:items-center gap-4 mb-2">
                    <div className="flex items-center gap-3 justify-center md:justify-start">
                      <h2 className="text-4xl font-extrabold">
                        {country.name}
                      </h2>
                      <Globe size={24} className="text-blue-400" />
                      {!isEditing && !canEdit && (
                        <button
                          onClick={handleEdit}
                          className="ml-4 p-2 hover:bg-white/10 rounded-lg transition-colors"
                          title="Edit country"
                        >
                          <Edit size={20} />
                        </button>
                      )}
                    </div>
                    <Badge variant="secondary">Active</Badge>
                  </div>
                  <p className="text-[#8E8E93] font-medium mb-6 text-lg">
                    {country.code} • {country.alpha3} • {country.regionName} •
                    Created {country.createdAt}
                  </p>

                  <div className="flex flex-wrap justify-center md:justify-start gap-6">
                    <div>
                      <p className="text-[10px] text-[#8E8E93] uppercase font-bold">
                        Total Users
                      </p>
                      <p className="font-bold text-xl">
                        {country.totalUsers.toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] text-[#8E8E93] uppercase font-bold">
                        Companies
                      </p>
                      <p className="font-bold text-xl">
                        {country.totalCompanies}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] text-[#8E8E93] uppercase font-bold">
                        Admins
                      </p>
                      <p className="font-bold text-xl">{country.adminCount}</p>
                    </div>
                  </div>
                </div>

                {/* Hidden file input for flag upload */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* LEFT COLUMN */}
                <div className="lg:col-span-8 space-y-8">
                  {/* Edit Form / Admin Notes Card */}
                  <Card className="p-8 bg-gradient-to-br from-[#F8F9FB] to-white border-[#E8E6FC]">
                    <div className="flex justify-between items-start mb-4">
                      <h3 className="text-xl font-extrabold text-[#1B173A] flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#5850DE] to-[#248FEC] text-white flex items-center justify-center">
                          {isEditing ? <Edit size={20} /> : <Mail size={20} />}
                        </div>
                        {isEditing
                          ? "Edit Country Information"
                          : "Country Administration Notes"}
                      </h3>
                    </div>

                    {isEditing ? (
                      <div className="space-y-6 ">
                        {/* Country Name */}
                        <div>
                          <label className="block text-xs font-bold text-[#8E8E93] uppercase tracking-wider mb-2">
                            Country Name
                          </label>
                          <Input
                            value={editForm.name}
                            onChange={(e) =>
                              setEditForm((prev) => ({
                                ...prev,
                                name: e.target.value,
                              }))
                            }
                            placeholder="Enter country name"
                            className="w-full"
                          />
                        </div>

                        {/* Region */}
                        <div>
                          <label className="block text-xs font-bold text-[#8E8E93] uppercase tracking-wider mb-2">
                            Region
                          </label>
                          <div className="relative">
                            <Button
                              ref={regionButtonRef}
                              type="button"
                              variant="outline"
                              onClick={handleRegionDropdownToggle}
                              className={`justify-between w-full bg-white border rounded-xl px-4 py-2.5 text-sm font-semibold transition-all duration-200 shadow-sm hover:shadow-md border-[#E0E1E6] text-[#1B173A] hover:border-[#5850DE] focus:border-[#5850DE] focus:ring-2 focus:ring-[#5850DE]/10`}
                            >
                              {(() => {
                                const selectedRegion =
                                  regionsResponse?.results?.find(
                                    (region) =>
                                      region._id === editForm.regionId,
                                  );

                                if (selectedRegion) return selectedRegion.name;
                                return "Select a region";
                              })()}
                              <ChevronDown
                                size={16}
                                className={`text-[#8E8E93] transition-transform duration-200 ${
                                  isRegionDropdownOpen ? "rotate-180" : ""
                                }`}
                              />
                            </Button>
                          </div>
                        </div>

                        {/* Portal Dropdown */}
                        {isRegionDropdownOpen &&
                          typeof document !== "undefined" &&
                          createPortal(
                            <div
                              ref={regionDropdownRef}
                              className="fixed bg-white border border-[#E0E1E6] rounded-xl shadow-xl z-[9999] py-1 max-h-60 overflow-y-auto"
                              style={{
                                top: dropdownPosition.top,
                                left: dropdownPosition.left,
                                width: dropdownPosition.width,
                              }}
                            >
                              <button
                                type="button"
                                onClick={() => {
                                  setEditForm((prev) => ({
                                    ...prev,
                                    regionId: "",
                                  }));
                                  setIsRegionDropdownOpen(false);
                                }}
                                className={`w-full px-4 py-2.5 text-left text-sm font-medium hover:bg-[#F0F0F3] transition-colors flex items-center justify-between ${
                                  editForm.regionId === ""
                                    ? "text-[#5850DE] bg-[#F0F0F3]"
                                    : "text-[#1B173A]"
                                }`}
                              >
                                Select a region
                                {editForm.regionId === "" && (
                                  <Check size={16} className="text-[#5850DE]" />
                                )}
                              </button>
                              {regionsResponse?.results?.map((region) => (
                                <button
                                  key={region._id}
                                  type="button"
                                  onClick={() => {
                                    setEditForm((prev) => ({
                                      ...prev,
                                      regionId: region._id,
                                    }));
                                    setIsRegionDropdownOpen(false);
                                  }}
                                  className={`w-full px-4 py-2.5 text-left text-sm font-medium hover:bg-[#F0F0F3] transition-colors flex items-center justify-between ${
                                    editForm.regionId === region._id
                                      ? "text-[#5850DE] bg-[#F0F0F3]"
                                      : "text-[#1B173A]"
                                  }`}
                                >
                                  {region.name}
                                  {editForm.regionId === region._id && (
                                    <Check
                                      size={16}
                                      className="text-[#5850DE]"
                                    />
                                  )}
                                </button>
                              ))}
                            </div>,
                            document.body,
                          )}

                        {/* Country Codes */}
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs font-bold text-[#8E8E93] uppercase tracking-wider mb-2">
                              Alpha-2 Code
                            </label>
                            <Input
                              value={editForm.alpha2}
                              onChange={(e) =>
                                setEditForm((prev) => ({
                                  ...prev,
                                  alpha2: e.target.value.toUpperCase(),
                                }))
                              }
                              placeholder="US"
                              maxLength={2}
                              className="w-full uppercase"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-[#8E8E93] uppercase tracking-wider mb-2">
                              Alpha-3 Code
                            </label>
                            <Input
                              value={editForm.alpha3}
                              onChange={(e) =>
                                setEditForm((prev) => ({
                                  ...prev,
                                  alpha3: e.target.value.toUpperCase(),
                                }))
                              }
                              placeholder="USA"
                              maxLength={3}
                              className="w-full uppercase"
                            />
                          </div>
                        </div>

                        {/* Flag Upload Info */}
                        {editForm.flag && (
                          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                            <div className="flex items-start gap-4">
                              <div className="flex-1">
                                <p className="text-sm text-green-800 font-medium">
                                  New flag selected: {editForm.flag.name}
                                </p>
                                <p className="text-xs text-green-600 mt-1">
                                  This will replace the current flag when you
                                  save.
                                </p>
                              </div>
                              {flagPreview && (
                                <div className="w-16 h-12 border-2 border-green-300 rounded-lg overflow-hidden">
                                  <img
                                    src={flagPreview}
                                    alt="Flag preview"
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Save and Cancel Buttons */}
                        <div className="flex gap-3 pt-4 border-t border-[#E0E1E6]">
                          <Button
                            onClick={handleSave}
                            disabled={updateCountryMutation.isPending}
                            className="bg-green-600 hover:bg-green-700 flex-1"
                          >
                            <Save size={16} className="mr-2" />
                            {updateCountryMutation.isPending
                              ? "Saving..."
                              : "Save Changes"}
                          </Button>
                          <Button
                            onClick={handleCancelEdit}
                            variant="outline"
                            className="flex-1"
                          >
                            <X size={16} className="mr-2" />
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="bg-white p-4 rounded-xl border border-[#E0E1E6] shadow-sm">
                        <label className="block text-xs font-bold text-[#8E8E93] uppercase tracking-wider mb-2">
                          Administrative Notes & Updates
                        </label>
                        <Textarea
                          placeholder="Add notes about country administration, policy changes, or important updates..."
                          value={adminNotes}
                          onChange={(e) => setAdminNotes(e.target.value)}
                          className="min-h-[120px]"
                        />
                      </div>
                    )}
                  </Card>

                  {/* User Growth Chart */}
                  <Card className="p-8">
                    <div className="flex justify-between items-center mb-8">
                      <h3 className="text-xl font-extrabold text-[#1B173A] flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-[#E8E6FC] text-[#5850DE] flex items-center justify-center">
                          <TrendingUp size={20} />
                        </div>
                        Growth Analytics
                      </h3>
                      <Badge
                        variant="outline"
                        className="bg-green-50 text-green-700"
                      >
                        {country.monthlyGrowth} this month
                      </Badge>
                    </div>

                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={COUNTRY_STATS.userGrowth}>
                          <CartesianGrid
                            strokeDasharray="3 3"
                            stroke="#E0E1E6"
                          />
                          <XAxis
                            dataKey="month"
                            tick={{ fontSize: 12, fill: "#8E8E93" }}
                          />
                          <YAxis tick={{ fontSize: 12, fill: "#8E8E93" }} />
                          <RechartsTooltip
                            contentStyle={{
                              borderRadius: "12px",
                              border: "none",
                              boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                              backgroundColor: "white",
                            }}
                          />
                          <Line
                            type="monotone"
                            dataKey="users"
                            stroke="#5850DE"
                            strokeWidth={3}
                            dot={{ fill: "#5850DE", strokeWidth: 2, r: 6 }}
                            name="Users"
                          />
                          <Line
                            type="monotone"
                            dataKey="companies"
                            stroke="#248FEC"
                            strokeWidth={3}
                            dot={{ fill: "#248FEC", strokeWidth: 2, r: 6 }}
                            name="Companies"
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </Card>

                  {/* Top Companies */}
                  <Card className="p-8">
                    <h3 className="text-xl font-extrabold text-[#1B173A] mb-6 flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-[#FFF4E5] text-[#FFB900] flex items-center justify-center">
                        <Building size={20} />
                      </div>
                      Top Companies by Users
                    </h3>
                    <div className="space-y-4">
                      {COUNTRY_STATS.topCompanies.map((company, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between p-4 bg-white border border-[#E0E1E6] rounded-2xl hover:border-[#5850DE] transition-colors group cursor-pointer"
                        >
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-full bg-[#F8F9FB] flex items-center justify-center text-[#1B173A] group-hover:bg-[#5850DE] group-hover:text-white transition-colors">
                              <Building size={20} />
                            </div>
                            <div>
                              <h4 className="font-bold text-[#1B173A] text-lg">
                                {company.name}
                              </h4>
                              <p className="text-sm font-medium text-[#8E8E93]">
                                {company.users} active users
                              </p>
                            </div>
                          </div>
                          <Badge
                            variant="default"
                            className="bg-green-50 text-green-700"
                          >
                            {company.growth}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </Card>
                </div>

                {/* RIGHT COLUMN */}
                <div className="lg:col-span-4 space-y-8">
                  {/* Quick Stats */}
                  <Card className="p-6">
                    <h3 className="text-lg font-extrabold text-[#1B173A] mb-6 flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-[#E8E6FC] text-[#5850DE] flex items-center justify-center">
                        <BarChart3 size={16} />
                      </div>
                      Quick Statistics
                    </h3>

                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-3 bg-[#F8F9FB] rounded-xl border border-[#E0E1E6]">
                        <div className="flex items-center gap-3">
                          <Users className="text-[#5850DE]" size={20} />
                          <span className="font-medium text-[#1B173A]">
                            Total Users
                          </span>
                        </div>
                        <span className="font-bold text-[#1B173A]">
                          {country.totalUsers.toLocaleString()}
                        </span>
                      </div>

                      <div className="flex items-center justify-between p-3 bg-[#F8F9FB] rounded-xl border border-[#E0E1E6]">
                        <div className="flex items-center gap-3">
                          <Building className="text-[#248FEC]" size={20} />
                          <span className="font-medium text-[#1B173A]">
                            Companies
                          </span>
                        </div>
                        <span className="font-bold text-[#1B173A]">
                          {country.totalCompanies}
                        </span>
                      </div>

                      <div className="flex items-center justify-between p-3 bg-[#F8F9FB] rounded-xl border border-[#E0E1E6]">
                        <div className="flex items-center gap-3">
                          <Award className="text-[#FFB900]" size={20} />
                          <span className="font-medium text-[#1B173A]">
                            Admins
                          </span>
                        </div>
                        <span className="font-bold text-[#1B173A]">
                          {country.adminCount}
                        </span>
                      </div>

                      <div className="flex items-center justify-between p-3 bg-[#F8F9FB] rounded-xl border border-[#E0E1E6]">
                        <div className="flex items-center gap-3">
                          <Activity className="text-[#4DAB46]" size={20} />
                          <span className="font-medium text-[#1B173A]">
                            Health Score
                          </span>
                        </div>
                        <span className="font-bold text-[#4DAB46]">
                          {country.healthScore}/100
                        </span>
                      </div>
                    </div>
                  </Card>

                  {/* Industry Distribution */}
                  <Card className="p-6">
                    <h3 className="text-lg font-extrabold text-[#1B173A] mb-6 flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-[#E5F6E4] text-[#4DAB46] flex items-center justify-center">
                        <Eye size={16} />
                      </div>
                      Industry Distribution
                    </h3>

                    <div className="h-48">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={COUNTRY_STATS.demographics}
                            cx="50%"
                            cy="50%"
                            outerRadius={60}
                            dataKey="value"
                          >
                            {COUNTRY_STATS.demographics.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <RechartsTooltip
                            contentStyle={{
                              borderRadius: "8px",
                              border: "none",
                              boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                            }}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>

                    <div className="space-y-2">
                      {COUNTRY_STATS.demographics.map((item, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between"
                        >
                          <div className="flex items-center gap-2">
                            <div
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: item.color }}
                            ></div>
                            <span className="text-sm font-medium text-[#1B173A]">
                              {item.name}
                            </span>
                          </div>
                          <span className="text-sm font-bold text-[#8E8E93]">
                            {item.value}%
                          </span>
                        </div>
                      ))}
                    </div>
                  </Card>

                  {/* Action Buttons */}
                  <Card className="p-6">
                    <h3 className="text-lg font-extrabold text-[#1B173A] mb-4">
                      Quick Actions
                    </h3>
                    <div className="space-y-3">
                      <Button
                        className="w-full"
                        variant="outline"
                        onClick={handleOpenInviteModal}
                        disabled={canEdit}
                      >
                        <Mail size={16} className="mr-2" />
                        Invite Admin
                      </Button>
                      <Link to={`/countries/${actualCountryId}/users`}>
                        <Button className="w-full mb-3" variant="outline">
                          <Eye size={16} className="mr-2" />
                          View All Users
                        </Button>
                      </Link>
                      <Link to={`/countries/${actualCountryId}/companies`}>
                        <Button className="w-full" variant="outline">
                          <Building size={16} className="mr-2" />
                          Manage Companies
                        </Button>
                      </Link>
                    </div>
                  </Card>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Admin Invitation Modal */}
        <InviteCountryAdminModal
          isOpen={isInviteModalOpen}
          onClose={handleCloseInviteModal}
          countryId={actualCountryId}
          countryName={country.name}
        />
      </div>
    </RoleGuard>
  );
}
