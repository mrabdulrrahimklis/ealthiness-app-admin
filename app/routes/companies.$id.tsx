import React, { useState, useRef } from "react";
import { useNavigate } from "react-router";
import { Link } from "react-router";
import type { Route } from "./+types/companies.$id";
import {
  ArrowLeft,
  Building,
  Mail,
  Users,
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
  Globe,
  Building2,
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
import AppSidebar from "../../src/components/shared/AppSidebar";
import Navbar from "../../src/components/shared/Navbar";
import { RoleGuard } from "~/components/auth/RoleGuard";
import { useUser } from "~/hooks/useAuth";
import { useCompanyDetails, useUpdateCompany } from "~/hooks/useAuthApi";
import type { ApiCompany } from "~/lib/auth/types";
import { useParams } from "react-router";
import { InviteCompanyAdminModal } from "~/components/modals/InviteCompanyAdminModal";

// Mock data for company statistics
const COMPANY_STATS = {
  userGrowth: [
    { month: "Jan", users: 45, active: 38 },
    { month: "Feb", users: 52, active: 44 },
    { month: "Mar", users: 58, active: 52 },
    { month: "Apr", users: 64, active: 58 },
    { month: "May", users: 71, active: 65 },
    { month: "Jun", users: 78, active: 72 },
  ],
  departments: [
    { name: "Engineering", value: 35, color: "#5850DE" },
    { name: "Sales", value: 28, color: "#248FEC" },
    { name: "Marketing", value: 22, color: "#4DAB46" },
    { name: "HR", value: 15, color: "#FFB900" },
  ],
  topUsers: [
    { name: "Sarah Johnson", engagement: 95, role: "Engineer", growth: "+12%" },
    { name: "Mike Chen", engagement: 88, role: "Sales Manager", growth: "+8%" },
    { name: "Anna Davis", engagement: 85, role: "Designer", growth: "+15%" },
    { name: "Tom Wilson", engagement: 82, role: "HR Specialist", growth: "+6%" },
  ],
};

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Company Details - Ealthiness Admin Portal" },
    {
      name: "description",
      content: "View detailed company statistics and administration",
    },
  ];
}

export async function loader({ params }: Route.LoaderArgs) {
  return { companyId: params.id };
}

export default function CompanyDetailPage({
  loaderData,
}: Route.ComponentProps) {
  const { companyId } = loaderData;
  const params = useParams();
  const actualCompanyId = companyId || params.id || "";

  const user = useUser();
  const navigate = useNavigate();
  const [refreshing, setRefreshing] = useState(false);
  const [adminNotes, setAdminNotes] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Check if user can edit (only SUPER_ADMIN, COUNTRY_ADMIN, REGIONAL_ADMIN)
  const canEdit = ["SUPER_ADMIN", "COUNTRY_ADMIN", "REGIONAL_ADMIN"].includes(
    user?.role || "",
  );

  // Form state
  const [editForm, setEditForm] = useState({
    name: "",
    email: "",
    address: "",
    contact: "",
    logo: null as File | null,
  });
  const [logoPreview, setLogoPreview] = useState<string | null>(null);

  // Fetch company details from API
  const {
    data: apiCompany,
    isLoading: isLoadingCompany,
    error: companyError,
  } = useCompanyDetails(actualCompanyId);

  // Update company mutation
  const updateCompanyMutation = useUpdateCompany();

  const handleRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1500);
  };

  // Initialize form when company data loads
  React.useEffect(() => {
    if (apiCompany) {
      setEditForm({
        name: apiCompany.name,
        email: apiCompany.email,
        address: apiCompany.address || "",
        contact: apiCompany.contact || "",
        logo: null,
      });
    }
  }, [apiCompany]);

  // Cleanup preview URL on component unmount
  React.useEffect(() => {
    return () => {
      if (logoPreview) {
        URL.revokeObjectURL(logoPreview);
      }
    };
  }, [logoPreview]);

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    // Reset form to original values
    if (apiCompany) {
      setEditForm({
        name: apiCompany.name,
        email: apiCompany.email,
        address: apiCompany.address || "",
        contact: apiCompany.contact || "",
        logo: null,
      });
    }
    // Clean up preview URL
    if (logoPreview) {
      URL.revokeObjectURL(logoPreview);
      setLogoPreview(null);
    }
  };

  const handleSave = async () => {
    try {
      const updateData: any = {};

      // Only include fields that have changed
      if (editForm.name !== apiCompany?.name) updateData.name = editForm.name;
      if (editForm.email !== apiCompany?.email) updateData.email = editForm.email;
      if (editForm.address !== (apiCompany?.address || ""))
        updateData.address = editForm.address;
      if (editForm.contact !== (apiCompany?.contact || ""))
        updateData.contact = editForm.contact;
      if (editForm.logo) updateData.logo = editForm.logo;

      // Only make request if there are changes
      if (Object.keys(updateData).length > 0) {
        await updateCompanyMutation.mutateAsync({
          companyId: actualCompanyId,
          data: updateData,
        });
      }

      setIsEditing(false);
      // Clean up preview URL after successful save
      if (logoPreview) {
        URL.revokeObjectURL(logoPreview);
        setLogoPreview(null);
      }
    } catch (error) {
      console.error("Error updating company:", error);
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setEditForm((prev) => ({ ...prev, logo: file }));

      // Create preview URL for the selected image
      const previewUrl = URL.createObjectURL(file);
      setLogoPreview(previewUrl);
    }
  };

  // Transform API company to display format
  const transformApiCompanyToDetails = (apiCompany: ApiCompany) => ({
    id: apiCompany._id,
    name: apiCompany.name,
    email: apiCompany.email,
    address: apiCompany.address || "No address",
    contact: apiCompany.contact || "No contact",
    status: apiCompany.status,
    adminCount: apiCompany.admins?.length || 0,
    employeeCount: apiCompany.employees?.length || 0,
    logo: apiCompany.logo,
    createdAt: new Date(apiCompany.createdAt).toLocaleDateString(),
    totalUsers: apiCompany.employees?.length || 0, // Use employees count as total users since userCount not available
    location: apiCompany.address || "No address specified", // Use address as location
    monthlyGrowth: "+15%", // Mock data - would need historical data to calculate
    healthScore: 89, // Mock data - would need analytics to calculate
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

  if (!user || isLoadingCompany) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex items-center space-x-2">
          <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-gray-600">
            {!user ? "Loading..." : "Loading company details..."}
          </span>
        </div>
      </div>
    );
  }

  if (companyError) {
    return (
      <RoleGuard
        allowedRoles={["SUPER_ADMIN", "COUNTRY_ADMIN", "REGIONAL_ADMIN", "COMPANY_ADMIN"]}
      >
        <div className="min-h-screen bg-[#F8F9FB] font-sans flex">
          <AppSidebar user={user} />
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-red-600 mb-2">
                Company Not Found
              </h2>
              <p className="text-gray-600 mb-4">
                The company you're looking for could not be found.
              </p>
              <Link to="/companies" className="text-blue-500 hover:underline">
                Back to Companies
              </Link>
            </div>
          </div>
        </div>
      </RoleGuard>
    );
  }

  if (!apiCompany) {
    return null;
  }

  // Use the transformed company data
  const company = transformApiCompanyToDetails(apiCompany);

  return (
    <RoleGuard
      allowedRoles={["SUPER_ADMIN", "COUNTRY_ADMIN", "REGIONAL_ADMIN", "COMPANY_ADMIN"]}
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
                to="/companies"
                className="mb-6 flex items-center text-[#5850DE] font-bold hover:bg-[#F0F0F3] px-4 py-2 rounded-xl transition w-fit gap-2"
              >
                <ArrowLeft size={18} />
                Back to Companies
              </Link>

              {/* Hero Company Banner */}
              <div className="bg-[#1B173A] rounded-[32px] p-8 text-white shadow-2xl mb-8 relative overflow-hidden flex flex-col md:flex-row items-center md:items-start gap-8 border border-[#38383A]">
                <div className="absolute right-0 top-0 w-1/2 h-full bg-gradient-to-l from-[#5850DE]/40 to-transparent"></div>

                <div className="relative z-10 w-28 h-28 rounded-3xl bg-gradient-to-br from-[#5850DE] to-[#248FEC] flex items-center justify-center shadow-[0_0_40px_rgba(88,80,222,0.5)] border-4 border-[#1B173A]">
                  {logoPreview ? (
                    <img
                      src={logoPreview}
                      alt={`${company.name} logo preview`}
                      className="w-20 h-20 object-cover rounded-lg"
                    />
                  ) : company.logo && typeof company.logo === 'object' && company.logo.url ? (
                    <img
                      src={company.logo.url}
                      alt={`${company.name} logo`}
                      className="w-20 h-20 object-cover rounded-lg"
                    />
                  ) : company.logo && typeof company.logo === 'string' ? (
                    <img
                      src={company.logo}
                      alt={`${company.name} logo`}
                      className="w-20 h-20 object-cover rounded-lg"
                    />
                  ) : (
                    <div className="text-4xl font-extrabold">
                      <Building2 size={32} />
                    </div>
                  )}
                  {isEditing && canEdit && (
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="absolute -bottom-2 -right-2 w-8 h-8 bg-[#5850DE] rounded-full flex items-center justify-center hover:bg-[#4A42C7] transition-colors"
                      title="Change logo"
                    >
                      <Upload size={14} />
                    </button>
                  )}
                </div>

                <div className="relative z-10 text-center md:text-left flex-1">
                  <div className="flex flex-col md:flex-row md:items-center gap-4 mb-2">
                    <div className="flex items-center gap-3 justify-center md:justify-start">
                      <h2 className="text-4xl font-extrabold">
                        {company.name}
                      </h2>
                      <Building size={24} className="text-blue-400" />
                      {!isEditing && canEdit && (
                        <button
                          onClick={handleEdit}
                          className="ml-4 p-2 hover:bg-white/10 rounded-lg transition-colors"
                          title="Edit company"
                        >
                          <Edit size={20} />
                        </button>
                      )}
                    </div>
                    <Badge variant="secondary">{company.status}</Badge>
                  </div>
                  <p className="text-[#8E8E93] font-medium mb-6 text-lg">
                    {company.email} • {company.contact} • {company.location} • Created {company.createdAt}
                  </p>

                  <div className="flex flex-wrap justify-center md:justify-start gap-6">
                    <div>
                      <p className="text-[10px] text-[#8E8E93] uppercase font-bold">
                        Total Users
                      </p>
                      <p className="font-bold text-xl">
                        {company.totalUsers}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] text-[#8E8E93] uppercase font-bold">
                        Employees
                      </p>
                      <p className="font-bold text-xl">
                        {company.employeeCount}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] text-[#8E8E93] uppercase font-bold">
                        Admins
                      </p>
                      <p className="font-bold text-xl">{company.adminCount}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-[#8E8E93] uppercase font-bold">
                        Health Score
                      </p>
                      <p className="font-bold text-xl text-[#248FEC]">
                        {company.healthScore}/100
                      </p>
                    </div>
                  </div>
                </div>

                {/* Hidden file input for logo upload */}
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
                          ? "Edit Company Information"
                          : "Company Administration Notes"}
                      </h3>
                    </div>

                    {isEditing ? (
                      <div className="space-y-6">
                        {/* Company Name */}
                        <div>
                          <label className="block text-xs font-bold text-[#8E8E93] uppercase tracking-wider mb-2">
                            Company Name
                          </label>
                          <Input
                            value={editForm.name}
                            onChange={(e) =>
                              setEditForm((prev) => ({
                                ...prev,
                                name: e.target.value,
                              }))
                            }
                            placeholder="Enter company name"
                            className="w-full"
                          />
                        </div>

                        {/* Email */}
                        <div>
                          <label className="block text-xs font-bold text-[#8E8E93] uppercase tracking-wider mb-2">
                            Email
                          </label>
                          <Input
                            type="email"
                            value={editForm.email}
                            onChange={(e) =>
                              setEditForm((prev) => ({
                                ...prev,
                                email: e.target.value,
                              }))
                            }
                            placeholder="company@example.com"
                            className="w-full"
                          />
                        </div>

                        {/* Address */}
                        <div>
                          <label className="block text-xs font-bold text-[#8E8E93] uppercase tracking-wider mb-2">
                            Address
                          </label>
                          <Input
                            value={editForm.address}
                            onChange={(e) =>
                              setEditForm((prev) => ({
                                ...prev,
                                address: e.target.value,
                              }))
                            }
                            placeholder="Company address"
                            className="w-full"
                          />
                        </div>

                        {/* Contact */}
                        <div>
                          <label className="block text-xs font-bold text-[#8E8E93] uppercase tracking-wider mb-2">
                            Contact
                          </label>
                          <Input
                            value={editForm.contact}
                            onChange={(e) =>
                              setEditForm((prev) => ({
                                ...prev,
                                contact: e.target.value,
                              }))
                            }
                            placeholder="Contact information"
                            className="w-full"
                          />
                        </div>

                        {/* Logo Upload Info */}
                        {editForm.logo && (
                          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                            <div className="flex items-start gap-4">
                              <div className="flex-1">
                                <p className="text-sm text-green-800 font-medium">
                                  New logo selected: {editForm.logo.name}
                                </p>
                                <p className="text-xs text-green-600 mt-1">
                                  This will replace the current logo when you
                                  save.
                                </p>
                              </div>
                              {logoPreview && (
                                <div className="w-16 h-16 border-2 border-green-300 rounded-lg overflow-hidden">
                                  <img
                                    src={logoPreview}
                                    alt="Logo preview"
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
                            disabled={updateCompanyMutation.isPending}
                            className="bg-green-600 hover:bg-green-700 flex-1"
                          >
                            <Save size={16} className="mr-2" />
                            {updateCompanyMutation.isPending
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
                          placeholder="Add notes about company administration, policy changes, or important updates..."
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
                        User Growth Analytics
                      </h3>
                      <Badge
                        variant="outline"
                        className="bg-green-50 text-green-700"
                      >
                        {company.monthlyGrowth} this month
                      </Badge>
                    </div>

                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={COMPANY_STATS.userGrowth}>
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
                            name="Total Users"
                          />
                          <Line
                            type="monotone"
                            dataKey="active"
                            stroke="#248FEC"
                            strokeWidth={3}
                            dot={{ fill: "#248FEC", strokeWidth: 2, r: 6 }}
                            name="Active Users"
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </Card>

                  {/* Top Users */}
                  <Card className="p-8">
                    <h3 className="text-xl font-extrabold text-[#1B173A] mb-6 flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-[#FFF4E5] text-[#FFB900] flex items-center justify-center">
                        <Users size={20} />
                      </div>
                      Top Users by Engagement
                    </h3>
                    <div className="space-y-4">
                      {COMPANY_STATS.topUsers.map((user, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between p-4 bg-white border border-[#E0E1E6] rounded-2xl hover:border-[#5850DE] transition-colors group cursor-pointer"
                        >
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-full bg-[#F8F9FB] flex items-center justify-center text-[#1B173A] group-hover:bg-[#5850DE] group-hover:text-white transition-colors">
                              <Users size={20} />
                            </div>
                            <div>
                              <h4 className="font-bold text-[#1B173A] text-lg">
                                {user.name}
                              </h4>
                              <p className="text-sm font-medium text-[#8E8E93]">
                                {user.role} • {user.engagement}% engagement
                              </p>
                            </div>
                          </div>
                          <Badge
                            variant="default"
                            className="bg-green-50 text-green-700"
                          >
                            {user.growth}
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
                          {company.totalUsers}
                        </span>
                      </div>

                      <div className="flex items-center justify-between p-3 bg-[#F8F9FB] rounded-xl border border-[#E0E1E6]">
                        <div className="flex items-center gap-3">
                          <Building className="text-[#248FEC]" size={20} />
                          <span className="font-medium text-[#1B173A]">
                            Employees
                          </span>
                        </div>
                        <span className="font-bold text-[#1B173A]">
                          {company.employeeCount}
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
                          {company.adminCount}
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
                          {company.healthScore}/100
                        </span>
                      </div>

                      <div className="flex items-center justify-between p-3 bg-[#F8F9FB] rounded-xl border border-[#E0E1E6]">
                        <div className="flex items-center gap-3">
                          <MapPin className="text-[#8E8E93]" size={20} />
                          <span className="font-medium text-[#1B173A]">
                            Location
                          </span>
                        </div>
                        <span className="font-bold text-[#1B173A] text-right text-sm">
                          {company.location}
                        </span>
                      </div>
                    </div>
                  </Card>

                  {/* Department Distribution */}
                  <Card className="p-6">
                    <h3 className="text-lg font-extrabold text-[#1B173A] mb-6 flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-[#E5F6E4] text-[#4DAB46] flex items-center justify-center">
                        <Eye size={16} />
                      </div>
                      Department Distribution
                    </h3>

                    <div className="h-48">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={COMPANY_STATS.departments}
                            cx="50%"
                            cy="50%"
                            outerRadius={60}
                            dataKey="value"
                          >
                            {COMPANY_STATS.departments.map((entry, index) => (
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
                      {COMPANY_STATS.departments.map((item, idx) => (
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
                        disabled={!canEdit}
                      >
                        <Mail size={16} className="mr-2" />
                        Invite Admin
                      </Button>
                      <Button className="w-full" variant="outline">
                        <Users size={16} className="mr-2" />
                        View All Users
                      </Button>
                      <Button className="w-full" variant="outline">
                        <Globe size={16} className="mr-2" />
                        Analytics Dashboard
                      </Button>
                    </div>
                  </Card>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Admin Invitation Modal */}
        <InviteCompanyAdminModal
          isOpen={isInviteModalOpen}
          onClose={handleCloseInviteModal}
          companyId={actualCompanyId}
          companyName={company.name}
        />
      </div>
    </RoleGuard>
  );
}