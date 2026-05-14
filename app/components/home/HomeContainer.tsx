import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router";
import {
  Users,
  Globe,
  Activity,
  Shield,
  BarChart3,
  Target,
  Bell,
  Clock,
  Plus,
  Building2,
  Settings,
  Download,
  TrendingUp,
  CheckCircle2,
  AlertCircle,
  ChevronDown,
  Check,
} from "lucide-react";
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
  Legend,
  PieChart,
  Pie,
  Cell,
} from "recharts";

import Navbar from "../shared/Navbar";
import Sidebar from "../shared/AppSidebar";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Badge,
  Button,
} from "~/components/ui";
import MetricsCard from "./MetricsCard";
import QuickActions from "./QuickActions";
import AppSidebar from "../shared/AppSidebar";

// Mock Data
const GLOBAL_STATS = {
  totalUsers: 24567,
  totalRegions: 12,
  totalCompanies: 147,
  avgHealthScore: 89,
  systemUptime: 99.9,
  activeUsers24h: 18432,
  newRegistrations: 245,
  avgSessionTime: "24m",
};

const GLOBAL_HEALTH_TREND = [
  { month: "Jul", users: 18400, healthScore: 85, moodScore: 78 },
  { month: "Aug", users: 19200, healthScore: 87, moodScore: 80 },
  { month: "Sep", users: 20800, healthScore: 88, moodScore: 82 },
  { month: "Oct", users: 22100, healthScore: 89, moodScore: 85 },
  { month: "Nov", users: 23400, healthScore: 91, moodScore: 87 },
  { month: "Dec", users: 24567, healthScore: 89, moodScore: 89 },
];

const REGIONAL_DATA = [
  {
    region: "North America",
    users: 8945,
    growth: 12.5,
    healthScore: 92,
    flag: "🇺🇸",
  },
  { region: "Europe", users: 7234, growth: 8.3, healthScore: 91, flag: "🇪🇺" },
  {
    region: "Asia Pacific",
    users: 5621,
    growth: 15.7,
    healthScore: 87,
    flag: "🌏",
  },
  {
    region: "Middle East",
    users: 2767,
    growth: 9.2,
    healthScore: 85,
    flag: "🌍",
  },
];

const ACTIVITY_DISTRIBUTION = [
  { name: "Running", value: 35, color: "#5850DE" },
  { name: "Weightlifting", value: 28, color: "#248FEC" },
  { name: "Yoga", value: 20, color: "#4DAB46" },
  { name: "Cycling", value: 17, color: "#FFB900" },
];

const SYSTEM_ALERTS = [
  {
    id: 1,
    type: "warning",
    message: "High server load detected in EU region",
    time: "5m ago",
    severity: "medium",
  },
  {
    id: 2,
    type: "success",
    message: "Backup completed successfully",
    time: "15m ago",
    severity: "low",
  },
  {
    id: 3,
    type: "info",
    message: "Monthly health reports generated",
    time: "1h ago",
    severity: "low",
  },
  {
    id: 4,
    type: "danger",
    message: "Authentication service experiencing delays",
    time: "2h ago",
    severity: "high",
  },
];

const RECENT_ACTIVITIES = [
  {
    type: "user",
    message: 'New company "HealthTech Solutions" registered',
    time: "10m ago",
    icon: Building2,
  },
  {
    type: "system",
    message: "Weekly analytics report generated",
    time: "25m ago",
    icon: BarChart3,
  },
  {
    type: "admin",
    message: "Country admin invited for Germany region",
    time: "1h ago",
    icon: Users,
  },
  {
    type: "alert",
    message: "Server maintenance completed",
    time: "2h ago",
    icon: CheckCircle2,
  },
];

import type { User } from "~/lib/auth/types";

interface UserData {
  userRole: string;
  user: User;
}

interface HomeContainerProps {
  userData: UserData;
}

const AlertItem: React.FC<{ alert: (typeof SYSTEM_ALERTS)[0] }> = ({
  alert,
}) => {
  const getAlertStyle = (type: string) => {
    const styles = {
      danger: "border-l-[#EF4444] bg-[#EF4444]/5",
      warning: "border-l-[#FFB900] bg-[#FFB900]/5",
      success: "border-l-[#4DAB46] bg-[#4DAB46]/5",
      info: "border-l-[#248FEC] bg-[#248FEC]/5",
    };
    return styles[type as keyof typeof styles] || styles.info;
  };

  const getIcon = (type: string) => {
    const icons = {
      danger: AlertCircle,
      warning: Clock,
      success: CheckCircle2,
      info: Bell,
    };
    const IconComponent = icons[type as keyof typeof icons] || Bell;
    return <IconComponent size={16} />;
  };

  return (
    <div
      className={`p-4 rounded-xl border-l-4 ${getAlertStyle(alert.type)} hover:shadow-sm transition-shadow`}
    >
      <div className="flex items-start gap-3">
        <div
          className={`mt-0.5 ${
            alert.type === "danger"
              ? "text-[#EF4444]"
              : alert.type === "warning"
                ? "text-[#FFB900]"
                : alert.type === "success"
                  ? "text-[#4DAB46]"
                  : "text-[#248FEC]"
          }`}
        >
          {getIcon(alert.type)}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-[#1B173A]">{alert.message}</p>
          <p className="text-xs text-[#8E8E93] mt-1">{alert.time}</p>
        </div>
        <Badge
          variant={
            alert.severity === "high"
              ? "destructive"
              : alert.severity === "medium"
                ? "secondary"
                : "default"
          }
        >
          {alert.severity}
        </Badge>
      </div>
    </div>
  );
};

const HomeContainer: React.FC<HomeContainerProps> = ({ userData }) => {
  const navigate = useNavigate();
  const [timeRange, setTimeRange] = useState("7d");
  const [refreshing, setRefreshing] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const timeRangeOptions = [
    { value: "24h", label: "Last 24 Hours" },
    { value: "7d", label: "Last 7 Days" },
    { value: "30d", label: "Last 30 Days" },
    { value: "90d", label: "Last 90 Days" },
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

  const handleRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1500);
  };

  const handleLogout = () => {
    navigate("/");
  };

  const quickActions = [
    {
      icon: Plus,
      label: "Add Region",
      onClick: () => navigate("/countries"),
      color: "text-[#5850DE]",
      bgColor: "bg-[#E8E6FC]",
    },
    {
      icon: Building2,
      label: "Manage Companies",
      onClick: () => navigate("/companies"),
      color: "text-[#248FEC]",
      bgColor: "bg-[#E5F3FF]",
    },
    {
      icon: Users,
      label: "User Directory",
      onClick: () => navigate("/customers"),
      color: "text-[#4DAB46]",
      bgColor: "bg-[#E5F6E4]",
    },
    {
      icon: BarChart3,
      label: "Analytics",
      onClick: () => {},
      color: "text-[#FFB900]",
      bgColor: "bg-[#FFF4E5]",
    },
    {
      icon: Settings,
      label: "System Settings",
      onClick: () => navigate("/settings"),
      color: "text-[#8E8E93]",
      bgColor: "bg-[#F0F0F3]",
    },
    {
      icon: Download,
      label: "Export Data",
      onClick: () => {},
      color: "text-[#5850DE]",
      bgColor: "bg-[#E8E6FC]",
    },
  ];

  return (
    <div className="min-h-screen bg-[#F8F9FB] font-sans flex">
      <AppSidebar user={userData.user} />

      <div className="flex-1 flex flex-col">
        <Navbar
          user={userData.user}
          onLogout={handleLogout}
          onRefresh={handleRefresh}
          refreshing={refreshing}
        />

        <div className="flex-1 p-6">
          {/* Welcome Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-extrabold text-[#1B173A] mb-2">
                  Global Dashboard
                </h1>
                <p className="text-[#60646C] font-medium">
                  Welcome back, {userData.user.name}. Here's what's happening
                  across the platform.
                </p>
              </div>
              <div className="flex items-center gap-4">
                <div className="relative" ref={dropdownRef}>
                  <Button
                    variant="outline"
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    className="justify-between min-w-[160px] bg-white border border-[#E0E1E6] rounded-xl px-4 py-2.5 text-sm font-semibold text-[#1B173A] hover:border-[#5850DE] hover:bg-white focus:border-[#5850DE] focus:ring-2 focus:ring-[#5850DE]/10 transition-all duration-200 shadow-sm hover:shadow-md"
                  >
                    {
                      timeRangeOptions.find((option) => option.value === timeRange)
                        ?.label
                    }
                    <ChevronDown
                      size={16}
                      className={`text-[#8E8E93] transition-transform duration-200 ${isDropdownOpen ? "rotate-180" : ""}`}
                    />
                  </Button>

                  {isDropdownOpen && (
                    <div className="absolute top-full right-0 mt-1 bg-white border border-[#E0E1E6] rounded-xl shadow-lg z-50 py-1 min-w-full">
                      {timeRangeOptions.map((option) => (
                        <button
                          key={option.value}
                          onClick={() => {
                            setTimeRange(option.value);
                            setIsDropdownOpen(false);
                          }}
                          className={`w-full px-4 py-2.5 text-left text-sm font-medium hover:bg-[#F0F0F3] transition-colors flex items-center justify-between ${
                            timeRange === option.value
                              ? "text-[#5850DE] bg-[#F0F0F3]"
                              : "text-[#1B173A]"
                          }`}
                        >
                          {option.label}
                          {timeRange === option.value && (
                            <Check size={16} className="text-[#5850DE]" />
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Key Metrics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <MetricsCard
              title="Total Active Users"
              value={GLOBAL_STATS.totalUsers}
              subtitle="Across all regions"
              icon={Users}
              trend={8.5}
              color="text-white"
              bgColor="bg-gradient-to-br from-[#5850DE] to-[#248FEC]"
              accentColor="bg-white/20"
            />
            <MetricsCard
              title="Global Regions"
              value={GLOBAL_STATS.totalRegions}
              subtitle={`${GLOBAL_STATS.totalCompanies} companies`}
              icon={Globe}
              trend={2.1}
              accentColor="bg-[#E8E6FC]"
              color="text-[#5850DE]"
            />
            <MetricsCard
              title="Avg Health Score"
              value={GLOBAL_STATS.avgHealthScore}
              subtitle="Platform-wide average"
              icon={Activity}
              trend={3.2}
              accentColor="bg-[#E5F6E4]"
              color="text-[#4DAB46]"
            />
            <MetricsCard
              title="System Uptime"
              value={`${GLOBAL_STATS.systemUptime}%`}
              subtitle="Last 30 days"
              icon={Shield}
              accentColor="bg-[#FFF4E5]"
              color="text-[#FFB900]"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
            {/* Main Chart Area */}
            <div className="lg:col-span-2">
              <Card className="h-full">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <BarChart3 size={20} className="text-[#5850DE]" />
                      Global Platform Growth
                    </CardTitle>
                    <div className="flex items-center gap-2">
                      <Badge>Live Data</Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="h-80 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart
                        data={GLOBAL_HEALTH_TREND}
                        margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                      >
                        <defs>
                          <linearGradient
                            id="colorUsers"
                            x1="0"
                            y1="0"
                            x2="0"
                            y2="1"
                          >
                            <stop
                              offset="5%"
                              stopColor="#5850DE"
                              stopOpacity={0.3}
                            />
                            <stop
                              offset="95%"
                              stopColor="#5850DE"
                              stopOpacity={0}
                            />
                          </linearGradient>
                          <linearGradient
                            id="colorHealth"
                            x1="0"
                            y1="0"
                            x2="0"
                            y2="1"
                          >
                            <stop
                              offset="5%"
                              stopColor="#248FEC"
                              stopOpacity={0.3}
                            />
                            <stop
                              offset="95%"
                              stopColor="#248FEC"
                              stopOpacity={0}
                            />
                          </linearGradient>
                        </defs>
                        <CartesianGrid
                          strokeDasharray="3 3"
                          vertical={false}
                          stroke="#E0E1E6"
                        />
                        <XAxis
                          dataKey="month"
                          axisLine={false}
                          tickLine={false}
                          tick={{ fill: "#8E8E93", fontSize: 12 }}
                        />
                        <YAxis
                          yAxisId="left"
                          axisLine={false}
                          tickLine={false}
                          tick={{ fill: "#8E8E93", fontSize: 12 }}
                        />
                        <YAxis
                          yAxisId="right"
                          orientation="right"
                          axisLine={false}
                          tickLine={false}
                          tick={{ fill: "#8E8E93", fontSize: 12 }}
                        />
                        <RechartsTooltip
                          contentStyle={{
                            borderRadius: "12px",
                            border: "none",
                            boxShadow: "0 8px 32px rgba(0,0,0,0.12)",
                            backgroundColor: "white",
                          }}
                        />
                        <Legend wrapperStyle={{ paddingTop: "20px" }} />
                        <Area
                          yAxisId="left"
                          type="monotone"
                          dataKey="users"
                          name="Active Users"
                          stroke="#5850DE"
                          strokeWidth={3}
                          fillOpacity={1}
                          fill="url(#colorUsers)"
                        />
                        <Area
                          yAxisId="right"
                          type="monotone"
                          dataKey="healthScore"
                          name="Health Score"
                          stroke="#248FEC"
                          strokeWidth={3}
                          fillOpacity={1}
                          fill="url(#colorHealth)"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Activity Distribution */}
            <div>
              <Card className="h-full">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target size={20} className="text-[#4DAB46]" />
                    Activity Distribution
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64 mb-4">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={ACTIVITY_DISTRIBUTION}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={100}
                          paddingAngle={2}
                          dataKey="value"
                        >
                          {ACTIVITY_DISTRIBUTION.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <RechartsTooltip
                          contentStyle={{
                            borderRadius: "12px",
                            border: "none",
                            boxShadow: "0 8px 32px rgba(0,0,0,0.12)",
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="space-y-3">
                    {ACTIVITY_DISTRIBUTION.map((item, index) => (
                      <div
                        key={index}
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
                        <span className="text-sm font-bold text-[#60646C]">
                          {item.value}%
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Regional Performance & Quick Actions */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            {/* Regional Performance */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Globe size={20} className="text-[#248FEC]" />
                    Regional Performance
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {REGIONAL_DATA.map((region, index) => (
                    <div
                      key={index}
                      className="p-4 bg-[#F8F9FB] rounded-xl border border-[#E0E1E6] hover:border-[#5850DE] transition-colors cursor-pointer group"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">{region.flag}</span>
                          <div>
                            <h4 className="font-bold text-[#1B173A] group-hover:text-[#5850DE] transition-colors">
                              {region.region}
                            </h4>
                            <p className="text-xs text-[#8E8E93]">
                              {region.users.toLocaleString()} active users
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="flex items-center gap-1 text-xs font-bold text-[#4DAB46]">
                            <TrendingUp size={12} />+{region.growth}%
                          </div>
                          <p className="text-xs text-[#60646C] mt-1">
                            Health: {region.healthScore}/100
                          </p>
                        </div>
                      </div>
                      <div className="w-full bg-[#E0E1E6] rounded-full h-2 overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-[#5850DE] to-[#248FEC] rounded-full transition-all duration-500"
                          style={{ width: `${region.healthScore}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Plus size={20} className="text-[#FFB900]" />
                  Quick Actions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <QuickActions actions={quickActions} />
              </CardContent>
            </Card>
          </div>

          {/* Bottom Row: Alerts & Recent Activity */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* System Alerts */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Bell size={20} className="text-[#EF4444]" />
                    System Alerts
                  </CardTitle>
                  <Badge variant="destructive">4 Active</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-80 overflow-y-auto">
                  {SYSTEM_ALERTS.map((alert) => (
                    <AlertItem key={alert.id} alert={alert} />
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock size={20} className="text-[#248FEC]" />
                  Recent Activity
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4 max-h-80 overflow-y-auto">
                  {RECENT_ACTIVITIES.map((activity, index) => (
                    <div
                      key={index}
                      className="flex items-start gap-3 p-3 rounded-xl hover:bg-[#F8F9FB] transition-colors"
                    >
                      <div className="w-8 h-8 rounded-lg bg-[#E8E6FC] flex items-center justify-center shrink-0 mt-0.5">
                        <activity.icon size={16} className="text-[#5850DE]" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-[#1B173A] leading-tight">
                          {activity.message}
                        </p>
                        <p className="text-xs text-[#8E8E93] mt-1">
                          {activity.time}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomeContainer;
