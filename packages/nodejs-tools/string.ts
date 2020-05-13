import { setTimer, endTimer, getTimer } from "./timer";
const dev = process.env.NODE_ENV === "development";

/**
 * asynchronously replace part of a string
 * @method replaceAsync
 * @param  {string}     str      [description]
 * @param  {regular expression}     regex    [description]
 * @param  {[type]}     replacer a function that returns a promise
 * @return {str}
 */
/*
 https://github.com/RSamaium/async-replace

todo:
 - regex = Regex | string
 - replacer: any (string | fn:()=>any | async fn | promise | any athor type (cust to string))
   ex: replacer may be a promise or a function that returns a promise
 */
export function replaceAsync(str, regex, replacer) {
  setTimer("replaceAsync");
  const matched = str.match(regex);
  if (!matched) return Promise.resolve(str);
  if (!regex.global)
    return replacer(...matched).then(newStr => str.replace(regex, newStr));

  //if regex.global (i.e: /regex/g) we need to recursively apply the replacement
  let i = 0;
  let index = 0;
  const result = [];
  const copy = new RegExp(regex.source, regex.flags.replace("g", ""));
  const callbacks = [];

  while (matched.length > 0) {
    const substr = matched.shift(); //remove the first element and return it
    const nextIndex = str.indexOf(substr, index); //position of substr after the current index
    result[i] = str.slice(index, nextIndex);
    i++;
    let j = i;
    callbacks.push(
      replacer(...substr.match(copy), nextIndex, str).then(newStr => {
        result[j] = newStr;
      })
    );
    index = nextIndex + substr.length;
    i++;
  }
  result[i] = str.slice(index);
  return Promise.all(callbacks).then(() => {
    if (dev)
      console.log("replaceAsync", endTimer("replaceAsync"), { str, regex });
    return result.join("");
  });
}
