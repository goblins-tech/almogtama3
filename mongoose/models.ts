export const basic = {};

export const articles = {
  title: String,
  subtitle: String,
  content: String,
  keywoards: String,
  date: { type: Date, default: Date.now },
  contacts: String //for jobs
  //todo: other properties;
};

export const categories = {
  title: String,
  slug: String,
  config: {}
};

/*
jobsSchema = { ...schemas["article"], contacts: String } as typeof contentObj;
//https://stackoverflow.com/a/31816062/12577650 & https://github.com/microsoft/TypeScript/issues/18075
*/
