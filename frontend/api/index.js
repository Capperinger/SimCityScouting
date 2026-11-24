import app from "../api-app.js";

const ROUTES = new Set([
    "debug",
    "login",
    "list",
    "read",
    "readRt",
    "register",
    "time",
    "write",
]);

export default function handleApiRequest(request, response) {
    const requestUrl = new URL(request.url || "/", "http://localhost");
    const route = requestUrl.searchParams.get("route");

    if (!route || !ROUTES.has(route)) {
        response.statusCode = 404;
        response.setHeader("Content-Type", "application/json");
        response.end(JSON.stringify({ message: "Unknown API route" }));
        return;
    }

    requestUrl.searchParams.delete("route");
    const query = requestUrl.searchParams.toString();
    request.url = `/api/${route}${query ? `?${query}` : ""}`;
    return app(request, response);
}
