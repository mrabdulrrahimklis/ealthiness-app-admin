import type {
  User,
  UserRole,
  AuthResult,
  ApiAuthResponse,
  UsersResponse,
  UsersQueryParams,
  RegionsQueryParams,
  CompaniesQueryParams,
  CountriesQueryParams,
} from "../auth/types";

const API_BASE_URL =
  "https://elathiness-backend-app-company-idea-production.up.railway.app";

// JWT payload interface for decoding tokens
interface JWTPayload {
  sub: string; // user id
  email: string;
  role: UserRole;
  name?: string;
  iat: number;
  exp: number;
}

// Decode JWT token (simple base64 decode - in production use a proper JWT library)
function decodeJWT(token: string): JWTPayload | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;

    const payload = parts[1];
    // Add padding if needed
    const paddedPayload = payload + "=".repeat(4 - (payload.length % 4));
    const decoded = atob(paddedPayload);
    return JSON.parse(decoded);
  } catch (error) {
    console.error("Error decoding JWT:", error);
    return null;
  }
}

export async function authenticateUser(
  email: string,
  password: string,
): Promise<AuthResult> {
  try {
    const response = await fetch(`${API_BASE_URL}/v1/auth/signin/admin`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email,
        password,
      }),
    });

    if (!response.ok) {
      if (response.status === 401) {
        return {
          success: false,
          error: {
            type: "invalid_credentials",
            message: "Invalid email or password",
          },
        };
      }

      if (response.status === 404) {
        return {
          success: false,
          error: {
            type: "user_not_found",
            message: "No user found with this email address",
          },
        };
      }

      return {
        success: false,
        error: {
          type: "server_error",
          message: "Authentication failed. Please try again.",
        },
      };
    }

    const data: ApiAuthResponse = await response.json();

    // Decode the access token to get user information
    const userPayload = decodeJWT(data.accessToken);
    if (!userPayload) {
      return {
        success: false,
        error: {
          type: "server_error",
          message: "Invalid token received from server",
        },
      };
    }

    // Create user object from JWT payload
    const user: User = {
      _id: userPayload.sub,
      firstName:
        userPayload.name?.split(" ")[0] || userPayload.email.split("@")[0],
      lastName: userPayload.name?.split(" ")[1] || "",
      username: userPayload.email.split("@")[0],
      email: [userPayload.email],
      roles: [userPayload.role],
      currentRole: userPayload.role,
      companies: [],
      adminCountries: [],
      adminRegions: [],
      adminCompanies: [],
      diet: { breakfast: [], lunch: [], dinner: [] },
      coins: 0,
      friends: [],
      blockList: [],
      settings: {
        stretching: false,
        dailyMood: false,
        drinkWater: false,
        quotes: { send: false, minutes: 0 },
        facts: { send: false, minutes: 0 },
      },
      accomplishments: [],
      rating: 0,
      reviews: 0,
      price: 0,
      currency: "usd",
      coaches: [],
      coachTrainees: [],
      coachGroup: [],
      coachGroupMember: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      __v: 0,
      isFollowingDiet: false,
      activeDietPlanId: null,
      activeUserDietPlanId: null,
      currentDayNumber: null,
      // Computed properties for backwards compatibility
      id: userPayload.sub,
      name: userPayload.name || userPayload.email.split("@")[0],
      role: userPayload.role,
    };

    return {
      success: true,
      user,
      tokens: data,
    };
  } catch (error) {
    console.error("Authentication error:", error);
    return {
      success: false,
      error: {
        type: "server_error",
        message: "Network error. Please check your connection and try again.",
      },
    };
  }
}

export async function getUserById(id: string): Promise<User | null> {
  // This would typically make an API call to fetch user details
  // For now, we'll return null as we don't have this endpoint info
  console.warn("getUserById not implemented for API");
  return null;
}

export async function getUserByEmail(email: string): Promise<User | null> {
  // This would typically make an API call to fetch user details
  // For now, we'll return null as we don't have this endpoint info
  console.warn("getUserByEmail not implemented for API");
  return null;
}

export async function refreshAuthToken(
  refreshToken: string,
): Promise<ApiAuthResponse | null> {
  try {
    const response = await fetch(`${API_BASE_URL}/v1/auth/refresh`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        refreshToken,
      }),
    });

    if (!response.ok) {
      return null;
    }

    const data: ApiAuthResponse = await response.json();
    return data;
  } catch (error) {
    console.error("Token refresh error:", error);
    return null;
  }
}

// Helper function to get user from access token
export function getUserFromToken(accessToken: string): User | null {
  const payload = decodeJWT(accessToken);
  if (!payload) return null;

  return {
    _id: payload.sub,
    firstName: payload.name?.split(" ")[0] || payload.email.split("@")[0],
    lastName: payload.name?.split(" ")[1] || "",
    username: payload.email.split("@")[0],
    email: [payload.email],
    roles: [payload.role],
    currentRole: payload.role,
    companies: [],
    adminCountries: [],
    adminRegions: [],
    adminCompanies: [],
    diet: { breakfast: [], lunch: [], dinner: [] },
    coins: 0,
    friends: [],
    blockList: [],
    settings: {
      stretching: false,
      dailyMood: false,
      drinkWater: false,
      quotes: { send: false, minutes: 0 },
      facts: { send: false, minutes: 0 },
    },
    accomplishments: [],
    rating: 0,
    reviews: 0,
    price: 0,
    currency: "usd",
    coaches: [],
    coachTrainees: [],
    coachGroup: [],
    coachGroupMember: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    __v: 0,
    isFollowingDiet: false,
    activeDietPlanId: null,
    activeUserDietPlanId: null,
    currentDayNumber: null,
    // Computed properties for backwards compatibility
    id: payload.sub,
    name: payload.name || payload.email.split("@")[0],
    role: payload.role,
  };
}

/**
 * Builds the query string for users endpoint
 */
export function buildUsersQueryString(params: UsersQueryParams = {}): string {
  const searchParams = new URLSearchParams();

  // Add parameters only if they have values
  if (params.page !== undefined) {
    searchParams.append("page", params.page.toString());
  }

  if (params.limit !== undefined) {
    searchParams.append("limit", params.limit.toString());
  }

  if (params.search && params.search.trim()) {
    searchParams.append("search", params.search.trim());
  }

  if (params.orderBy) {
    searchParams.append("orderBy", params.orderBy);
  }

  if (params.type) {
    searchParams.append("type", params.type);
  }

  const queryString = searchParams.toString();

  return `/v1/admin/users${queryString ? `?${queryString}` : ""}`;
}

/**
 * Builds the endpoint for getting user details by ID
 */
export function buildUserDetailsEndpoint(userId: string): string {
  return `/v1/admin/users/${userId}`;
}

/**
 * Builds the query string for regions endpoint
 */
export function buildRegionsQueryString(
  params: RegionsQueryParams = {},
): string {
  const searchParams = new URLSearchParams();

  // Add parameters only if they have values
  if (params.page !== undefined) {
    searchParams.append("page", params.page.toString());
  }

  if (params.limit !== undefined) {
    searchParams.append("limit", params.limit.toString());
  }

  if (params.search && params.search.trim()) {
    searchParams.append("search", params.search.trim());
  }

  if (params.orderBy) {
    searchParams.append("orderBy", params.orderBy);
  }

  if (params.type) {
    searchParams.append("type", params.type);
  }

  const queryString = searchParams.toString();
  return `/v1/admin/region${queryString ? `?${queryString}` : ""}`;
}

/**
 * Builds the query string for companies endpoint
 */
export function buildCompaniesQueryString(
  params: CompaniesQueryParams = {},
): string {
  const searchParams = new URLSearchParams();

  // Add parameters only if they have values
  if (params.page !== undefined) {
    searchParams.append("page", params.page.toString());
  }

  if (params.limit !== undefined) {
    searchParams.append("limit", params.limit.toString());
  }

  if (params.search && params.search.trim()) {
    searchParams.append("search", params.search.trim());
  }

  if (params.orderBy) {
    searchParams.append("orderBy", params.orderBy);
  }

  if (params.type) {
    searchParams.append("type", params.type);
  }

  const queryString = searchParams.toString();
  return `/v1/admin/company${queryString ? `?${queryString}` : ""}`;
}

/**
 * Builds the query string for countries endpoint
 */
export function buildCountriesQueryString(
  params: CountriesQueryParams = {},
): string {
  const searchParams = new URLSearchParams();

  // Add parameters only if they have values
  if (params.page !== undefined) {
    searchParams.append("page", params.page.toString());
  }

  if (params.limit !== undefined) {
    searchParams.append("limit", params.limit.toString());
  }

  if (params.search && params.search.trim()) {
    searchParams.append("search", params.search.trim());
  }

  if (params.orderBy) {
    searchParams.append("orderBy", params.orderBy);
  }

  if (params.type) {
    searchParams.append("type", params.type);
  }

  const queryString = searchParams.toString();
  return `/v1/admin/country${queryString ? `?${queryString}` : ""}`;
}

/**
 * Builds the endpoint for getting country details by ID
 */
export function buildCountryDetailsEndpoint(countryId: string): string {
  return `/v1/country/${countryId}`;
}

/**
 * Builds the endpoint for getting region details by ID
 */
export function buildRegionDetailsEndpoint(regionId: string): string {
  return `/v1/region/${regionId}`;
}
