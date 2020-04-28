import shortId from "shortid";
export const basic = {};

//times (createdAt, updatedAt) are added automatically, by the option {typestamps: true}

export const articles = {
  _id: { type: String, default: shortId.generate },
  title: String,
  subtitle: String,
  content: String,
  keywoards: [String],
  author: [{ type: String, ref: "persons" }],
  status: String, //pending, approved, denied, expired
  notes: String, //ex: denied reason
  type: String,
  contacts: String, //for jobs
  categories: [String]
};

export const categories = {
  _id: { type: String, default: shortId.generate },
  title: String,
  slug: String,
  config: {}
};

/*
jobsSchema = { ...schemas["article"], contacts: String } as typeof contentObj;
//https://stackoverflow.com/a/31816062/12577650 & https://github.com/microsoft/TypeScript/issues/18075
*/
