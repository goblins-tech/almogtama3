import env from "../env";

//todo: all metaTags
export const metaTags = {
  name: "المجتمع دوت كوم",
  hashtag: "@almogtama3", //todo: @hashtag or #hashtag for twitter??
  baseUrl: env.dev ? "http://localhost:4200/" : "https://www.almogtama3.com/",
  link: "https://www.almogtama3.com/",
  description: "almogtama3 dot com" //todo:
};

export const ADSENSE = env.dev
  ? "ca-app-pub-3940256099942544" //test https://developers.google.com/admob/android/test-ads
  : "ca-pub-8421502147716920"; //sh.eldeeb.2010
