start "build" npm run start:dev

::rebuild browser: npm run build:browser:dev && npm run serve
::rebuild server: npm run build:server:dev && npm run webpack:server && npm run serve
