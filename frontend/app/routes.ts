import { type RouteConfig, index, route, layout } from "@react-router/dev/routes";

export default [
  layout("layouts/DashboardLayout.tsx", [
    index("routes/home.tsx"),
    route("vessels", "routes/vessels/index.tsx"),
    route("vessels/:id", "routes/vessels/detail.tsx"),
    route("certificates", "routes/certificates/index.tsx"),
    route("surveys", "routes/surveys/index.tsx"),
    route("profile", "routes/profile.tsx"),
  ]),
  route("login", "routes/login.tsx"),
  route("login/oauth/:provider", "routes/oauth.tsx"),
  route("oauth/callback/:provider", "routes/oauth_callback.tsx"),
  route("logout", "routes/logout.tsx"),
  route("forgot-password", "routes/forgot-password.tsx"),
  route("reset-password", "routes/reset-password.tsx"),
] satisfies RouteConfig;
