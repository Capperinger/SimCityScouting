// utils/axiomLogger.ts
import { Axiom } from "@axiomhq/js";

const axiom = new Axiom({
    token: "xaat-9a8b4bc5-72e3-4ad3-8c33-5cfcf95b5acb",
});

const DATASET = "app-logs";

export const log = async (message: string): Promise<void> => {
    let sent = false;

    while (!sent) {
        try {
            console.log(message);
            axiom.ingest(DATASET, [{ message }]);
            await axiom.flush();
            sent = true;
        } catch {
            await new Promise((res) => setTimeout(res, 5000));
        }
    }
};
