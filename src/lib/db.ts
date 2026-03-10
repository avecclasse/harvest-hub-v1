import { init } from "@instantdb/react";
import schema from "../../instant.schema";

const APP_ID = "4f628985-38cd-4ff4-bad6-49193761e751";

export const db = init({
  appId: APP_ID,
  schema,
});
