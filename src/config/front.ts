import env from "../env";

export function metaTags(type: string = "articles") {
  return {
    name: "المجتمع دوت كوم",
    baseUrl: env.dev ? "http://localhost:4200/" : "https://www.almogtama3.com/",
    link: "https://www.almogtama3.com/" + (type !== "articles") ? type : "",
    description: "المجتمع دوت كوم, مقالات متنوعة وتعليم لغات وفرص عمل",
    "content-language": "ar,en",
    image: { src: `/assets/site-image/${type}.webp` },
    twitter: {
      site: "almogtama3_ar",
      "site:id": "almogtama3_ar"
      //todo: app:name:iphone,...
    },
    //name will be added to title via meta.service
    title: type === "jobs" ? "وظائف" : ""
  };
}

export const ADSENSE = env.dev
  ? "ca-app-pub-3940256099942544" //test https://developers.google.com/admob/android/test-ads
  : "ca-pub-8421502147716920"; //sh.eldeeb.2010
