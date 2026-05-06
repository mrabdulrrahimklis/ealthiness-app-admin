import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/_index.tsx"),
  route("/home", "routes/home.tsx"),
  route("/regions", "routes/regions.tsx"),
  route("/regions/:id", "routes/region.$id.tsx"),
  route("/countries", "routes/countries.tsx"),
  route("/countries/:id", "routes/country.$id.tsx"),
  route("/companies", "routes/companies.tsx"),
  route("/companies/:id", "routes/companies.$id.tsx"),
  route("/customers", "routes/customers.tsx"),
  route("/customers/:id", "routes/customer.$id.tsx"),
  route("/settings", "routes/settings.tsx"),
  route("/unauthorized", "routes/unauthorized.tsx"),
  route("/admin-registration", "routes/admin-registration.tsx"),
] satisfies RouteConfig;
