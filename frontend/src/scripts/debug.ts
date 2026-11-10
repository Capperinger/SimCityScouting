import { de } from "./firebase";
import { readCookie } from "./user";

export const debug =
    import.meta.env.DEV || readCookie("user") === "testUser"
        ? true
        : await de().catch((error: unknown) => {
              console.error("Unable to load debug-user permissions:", error);
              return false;
          });
