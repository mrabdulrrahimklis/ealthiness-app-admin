import React, { useState, useRef } from "react";
import { useNavigate } from "react-router";
import { Link } from "react-router";
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
  User,
  Users2,
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
import { useRegionDetails, useUpdateRegion } from "~/hooks/useAuthApi";
import type { ApiRegion } from "~/lib/auth/types";
import { useParams } from "react-router";
import { InviteRegionAdminModal } from "~/components/modals/InviteRegionAdminModal";

// Mock data for region statistics
const REGION_STATS = {
  countryGrowth: [
    { month: "Jan", countries: 12, users: 5250 },
    { month: "Feb", countries: 14, users: 5680 },
    { month: "Mar", countries: 16, users: 6120 },
    { month: "Apr", countries: 18, users: 6580 },
    { month: "May", countries: 20, users: 7050 },
    { month: "Jun", countries: 22, users: 7520 },
  ],
  demographics: [
    { name: "Healthcare", value: 40, color: "#5850DE" },
    { name: "Corporate", value: 30, color: "#248FEC" },
    { name: "Education", value: 20, color: "#4DAB46" },
    { name: "Government", value: 10, color: "#FFB900" },
  ],
  topCountries: [
    { name: "United States", users: 1520, companies: 45, growth: "+12%" },
    { name: "Canada", users: 1285, companies: 38, growth: "+8%" },
    { name: "United Kingdom", users: 1140, companies: 42, growth: "+15%" },
    { name: "Germany", users: 980, companies: 35, growth: "+6%" },
  ],
};

export function meta() {
  return [
    { title: "Region Details - Ealthiness Admin Portal" },
    {
      name: "description",
      content: "View detailed region statistics and administration",
    },
  ];
}

export async function loader({ params }: { params: { id: string } }) {
  return { regionId: params.id };
}

export default function RegionDetailPage({
  loaderData,
}: {
  loaderData: { regionId: string };
}) {
  const { regionId } = loaderData;
  const params = useParams();
  const actualRegionId = regionId || params.id || "";

  const user = useUser();
  const navigate = useNavigate();
  const [refreshing, setRefreshing] = useState(false);
  const [adminNotes, setAdminNotes] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Check if user can edit (SUPER_ADMIN and REGIONAL_ADMIN)
  const canEdit =
    user?.role === "SUPER_ADMIN" || user?.role === "REGIONAL_ADMIN";

  // Form state
  const [editForm, setEditForm] = useState({
    name: "",
    image: null as File | null,
  });
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  // Fetch region details from API
  const {
    data: apiRegion,
    isLoading: isLoadingRegion,
    error: regionError,
  } = useRegionDetails(actualRegionId);

  // Update region mutation
  const updateRegionMutation = useUpdateRegion();

  const handleRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1500);
  };

  // Initialize form when region data loads
  React.useEffect(() => {
    if (apiRegion) {
      setEditForm({
        name: apiRegion.name,
        image: null,
      });
    }
  }, [apiRegion]);

  // Cleanup preview URL on component unmount
  React.useEffect(() => {
    return () => {
      if (imagePreview) {
        URL.revokeObjectURL(imagePreview);
      }
    };
  }, [imagePreview]);

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    // Reset form to original values
    if (apiRegion) {
      setEditForm({
        name: apiRegion.name,
        image: null,
      });
    }
    // Clean up preview URL
    if (imagePreview) {
      URL.revokeObjectURL(imagePreview);
      setImagePreview(null);
    }
  };

  const handleSave = async () => {
    try {
      const updateData: any = {};

      // Only include fields that have changed
      if (editForm.name !== apiRegion?.name) updateData.name = editForm.name;
      if (editForm.image) updateData.image = editForm.image;

      // Only make request if there are changes
      if (Object.keys(updateData).length > 0) {
        await updateRegionMutation.mutateAsync({
          regionId: actualRegionId,
          data: updateData,
        });
      }

      setIsEditing(false);
      // Clean up preview URL after successful save
      if (imagePreview) {
        URL.revokeObjectURL(imagePreview);
        setImagePreview(null);
      }
    } catch (error) {
      console.error("Error updating region:", error);
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setEditForm((prev) => ({ ...prev, image: file }));

      // Create preview URL for the selected image
      const previewUrl = URL.createObjectURL(file);
      setImagePreview(previewUrl);
    }
  };

  // Transform API region to display format
  const transformApiRegionToDetails = (apiRegion: ApiRegion) => ({
    id: apiRegion._id,
    name: apiRegion.name,
    adminCount: apiRegion.admins?.length || 0, // Calculate from admins array
    image: apiRegion.image?.url || null, // Extract URL from image object
    createdAt: new Date(apiRegion.createdAt).toLocaleDateString(),
    totalCountries: apiRegion.countryCount, // Use real data from API
    totalUsers: apiRegion.userCount, // Use real data from API
    totalCompanies: apiRegion.companyCount, // Use real data from API
    monthlyGrowth: "+18%", // Mock data - would need historical data to calculate
    healthScore: 92, // Mock data - would need analytics to calculate
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

  if (!user || isLoadingRegion) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex items-center space-x-2">
          <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-gray-600">
            {!user ? "Loading..." : "Loading region details..."}
          </span>
        </div>
      </div>
    );
  }

  if (regionError) {
    return (
      <RoleGuard
        allowedRoles={["SUPER_ADMIN", "COUNTRY_ADMIN", "REGIONAL_ADMIN"]}
      >
        <div className="min-h-screen bg-[#F8F9FB] font-sans flex">
          <AppSidebar user={user} />
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-red-600 mb-2">
                Region Not Found
              </h2>
              <p className="text-gray-600 mb-4">
                The region you're looking for could not be found.
              </p>
              <Link to="/regions" className="text-blue-500 hover:underline">
                Back to Regions
              </Link>
            </div>
          </div>
        </div>
      </RoleGuard>
    );
  }

  if (!apiRegion) {
    return null;
  }

  // Use the transformed region data
  const region = transformApiRegionToDetails(apiRegion);

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
            <div className="animate-in fade-in slide-in-from-right-8 duration-500 pb-12">
              <Link
                to="/regions"
                className="mb-6 flex items-center text-[#5850DE] font-bold hover:bg-[#F0F0F3] px-4 py-2 rounded-xl transition w-fit gap-2"
              >
                <ArrowLeft size={18} />
                Back to Regions
              </Link>

              {/* Hero Region Banner */}
              <div className="bg-[#1B173A] rounded-[32px] p-8 text-white shadow-2xl mb-8 relative overflow-hidden flex flex-col md:flex-row items-center md:items-start gap-8 border border-[#38383A]">
                <div className="absolute right-0 top-0 w-1/2 h-full bg-gradient-to-l from-[#5850DE]/40 to-transparent"></div>

                <div className="relative z-10 w-28 h-28 rounded-3xl bg-gradient-to-br from-[#5850DE] to-[#248FEC] flex items-center justify-center shadow-[0_0_40px_rgba(88,80,222,0.5)] border-4 border-[#1B173A]">
                  {imagePreview ? (
                    <img
                      src={imagePreview}
                      alt={`${region.name} region preview`}
                      className="w-20 h-20 object-cover rounded-lg"
                    />
                  ) : region.image ? (
                    <img
                      src={region.image}
                      alt={`${region.name} region`}
                      className="w-20 h-20 object-cover rounded-lg"
                    />
                  ) : (
                    <div className="text-4xl font-extrabold">
                      {region.name.substring(0, 2).toUpperCase()}
                    </div>
                  )}
                  {isEditing && canEdit && (
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="absolute -bottom-2 -right-2 w-8 h-8 bg-[#5850DE] rounded-full flex items-center justify-center hover:bg-[#4A42C7] transition-colors"
                      title="Change image"
                    >
                      <Upload size={14} />
                    </button>
                  )}
                </div>

                <div className="relative z-10 text-center md:text-left flex-1">
                  <div className="flex flex-col md:flex-row md:items-center gap-4 mb-2">
                    <div className="flex items-center gap-3 justify-center md:justify-start">
                      <h2 className="text-4xl font-extrabold">{region.name}</h2>
                      <Globe size={24} className="text-blue-400" />
                      {!isEditing && canEdit && (
                        <button
                          onClick={handleEdit}
                          className="ml-4 p-2 hover:bg-white/10 rounded-lg transition-colors"
                          title="Edit region"
                        >
                          <Edit size={20} />
                        </button>
                      )}
                    </div>
                    <Badge variant="secondary">Active</Badge>
                  </div>
                  <p className="text-[#8E8E93] font-medium mb-6 text-lg">
                    Created {region.createdAt}
                  </p>

                  <div className="flex flex-wrap justify-center md:justify-start gap-6">
                    <div>
                      <p className="text-[10px] text-[#8E8E93] uppercase font-bold">
                        Total Countries
                      </p>
                      <p className="font-bold text-xl">
                        {region.totalCountries}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] text-[#8E8E93] uppercase font-bold">
                        Total Users
                      </p>
                      <p className="font-bold text-xl">
                        {region.totalUsers.toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] text-[#8E8E93] uppercase font-bold">
                        Companies
                      </p>
                      <p className="font-bold text-xl">
                        {region.totalCompanies}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] text-[#8E8E93] uppercase font-bold">
                        Admins
                      </p>
                      <p className="font-bold text-xl">{region.adminCount}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-[#8E8E93] uppercase font-bold">
                        Health Score
                      </p>
                      <p className="font-bold text-xl text-[#248FEC]">
                        {region.healthScore}/100
                      </p>
                    </div>
                  </div>
                </div>

                {/* Hidden file input for image upload */}
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
                          ? "Edit Region Information"
                          : "Region Administration Notes"}
                      </h3>
                    </div>

                    {isEditing ? (
                      <div className="space-y-6">
                        {/* Region Name */}
                        <div>
                          <label className="block text-xs font-bold text-[#8E8E93] uppercase tracking-wider mb-2">
                            Region Name
                          </label>
                          <Input
                            value={editForm.name}
                            onChange={(e) =>
                              setEditForm((prev) => ({
                                ...prev,
                                name: e.target.value,
                              }))
                            }
                            placeholder="Enter region name"
                            className="w-full"
                          />
                        </div>

                        {/* Image Upload Info */}
                        {editForm.image && (
                          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                            <div className="flex items-start gap-4">
                              <div className="flex-1">
                                <p className="text-sm text-green-800 font-medium">
                                  New image selected: {editForm.image.name}
                                </p>
                                <p className="text-xs text-green-600 mt-1">
                                  This will replace the current image when you
                                  save.
                                </p>
                              </div>
                              {imagePreview && (
                                <div className="w-16 h-16 border-2 border-green-300 rounded-lg overflow-hidden">
                                  <img
                                    src={imagePreview}
                                    alt="Image preview"
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
                            disabled={updateRegionMutation.isPending}
                            className="bg-green-600 hover:bg-green-700 flex-1"
                          >
                            <Save size={16} className="mr-2" />
                            {updateRegionMutation.isPending
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
                          placeholder="Add notes about regional administration, policy changes, or important updates..."
                          value={adminNotes}
                          onChange={(e) => setAdminNotes(e.target.value)}
                          className="min-h-[120px]"
                        />
                      </div>
                    )}
                  </Card>

                  {/* Growth Chart */}
                  <Card className="p-8">
                    <div className="flex justify-between items-center mb-8">
                      <h3 className="text-xl font-extrabold text-[#1B173A] flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-[#E8E6FC] text-[#5850DE] flex items-center justify-center">
                          <TrendingUp size={20} />
                        </div>
                        Regional Growth Analytics
                      </h3>
                      <Badge
                        variant="outline"
                        className="bg-green-50 text-green-700"
                      >
                        {region.monthlyGrowth} this month
                      </Badge>
                    </div>

                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={REGION_STATS.countryGrowth}>
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
                            dataKey="countries"
                            stroke="#5850DE"
                            strokeWidth={3}
                            dot={{ fill: "#5850DE", strokeWidth: 2, r: 6 }}
                            name="Countries"
                          />
                          <Line
                            type="monotone"
                            dataKey="users"
                            stroke="#248FEC"
                            strokeWidth={3}
                            dot={{ fill: "#248FEC", strokeWidth: 2, r: 6 }}
                            name="Users"
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </Card>

                  {/* Top Countries */}
                  <Card className="p-8">
                    <h3 className="text-xl font-extrabold text-[#1B173A] mb-6 flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-[#FFF4E5] text-[#FFB900] flex items-center justify-center">
                        <Globe size={20} />
                      </div>
                      Top Countries by Users
                    </h3>
                    <div className="space-y-4">
                      {REGION_STATS.topCountries.map((country, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between p-4 bg-white border border-[#E0E1E6] rounded-2xl hover:border-[#5850DE] transition-colors group cursor-pointer"
                        >
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-full bg-[#F8F9FB] flex items-center justify-center text-[#1B173A] group-hover:bg-[#5850DE] group-hover:text-white transition-colors">
                              <Globe size={20} />
                            </div>
                            <div>
                              <h4 className="font-bold text-[#1B173A] text-lg">
                                {country.name}
                              </h4>
                              <p className="text-sm font-medium text-[#8E8E93]">
                                {country.users} users • {country.companies}{" "}
                                companies
                              </p>
                            </div>
                          </div>
                          <Badge
                            variant="default"
                            className="bg-green-50 text-green-700"
                          >
                            {country.growth}
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
                          <Globe className="text-[#5850DE]" size={20} />
                          <span className="font-medium text-[#1B173A]">
                            Countries
                          </span>
                        </div>
                        <span className="font-bold text-[#1B173A]">
                          {region.totalCountries}
                        </span>
                      </div>

                      <div className="flex items-center justify-between p-3 bg-[#F8F9FB] rounded-xl border border-[#E0E1E6]">
                        <div className="flex items-center gap-3">
                          <Users className="text-[#248FEC]" size={20} />
                          <span className="font-medium text-[#1B173A]">
                            Total Users
                          </span>
                        </div>
                        <span className="font-bold text-[#1B173A]">
                          {region.totalUsers.toLocaleString()}
                        </span>
                      </div>

                      <div className="flex items-center justify-between p-3 bg-[#F8F9FB] rounded-xl border border-[#E0E1E6]">
                        <div className="flex items-center gap-3">
                          <Building className="text-[#FFB900]" size={20} />
                          <span className="font-medium text-[#1B173A]">
                            Companies
                          </span>
                        </div>
                        <span className="font-bold text-[#1B173A]">
                          {region.totalCompanies}
                        </span>
                      </div>

                      <div className="flex items-center justify-between p-3 bg-[#F8F9FB] rounded-xl border border-[#E0E1E6]">
                        <div className="flex items-center gap-3">
                          <Award className="text-[#4DAB46]" size={20} />
                          <span className="font-medium text-[#1B173A]">
                            Admins
                          </span>
                        </div>
                        <span className="font-bold text-[#1B173A]">
                          {region.adminCount}
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
                          {region.healthScore}/100
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
                            data={REGION_STATS.demographics}
                            cx="50%"
                            cy="50%"
                            outerRadius={60}
                            dataKey="value"
                          >
                            {REGION_STATS.demographics.map((entry, index) => (
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
                      {REGION_STATS.demographics.map((item, idx) => (
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

                  {/* Action Buttons - Only show for SUPER_ADMIN and REGIONAL_ADMIN */}
                  {user?.role !== "COUNTRY_ADMIN" && (
                    <Card className="p-6">
                      <h3 className="text-lg font-extrabold text-[#1B173A] mb-4">
                        Quick Actions
                      </h3>
                      <div className="space-y-3">
                        <Button
                          className="w-full"
                          variant="outline"
                          onClick={handleOpenInviteModal}
                          disabled={!canEdit}
                        >
                          <Mail size={16} className="mr-2" />
                          Invite Admin
                        </Button>
                        <Link to={`/regions/${actualRegionId}/countries`}>
                          <Button className="w-full mb-3" variant="outline">
                            <Globe size={16} className="mr-2" />
                            Manage Countries
                          </Button>
                        </Link>
                        <Link to={`/regions/${actualRegionId}/companies`}>
                          <Button className="w-full mb-3" variant="outline">
                            <Building size={16} className="mr-2" />
                            View Companies
                          </Button>
                        </Link>
                        <Link to={`/regions/${actualRegionId}/users`}>
                          <Button className="w-full" variant="outline">
                            <Users2 size={16} className="mr-2" />
                            View Users
                          </Button>
                        </Link>
                      </div>
                    </Card>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Admin Invitation Modal */}
        <InviteRegionAdminModal
          isOpen={isInviteModalOpen}
          onClose={handleCloseInviteModal}
          regionId={actualRegionId}
          regionName={region.name}
        />
      </div>
    </RoleGuard>
  );
}
