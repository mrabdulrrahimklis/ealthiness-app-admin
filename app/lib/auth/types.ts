export interface User {
  _id: string;
  firstName: string;
  lastName: string;
  username: string;
  email: string[];
  roles: string[];
  currentRole: UserRole;
  companies: any[];
  adminCountries: any[];
  adminRegions: any[];
  adminCompanies: any[];
  diet: {
    breakfast: any[];
    lunch: any[];
    dinner: any[];
  };
  coins: number;
  friends: any[];
  blockList: any[];
  settings: {
    stretching: boolean;
    dailyMood: boolean;
    drinkWater: boolean;
    quotes: {
      send: boolean;
      minutes: number;
    };
    facts: {
      send: boolean;
      minutes: number;
    };
  };
  accomplishments: any[];
  rating: number;
  reviews: number;
  price: number;
  currency: string;
  coaches: any[];
  coachTrainees: any[];
  coachGroup: any[];
  coachGroupMember: any[];
  createdAt: string;
  updatedAt: string;
  __v: number;
  curency?: string;
  isFollowingDiet: boolean;
  activeDietPlanId: any;
  activeUserDietPlanId: any;
  currentDayNumber: any;
  
  // Computed properties for backwards compatibility
  id: string;
  name: string;
  role: UserRole;
}

export type UserRole = 'COMPANY_ADMIN' | 'REGIONAL_ADMIN' | 'COUNTRY_ADMIN' | 'SUPER_ADMIN' | 'USER';

export interface Session {
  userId: string;
  user: User;
  expiresAt: Date;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthError {
  type: 'invalid_credentials' | 'user_not_found' | 'session_expired' | 'unauthorized' | 'server_error';
  message: string;
}

export interface SessionPayload {
  userId: string;
  email: string;
  role: UserRole;
  iat: number;
  exp: number;
}

export interface ApiAuthResponse {
  accessToken: string;
  refreshToken: string;
}

export interface AuthResult {
  success: boolean;
  user?: User;
  tokens?: ApiAuthResponse;
  error?: AuthError;
  redirectTo?: string;
}

export interface CreateUserData {
  email: string;
  password: string;
  name: string;
  role: UserRole;
}

export interface UserPermissions {
  canManageUsers: boolean;
  canManageCompanies: boolean;
  canManageRegions: boolean;
  canManageCountries: boolean;
  canViewAnalytics: boolean;
  canManageSystem: boolean;
}

export const USER_ROLE_PERMISSIONS: Record<UserRole, UserPermissions> = {
  SUPER_ADMIN: {
    canManageUsers: true,
    canManageCompanies: true,
    canManageRegions: true,
    canManageCountries: true,
    canViewAnalytics: true,
    canManageSystem: true,
  },
  COUNTRY_ADMIN: {
    canManageUsers: true,
    canManageCompanies: true,
    canManageRegions: true,
    canManageCountries: false,
    canViewAnalytics: true,
    canManageSystem: false,
  },
  REGIONAL_ADMIN: {
    canManageUsers: true,
    canManageCompanies: true,
    canManageRegions: true,
    canManageCountries: true,
    canViewAnalytics: true,
    canManageSystem: false,
  },
  COMPANY_ADMIN: {
    canManageUsers: false,
    canManageCompanies: false,
    canManageRegions: false,
    canManageCountries: false,
    canViewAnalytics: true,
    canManageSystem: false,
  },
  USER: {
    canManageUsers: false,
    canManageCompanies: false,
    canManageRegions: false,
    canManageCountries: false,
    canViewAnalytics: false,
    canManageSystem: false,
  },
};

// Users API types
export interface ApiUser {
  _id: string;
  firstName: string;
  lastName: string;
  username: string;
  email: string[];
  roles: string[];
  height?: number;
  weight?: number;
  gender?: string;
  createdAt: string;
  updatedAt: string;
}

export interface UsersResponse {
  limit: number;
  page: number;
  pages: number;
  total: number;
  results: ApiUser[];
}

export interface UsersQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  orderBy?: 'firstName' | 'lastName' | 'email' | 'username' | 'birthdate';
  type?: 'ascending' | 'descending';
  userRole?: UserRole;
}

// Regions API types
export interface ApiRegion {
  _id: string;
  name: string;
  __v: number;
  admins: any[];
  createdAt: string;
  image: {
    name: string;
    extension: string;
    createdAt: string;
    url: string;
  } | null;
  updatedAt: string;
  adminCount: number;
}

export interface RegionsResponse {
  limit: number;
  page: number;
  pages: number;
  total: number;
  results: ApiRegion[];
}

export interface RegionsQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  orderBy?: 'name' | 'createdAt';
  type?: 'ascending' | 'descending';
}

// Companies API types
export interface ApiCompany {
  _id: string;
  name: string;
  email: string;
  address: string;
  countryId: string;
  logo: string | null;
  status: string;
  employees: string[];
  admins: string[];
  assignmentList: any[];
  createdAt: string;
  updatedAt: string;
  __v: number;
}

export interface CompaniesResponse {
  limit: number;
  page: number;
  pages: number;
  total: number;
  results: ApiCompany[];
}

export interface CompaniesQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  orderBy?: 'name' | 'createdAt';
  type?: 'ascending' | 'descending';
}

// Countries API types
export interface ApiCountry {
  _id: string;
  alpha2: string;
  alpha3: string;
  name: string;
  numericId: number;
  regionId: string;
  admins: string[];
  flag: {
    name: string;
    extension: string;
    createdAt: string;
    url: string;
    _id: string;
  };
  createdAt: string;
  updatedAt: string;
  __v: number;
  adminCount?: number; // Optional since it's calculated from admins array
}

export interface CountriesResponse {
  limit: number;
  page: number;
  pages: number;
  total: number;
  results: ApiCountry[];
}

export interface CountriesQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  orderBy?: 'name' | 'createdAt';
  type?: 'ascending' | 'descending';
}