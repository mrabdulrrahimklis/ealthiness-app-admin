import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "~/lib/services/api";
import { clientTokens } from "~/lib/auth/client-cookies";
import { transformApiUser } from "~/lib/auth/utils";
import { buildUsersQueryString, buildUserDetailsEndpoint, buildRegionsQueryString, buildCompaniesQueryString, buildCountriesQueryString, buildCountryDetailsEndpoint, buildRegionDetailsEndpoint } from "~/lib/services/user.service";
import type { User, LoginCredentials, ApiAuthResponse, UsersResponse, UsersQueryParams, ApiUser, RegionsResponse, RegionsQueryParams, CompaniesResponse, CompaniesQueryParams, CountriesResponse, CountriesQueryParams, ApiCountry, ApiRegion } from "~/lib/auth/types";

interface LoginResponse extends ApiAuthResponse {
  user?: User;
}

export function useLogin() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (
      credentials: LoginCredentials,
    ): Promise<LoginResponse> => {
      const response = await apiClient.post<LoginResponse>(
        "/v1/auth/signin/admin",
        credentials,
      );

      // Store tokens in cookies
      if (response.accessToken && response.refreshToken) {
        clientTokens.set({
          accessToken: response.accessToken,
          refreshToken: response.refreshToken,
        });
      }

      return response;
    },
    onSuccess: () => {
      // Invalidate user query to trigger refetch
      queryClient.invalidateQueries({ queryKey: ["user"] });
    },
    onError: () => {
      // Clear any existing tokens on login failure
      clientTokens.clear();
    },
  });
}

export function useCurrentUser() {
  return useQuery({
    queryKey: ["user"],
    queryFn: async (): Promise<User | null> => {
      const tokens = clientTokens.get();
      if (!tokens) return null;

      try {
        const apiUser = await apiClient.get<any>("/v1/user/me");
        return transformApiUser(apiUser);
      } catch (error) {
        // If user fetch fails, clear tokens
        clientTokens.clear();
        return null;
      }
    },
    retry: (failureCount, error) => {
      // Don't retry if no tokens or auth error
      return failureCount < 2 && !!clientTokens.get();
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useLogout() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      // Clear tokens from cookies
      clientTokens.clear();

      // You might want to call a logout endpoint here if your backend requires it
      // await apiClient.post('/v1/auth/logout');
    },
    onSuccess: () => {
      // Clear all cached data
      queryClient.clear();
    },
  });
}

export function useRefreshToken() {
  return useMutation({
    mutationFn: async (): Promise<ApiAuthResponse> => {
      const tokens = clientTokens.get();
      if (!tokens?.refreshToken) {
        throw new Error("No refresh token available");
      }

      const response = await apiClient.post<ApiAuthResponse>(
        "/v1/auth/refresh",
        {
          refreshToken: tokens.refreshToken,
        },
      );

      // Store new tokens
      clientTokens.set({
        accessToken: response.accessToken,
        refreshToken: response.refreshToken,
      });

      return response;
    },
  });
}

export function useUsers(params: UsersQueryParams = {}) {
  return useQuery({
    queryKey: ["users", params],
    queryFn: async (): Promise<UsersResponse> => {
      const tokens = clientTokens.get();
      if (!tokens) {
        throw new Error("No access token available");
      }

      try {
        const endpoint = buildUsersQueryString(params);
        const response = await apiClient.get<UsersResponse>(endpoint);
        return response;
      } catch (error) {
        console.error("Error fetching users:", error);
        throw error;
      }
    },
    retry: (failureCount, error) => {
      // Don't retry if no tokens or auth error
      return failureCount < 2 && !!clientTokens.get();
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: !!clientTokens.get(), // Only run if we have tokens
  });
}

export function useUserDetails(userId: string) {
  return useQuery({
    queryKey: ["user", userId],
    queryFn: async (): Promise<ApiUser> => {
      const tokens = clientTokens.get();
      if (!tokens) {
        throw new Error("No access token available");
      }

      try {
        const endpoint = buildUserDetailsEndpoint(userId);
        const response = await apiClient.get<ApiUser>(endpoint);
        return response;
      } catch (error) {
        console.error("Error fetching user details:", error);
        throw error;
      }
    },
    retry: (failureCount, error) => {
      // Don't retry if no tokens or auth error
      return failureCount < 2 && !!clientTokens.get();
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: !!clientTokens.get() && !!userId, // Only run if we have tokens and userId
  });
}

export function useRegions(params: RegionsQueryParams = {}) {
  return useQuery({
    queryKey: ["regions", params],
    queryFn: async (): Promise<RegionsResponse> => {
      const tokens = clientTokens.get();
      if (!tokens) {
        throw new Error("No access token available");
      }

      try {
        const endpoint = buildRegionsQueryString(params);
        const response = await apiClient.get<RegionsResponse>(endpoint);
        return response;
      } catch (error) {
        console.error("Error fetching regions:", error);
        throw error;
      }
    },
    retry: (failureCount, error) => {
      // Don't retry if no tokens or auth error
      return failureCount < 2 && !!clientTokens.get();
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: !!clientTokens.get(), // Only run if we have tokens
  });
}

export function useCompanies(params: CompaniesQueryParams = {}) {
  return useQuery({
    queryKey: ["companies", params],
    queryFn: async (): Promise<CompaniesResponse> => {
      const tokens = clientTokens.get();
      if (!tokens) {
        throw new Error("No access token available");
      }

      try {
        const endpoint = buildCompaniesQueryString(params);
        const response = await apiClient.get<CompaniesResponse>(endpoint);
        return response;
      } catch (error) {
        console.error("Error fetching companies:", error);
        throw error;
      }
    },
    retry: (failureCount, error) => {
      // Don't retry if no tokens or auth error
      return failureCount < 2 && !!clientTokens.get();
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: !!clientTokens.get(), // Only run if we have tokens
  });
}

export function useCountries(params: CountriesQueryParams = {}) {
  return useQuery({
    queryKey: ["countries", params],
    queryFn: async (): Promise<CountriesResponse> => {
      const tokens = clientTokens.get();
      if (!tokens) {
        throw new Error("No access token available");
      }

      try {
        const endpoint = buildCountriesQueryString(params);
        const response = await apiClient.get<CountriesResponse>(endpoint);
        return response;
      } catch (error) {
        console.error("Error fetching countries:", error);
        throw error;
      }
    },
    retry: (failureCount, error) => {
      // Don't retry if no tokens or auth error
      return failureCount < 2 && !!clientTokens.get();
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: !!clientTokens.get(), // Only run if we have tokens
  });
}

export function useCountryDetails(countryId: string) {
  return useQuery({
    queryKey: ["country", countryId],
    queryFn: async (): Promise<ApiCountry> => {
      const tokens = clientTokens.get();
      if (!tokens) {
        throw new Error("No access token available");
      }

      try {
        const endpoint = buildCountryDetailsEndpoint(countryId);
        const response = await apiClient.get<ApiCountry>(endpoint);
        return response;
      } catch (error) {
        console.error("Error fetching country details:", error);
        throw error;
      }
    },
    retry: (failureCount, error) => {
      // Don't retry if no tokens or auth error
      return failureCount < 2 && !!clientTokens.get();
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: !!clientTokens.get() && !!countryId, // Only run if we have tokens and countryId
  });
}

export function useRegionDetails(regionId: string) {
  return useQuery({
    queryKey: ["region", regionId],
    queryFn: async (): Promise<ApiRegion> => {
      const tokens = clientTokens.get();
      if (!tokens) {
        throw new Error("No access token available");
      }

      try {
        const endpoint = buildRegionDetailsEndpoint(regionId);
        const response = await apiClient.get<ApiRegion>(endpoint);
        return response;
      } catch (error) {
        console.error("Error fetching region details:", error);
        throw error;
      }
    },
    retry: (failureCount, error) => {
      // Don't retry if no tokens or auth error
      return failureCount < 2 && !!clientTokens.get();
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: !!clientTokens.get() && !!regionId, // Only run if we have tokens and regionId
  });
}

export function useUpdateRegion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      regionId,
      data,
    }: {
      regionId: string;
      data: {
        name?: string;
        image?: File;
      };
    }): Promise<ApiRegion> => {
      const tokens = clientTokens.get();
      if (!tokens) {
        throw new Error("No access token available");
      }

      try {
        const endpoint = buildRegionDetailsEndpoint(regionId);
        
        // Use FormData if there's a file, otherwise JSON
        if (data.image) {
          const formData = new FormData();
          if (data.name) formData.append('name', data.name);
          formData.append('image', data.image);
          
          const response = await apiClient.put<ApiRegion>(endpoint, formData);
          return response;
        } else {
          // Filter out undefined values and image
          const cleanData = Object.entries(data)
            .filter(([key, value]) => value !== undefined && key !== 'image')
            .reduce((obj, [key, value]) => ({ ...obj, [key]: value }), {});
            
          const response = await apiClient.put<ApiRegion>(endpoint, cleanData);
          return response;
        }
      } catch (error) {
        console.error("Error updating region:", error);
        throw error;
      }
    },
    onSuccess: (data, variables) => {
      // Invalidate and refetch region details
      queryClient.invalidateQueries({ queryKey: ["region", variables.regionId] });
      // Invalidate regions list as well
      queryClient.invalidateQueries({ queryKey: ["regions"] });
    },
  });
}

export function useUpdateCountry() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      countryId,
      data,
    }: {
      countryId: string;
      data: {
        name?: string;
        regionId?: string;
        alpha2?: string;
        alpha3?: string;
        flag?: File;
      };
    }): Promise<ApiCountry> => {
      const tokens = clientTokens.get();
      if (!tokens) {
        throw new Error("No access token available");
      }

      try {
        const endpoint = buildCountryDetailsEndpoint(countryId);
        
        // Use FormData if there's a file, otherwise JSON
        if (data.flag) {
          const formData = new FormData();
          if (data.name) formData.append('name', data.name);
          if (data.regionId) formData.append('regionId', data.regionId);
          if (data.alpha2) formData.append('alpha2', data.alpha2);
          if (data.alpha3) formData.append('alpha3', data.alpha3);
          formData.append('flag', data.flag);
          
          const response = await apiClient.put<ApiCountry>(endpoint, formData);
          return response;
        } else {
          // Filter out undefined values and flag
          const cleanData = Object.entries(data)
            .filter(([key, value]) => value !== undefined && key !== 'flag')
            .reduce((obj, [key, value]) => ({ ...obj, [key]: value }), {});
            
          const response = await apiClient.put<ApiCountry>(endpoint, cleanData);
          return response;
        }
      } catch (error) {
        console.error("Error updating country:", error);
        throw error;
      }
    },
    onSuccess: (data, variables) => {
      // Invalidate and refetch country details
      queryClient.invalidateQueries({ queryKey: ["country", variables.countryId] });
      // Invalidate countries list as well
      queryClient.invalidateQueries({ queryKey: ["countries"] });
    },
  });
}
