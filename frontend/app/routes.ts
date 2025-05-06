import { type RouteConfig, index, route  } from "@react-router/dev/routes";

export default [
    index("routes/home.tsx"),
    route("login", "routes/login.tsx"),
    route("logout", "routes/logout.tsx"),
    route("todos", "routes/playground/todos.tsx"),
    route('todos/:pk/edit', 'routes/playground/edit-todo.tsx'),
    route('todos/:pk/delete', 'routes/playground/delete-todo.tsx'),
    route("dashboard", "routes/dashboard.tsx"),
    route('ship-status',"routes/ship-status.tsx"),
    route('pagination', "routes/pagination.tsx"),
] satisfies RouteConfig;