import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
    index("routes/home.tsx"),
    route("about", "routes/about.tsx"),
    route("services", "routes/services.tsx"),
    route("adopt", "routes/adopt.tsx"),
    route("donate", "routes/donate.tsx"),
] satisfies RouteConfig;
