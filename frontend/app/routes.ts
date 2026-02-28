import { type RouteConfig, index, route, layout } from "@react-router/dev/routes";

export default [
  layout("layouts/DashboardLayout.tsx", [
    index("routes/home.tsx"),
    route("vessels", "routes/vessels/index.tsx"),
    route("vessels/:id", "routes/vessels/detail.tsx"),
    route("vessels/:id/breakdowns", "routes/vessels/breakdowns.tsx"),
    route("certificates", "routes/certificates/index.tsx"),
    route("surveys", "routes/surveys/index.tsx"),
    route("profile", "routes/profile.tsx"),
    route("requests", "routes/requests/index.tsx"),
    route("requests/:id", "routes/requests/detail.tsx"),
    route("jobs", "routes/jobs/index.tsx"),
    route("admin", "routes/admin/index.tsx"),
    route("admin/checklists", "routes/admin/checklists.tsx"),
    route("admin/breakdown-templates", "routes/admin/breakdown-templates/index.tsx"),
    route("admin/breakdown-templates/:id", "routes/admin/breakdown-templates/detail.tsx"),
  ]),
  route("jobs/:id", "routes/jobs/layout.tsx", [
    index("routes/jobs/overview.tsx"),
    route("job-description", "routes/jobs/job-description.tsx"),
    route("assign-surveyor", "routes/jobs/assign-surveyor.tsx"),
    route("register-scope", "routes/jobs/register-scope.tsx"),
    route("checklist", "routes/jobs/checklist.tsx"),
    // route(":itemId", "routes/jobs/item.tsx"),
  ]),
  route("login", "routes/login.tsx"),
  route("login/oauth/:provider", "routes/oauth.tsx"),
  route("oauth/callback/:provider", "routes/oauth-callback.tsx"),
  route("logout", "routes/logout.tsx"),
  route("forgot-password", "routes/forgot-password.tsx"),
  route("reset-password", "routes/reset-password.tsx"),
] satisfies RouteConfig;
