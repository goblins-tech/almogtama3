/*
measure the execution time
example:
 setTimer('connection')
 connect().then(()=>console.log("connected", getTimer('connection')))

 logs: connected +5s (i.e: connection took 5 seconds)

 */

var timer = {};

export function setTimer(name?: string, time?: number) {
  timer[name || "default"] = time || new Date().getTime();
}

export function getTimer(name?: string, timeline = false) {
  let now = new Date().getTime();
  let diff = (now - timer[name] || now) / 1000;
  //if(!timeline) calculate the diff cumulativly,
  //i.e: the difference between now and the last timer, not from the start
  //ex: +3s
  if (!timeline) setTimer(name, now);

  return !timeline ? "+" + diff + "s" : diff;
}

export function endTimer(name?: string, timeline?: boolean) {
  let diff = getTimer(name, timeline);
  removeTimer(name);
  return diff;
}

export function removeTimer(name?: string) {
  delete timer[name || "default"];
}

export function resetTimer(name?: string) {
  setTimer(name, 0);
}
