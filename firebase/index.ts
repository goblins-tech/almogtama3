require("zone.js/dist/zone-node"); // todo: why?

import * as functions from "firebase-functions";
import { enableProdMode } from "@angular/core";
import { app } from "../server";

enableProdMode();

// to test: https://us-central1-<projectId>.cloudfunctions.net/<functionName>
export const test = functions.https.onRequest((request, response) => {
  response.send("firebase function works");
});

export const ssr = functions.https.onRequest(app);
