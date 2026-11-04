import { de } from "./firebase";

export const debug = import.meta.env.DEV
    ? false
    : await de().catch((error: unknown) => {
          console.error("Unable to load debug-user permissions:", error);
          return false;
      });
