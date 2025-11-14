import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  route("login", "routes/login.tsx"),
  route("login/oauth/:provider", "routes/oauth.tsx"),
  route("oauth/callback/:provider", "routes/oauth_callback.tsx"),
  route("logout", "routes/logout.tsx"),
] satisfies RouteConfig;
