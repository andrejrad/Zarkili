import { onRequest } from "firebase-functions/v2/https";
import { setGlobalOptions } from "firebase-functions/v2";

export {
  getAiBudgetConfigAdmin,
  listAiBudgetAuditLogsAdmin,
  updateAiBudgetConfigAdmin,
} from "./aiBudgetAdmin";

setGlobalOptions({ maxInstances: 10 });

export const health = onRequest((req, res) => {
  res.status(200).json({
    ok: true,
    message: "zarkili-functions-ready",
    method: req.method,
    timestamp: new Date().toISOString()
  });
});
