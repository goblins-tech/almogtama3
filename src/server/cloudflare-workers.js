//todo: convert express app to cloudflare workers

addEventListener("fetch", event => {
  console.log({ event });

  // if error, return the origin response (i.e server response)
  event.passThroughOnException();
  event.respondWith(handle(event.request));
});

function handle(req) {
  return new Response("cloudflare-workers works");
}
