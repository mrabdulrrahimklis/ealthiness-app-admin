import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/_index.tsx"),
  route("/home", "routes/home.tsx"),
  route("/regions", "routes/regions.tsx"),
  route("/regions/:id", "routes/region.$id.tsx"),
  route("/regions/:id/users", "routes/region.$id.users.tsx"),
  route("/regions/:id/countries", "routes/region.$id.countries.tsx"),
  route("/regions/:id/companies", "routes/region.$id.companies.tsx"),
  route("/countries", "routes/countries.tsx"),
  route("/countries/:id", "routes/country.$id.tsx"),
  route("/countries/:id/users", "routes/country.$id.users.tsx"),
  route("/countries/:id/companies", "routes/country.$id.companies.tsx"),
  route("/companies", "routes/companies.tsx"),
  route("/companies/:id", "routes/companies.$id.tsx"),
  route("/companies/:id/users", "routes/companies.$id.users.tsx"),
  route("/customers", "routes/customers.tsx"),
  route("/customers/:id", "routes/customer.$id.tsx"),
  route("/settings", "routes/settings.tsx"),
  route("/unauthorized", "routes/unauthorized.tsx"),
  route("/admin-registration", "routes/admin-registration.tsx"),
  route("/accept-invitation", "routes/accept-invitation.tsx"),
] satisfies RouteConfig;
