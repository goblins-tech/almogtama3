import { app } from "./index";

// Start up the Node server
//todo: check if app already listening.
//todo: onError, try port++
//todo: the output file `dist/server-start.js` is too big, does we need to compile it with webpack or just tsc??
const PORT = process.env.PORT || 4200;
let server = app
  .listen(PORT, () => {
    console.log(`Node Express server listening on port:${PORT}`); //,{server}
  })
  .on("error", error => console.warn("express server error:", { error }));
