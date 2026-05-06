import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router";
import type { Route } from "./+types/admin-registration";
import {
  Building2,
  Globe,
  MapPin,
  UserCheck,
  AlertCircle,
  CheckCircle,
  Loader2,
  ArrowRight,
  ChevronDown,
  Check,
  User,
  Eye,
  EyeOff,
} from "lucide-react";
import {
  Button,
  Card,
  Input,
  Badge,
} from "~/components/ui";
import { useMutation } from "@tanstack/react-query";

const API_BASE_URL =
  "https://elathiness-backend-app-company-idea-production.up.railway.app";

// API function for admin signup
const signupAdmin = async (inviteToken: string, userData: any) => {
  const response = await fetch(`${API_BASE_URL}/v1/auth/signup/admin?inviteToken=${inviteToken}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(userData),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || "Failed to complete admin registration");
  }

  return response.json();
};

// Get icon based on admin type
const getAdminTypeIcon = (adminType: string) => {
  switch (adminType) {
    case "country":
      return <Globe size={32} />;
    case "company":
      return <Building2 size={32} />;
    case "region":
      return <MapPin size={32} />;
    default:
      return <UserCheck size={32} />;
  }
};

// Get color scheme based on admin type
const getAdminTypeColors = (adminType: string) => {
  switch (adminType) {
    case "country":
      return {
        gradient: "from-[#4DAB46] to-[#3D8B3A]",
        bg: "bg-green-50",
        text: "text-green-700",
        border: "border-green-200",
      };
    case "company":
      return {
        gradient: "from-[#5850DE] to-[#4A42C7]",
        bg: "bg-purple-50",
        text: "text-purple-700",
        border: "border-purple-200",
      };
    case "region":
      return {
        gradient: "from-[#248FEC] to-[#1A73C2]",
        bg: "bg-blue-50",
        text: "text-blue-700",
        border: "border-blue-200",
      };
    default:
      return {
        gradient: "from-[#8E8E93] to-[#6D6D80]",
        bg: "bg-gray-50",
        text: "text-gray-700",
        border: "border-gray-200",
      };
  }
};

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Accept Admin Invitation - Ealthiness Admin Portal" },
    {
      name: "description",
      content: "Accept your admin invitation to join the Ealthiness platform",
    },
  ];
}

export default function AdminRegistrationPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [userInfo, setUserInfo] = useState({
    firstName: "",
    lastName: "",
    email: "",
    username: "",
    gender: "male" as "male" | "female",
    height: 170,
    weight: 70,
    password: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isGenderDropdownOpen, setIsGenderDropdownOpen] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const genderDropdownRef = useRef<HTMLDivElement>(null);

  // Get token and admin type from URL parameters
  const token = searchParams.get("token");
  const adminType = searchParams.get("adminType");

  // Close gender dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        genderDropdownRef.current &&
        !genderDropdownRef.current.contains(event.target as Node)
      ) {
        setIsGenderDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Mutation for admin signup
  const signupMutation = useMutation({
    mutationFn: () => {
      if (!token) {
        throw new Error("Missing invitation token");
      }
      
      const { confirmPassword, ...userData } = userInfo;
      return signupAdmin(token, userData);
    },
    onSuccess: (data) => {
      // Redirect to login page with success message
      navigate("/?message=registration-complete", { replace: true });
    },
    onError: (error: Error) => {
      console.error("Registration failed:", error);
    },
  });

  // Validate form
  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!userInfo.firstName.trim()) {
      newErrors.firstName = "First name is required";
    }

    if (!userInfo.lastName.trim()) {
      newErrors.lastName = "Last name is required";
    }

    if (!userInfo.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(userInfo.email)) {
      newErrors.email = "Please enter a valid email address";
    }

    if (!userInfo.username.trim()) {
      newErrors.username = "Username is required";
    } else if (userInfo.username.length < 3) {
      newErrors.username = "Username must be at least 3 characters";
    }

    if (!userInfo.password) {
      newErrors.password = "Password is required";
    } else if (userInfo.password.length < 8) {
      newErrors.password = "Password must be at least 8 characters";
    }

    if (!userInfo.confirmPassword) {
      newErrors.confirmPassword = "Please confirm your password";
    } else if (userInfo.password !== userInfo.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    if (userInfo.height < 100 || userInfo.height > 250) {
      newErrors.height = "Height must be between 100-250 cm";
    }

    if (userInfo.weight < 30 || userInfo.weight > 300) {
      newErrors.weight = "Weight must be between 30-300 kg";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    signupMutation.mutate();
  };

  // Handle input changes
  const handleInputChange = (field: string, value: string) => {
    let processedValue: any = value;
    
    // Convert numeric fields to numbers
    if (field === "height" || field === "weight") {
      processedValue = parseInt(value) || 0;
    }
    
    setUserInfo(prev => ({ ...prev, [field]: processedValue }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: "" }));
    }
  };

  // Check if we have valid parameters
  if (!token) {
    return (
      <div className="min-h-screen bg-[#F8F9FB] flex items-center justify-center p-4">
        <Card className="w-full max-w-md p-8 text-center">
          <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
            <AlertCircle size={32} className="text-red-600" />
          </div>
          <h2 className="text-2xl font-bold text-[#1B173A] mb-2">Invalid Invitation</h2>
          <p className="text-[#60646C] mb-6">
            This invitation link is invalid or has expired. Please contact your administrator for a new invitation.
          </p>
          <Button onClick={() => navigate("/")} variant="outline" className="w-full">
            Back to Login
          </Button>
        </Card>
      </div>
    );
  }

  const colors = getAdminTypeColors(adminType);

  return (
    <div className="min-h-screen bg-[#F8F9FB] flex items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        {/* Header Card */}
        <Card className="p-8 mb-6">
          <div className="text-center">
            <div className={`w-20 h-20 rounded-full bg-gradient-to-br ${colors.gradient} flex items-center justify-center mx-auto mb-4 text-white`}>
              {getAdminTypeIcon(adminType)}
            </div>
            <h1 className="text-2xl font-extrabold text-[#1B173A] mb-2">
              Welcome to Ealthiness
            </h1>
            <p className="text-[#60646C] mb-4">
              Complete your registration to become a{" "}
              <Badge className={`${colors.bg} ${colors.text} ${colors.border} border`}>
                {adminType.charAt(0).toUpperCase() + adminType.slice(1)} Admin
              </Badge>
            </p>
            <div className={`p-3 ${colors.bg} rounded-lg border ${colors.border}`}>
              <p className={`text-sm ${colors.text} font-medium`}>
                You've been invited to manage {adminType} operations on the Ealthiness platform
              </p>
            </div>
          </div>
        </Card>

        {/* Registration Form */}
        <Card className="p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* First Row - Name Fields */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* First Name */}
              <div>
                <label className="block text-xs font-bold text-[#8E8E93] uppercase tracking-wider mb-2">
                  First Name
                </label>
                <Input
                  type="text"
                  value={userInfo.firstName}
                  onChange={(e) => handleInputChange("firstName", e.target.value)}
                  placeholder="Enter your first name"
                  className={errors.firstName ? "border-red-500" : ""}
                  disabled={signupMutation.isPending}
                />
                {errors.firstName && (
                  <p className="text-red-500 text-sm mt-1">{errors.firstName}</p>
                )}
              </div>

              {/* Last Name */}
              <div>
                <label className="block text-xs font-bold text-[#8E8E93] uppercase tracking-wider mb-2">
                  Last Name
                </label>
                <Input
                  type="text"
                  value={userInfo.lastName}
                  onChange={(e) => handleInputChange("lastName", e.target.value)}
                  placeholder="Enter your last name"
                  className={errors.lastName ? "border-red-500" : ""}
                  disabled={signupMutation.isPending}
                />
                {errors.lastName && (
                  <p className="text-red-500 text-sm mt-1">{errors.lastName}</p>
                )}
              </div>
            </div>

            {/* Second Row - Email and Username */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Email */}
              <div>
                <label className="block text-xs font-bold text-[#8E8E93] uppercase tracking-wider mb-2">
                  Email
                </label>
                <Input
                  type="email"
                  value={userInfo.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  placeholder="Enter your email address"
                  className={errors.email ? "border-red-500" : ""}
                  disabled={signupMutation.isPending}
                />
                {errors.email && (
                  <p className="text-red-500 text-sm mt-1">{errors.email}</p>
                )}
              </div>

              {/* Username */}
              <div>
                <label className="block text-xs font-bold text-[#8E8E93] uppercase tracking-wider mb-2">
                  Username
                </label>
                <Input
                  type="text"
                  value={userInfo.username}
                  onChange={(e) => handleInputChange("username", e.target.value)}
                  placeholder="Choose a username"
                  className={errors.username ? "border-red-500" : ""}
                  disabled={signupMutation.isPending}
                />
                {errors.username && (
                  <p className="text-red-500 text-sm mt-1">{errors.username}</p>
                )}
              </div>
            </div>

            {/* Third Row - Gender, Height and Weight */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Gender */}
              <div>
                <label className="block text-xs font-bold text-[#8E8E93] uppercase tracking-wider mb-2 flex items-center gap-2">
                  <User size={14} />
                  Gender
                </label>
                <div className="relative" ref={genderDropdownRef}>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsGenderDropdownOpen(!isGenderDropdownOpen)}
                    className="justify-between w-full bg-white border rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200 border-[#E0E1E6] text-[#1B173A] hover:border-[#5850DE] focus:border-[#5850DE] focus:ring-2 focus:ring-[#5850DE]/10"
                    disabled={signupMutation.isPending}
                  >
                    {userInfo.gender === "male" ? "Male" : "Female"}
                    <ChevronDown
                      size={16}
                      className={`text-[#8E8E93] transition-transform duration-200 ${
                        isGenderDropdownOpen ? "rotate-180" : ""
                      }`}
                    />
                  </Button>

                  {isGenderDropdownOpen && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-[#E0E1E6] rounded-lg shadow-lg z-50 py-1">
                      <button
                        type="button"
                        onClick={() => {
                          handleInputChange("gender", "male");
                          setIsGenderDropdownOpen(false);
                        }}
                        className={`w-full px-3 py-2 text-left text-sm font-medium hover:bg-[#F0F0F3] transition-colors flex items-center justify-between ${
                          userInfo.gender === "male"
                            ? "text-[#5850DE] bg-[#F0F0F3]"
                            : "text-[#1B173A]"
                        }`}
                      >
                        Male
                        {userInfo.gender === "male" && (
                          <Check size={16} className="text-[#5850DE]" />
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          handleInputChange("gender", "female");
                          setIsGenderDropdownOpen(false);
                        }}
                        className={`w-full px-3 py-2 text-left text-sm font-medium hover:bg-[#F0F0F3] transition-colors flex items-center justify-between ${
                          userInfo.gender === "female"
                            ? "text-[#5850DE] bg-[#F0F0F3]"
                            : "text-[#1B173A]"
                        }`}
                      >
                        Female
                        {userInfo.gender === "female" && (
                          <Check size={16} className="text-[#5850DE]" />
                        )}
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Height */}
              <div>
                <label className="block text-xs font-bold text-[#8E8E93] uppercase tracking-wider mb-2">
                  Height (cm)
                </label>
                <Input
                  type="number"
                  value={userInfo.height}
                  onChange={(e) => handleInputChange("height", e.target.value)}
                  placeholder="170"
                  min="100"
                  max="250"
                  className={errors.height ? "border-red-500" : ""}
                  disabled={signupMutation.isPending}
                />
                {errors.height && (
                  <p className="text-red-500 text-sm mt-1">{errors.height}</p>
                )}
              </div>

              {/* Weight */}
              <div>
                <label className="block text-xs font-bold text-[#8E8E93] uppercase tracking-wider mb-2">
                  Weight (kg)
                </label>
                <Input
                  type="number"
                  value={userInfo.weight}
                  onChange={(e) => handleInputChange("weight", e.target.value)}
                  placeholder="70"
                  min="30"
                  max="300"
                  className={errors.weight ? "border-red-500" : ""}
                  disabled={signupMutation.isPending}
                />
                {errors.weight && (
                  <p className="text-red-500 text-sm mt-1">{errors.weight}</p>
                )}
              </div>
            </div>

            {/* Fourth Row - Password Fields */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Password */}
              <div>
                <label className="block text-xs font-bold text-[#8E8E93] uppercase tracking-wider mb-2">
                  Password
                </label>
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    value={userInfo.password}
                    onChange={(e) => handleInputChange("password", e.target.value)}
                    placeholder="Create a secure password"
                    className={`pr-12 ${errors.password ? "border-red-500" : ""}`}
                    disabled={signupMutation.isPending}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-[#8E8E93] hover:text-[#5850DE] transition-colors focus:outline-none"
                    disabled={signupMutation.isPending}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-red-500 text-sm mt-1">{errors.password}</p>
                )}
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block text-xs font-bold text-[#8E8E93] uppercase tracking-wider mb-2">
                  Confirm Password
                </label>
                <div className="relative">
                  <Input
                    type={showConfirmPassword ? "text" : "password"}
                    value={userInfo.confirmPassword}
                    onChange={(e) => handleInputChange("confirmPassword", e.target.value)}
                    placeholder="Confirm your password"
                    className={`pr-12 ${errors.confirmPassword ? "border-red-500" : ""}`}
                    disabled={signupMutation.isPending}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-[#8E8E93] hover:text-[#5850DE] transition-colors focus:outline-none"
                    disabled={signupMutation.isPending}
                  >
                    {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <p className="text-red-500 text-sm mt-1">{errors.confirmPassword}</p>
                )}
              </div>
            </div>

            {/* Error Alert */}
            {signupMutation.error && (
              <div className="flex items-start p-4 border border-red-200 bg-red-50 rounded-lg">
                <AlertCircle size={16} className="text-red-600 mt-0.5" />
                <div className="ml-2">
                  <p className="text-red-800 font-medium">Registration Failed</p>
                  <p className="text-red-700 text-sm mt-1">
                    {signupMutation.error.message}
                  </p>
                </div>
              </div>
            )}

            {/* Submit Button */}
            <Button
              type="submit"
              className={`w-full bg-gradient-to-r ${colors.gradient} hover:opacity-90 transition-opacity`}
              disabled={signupMutation.isPending}
            >
              {signupMutation.isPending ? (
                <>
                  <Loader2 size={16} className="mr-2 animate-spin" />
                  Completing Registration...
                </>
              ) : (
                <>
                  Complete Registration
                  <ArrowRight size={16} className="ml-2" />
                </>
              )}
            </Button>

            {/* Success State */}
            {signupMutation.isSuccess && (
              <div className="flex items-start p-4 border border-green-200 bg-green-50 rounded-lg">
                <CheckCircle size={16} className="text-green-600 mt-0.5" />
                <div className="ml-2">
                  <p className="text-green-800 font-medium">Registration Complete!</p>
                  <p className="text-green-700 text-sm mt-1">
                    Redirecting you to the login page...
                  </p>
                </div>
              </div>
            )}
          </form>

          {/* Footer */}
          <div className="mt-8 pt-6 border-t border-[#E0E1E6] text-center">
            <p className="text-sm text-[#8E8E93]">
              Already have an account?{" "}
              <button
                onClick={() => navigate("/")}
                className="text-[#5850DE] hover:underline font-medium"
              >
                Sign in here
              </button>
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}