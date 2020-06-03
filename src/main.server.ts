import { enableProdMode } from "@angular/core";

import env from "./env";

if (!env.dev) {
  enableProdMode();
}

export { AppServerModule } from "./app/app.server.module";
export { ngExpressEngine } from "@nguniversal/express-engine";
