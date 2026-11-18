import { pathToFileURL } from "node:url";
import app from "../frontend/api-app.js";

const PORT = Number(process.env.PORT || 3000);

export default app;

if (
    process.argv[1] &&
    import.meta.url === pathToFileURL(process.argv[1]).href
) {
    app.listen(PORT, () => {
        console.log(`currently running on ${PORT}`);
    });
}
