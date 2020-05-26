/**
 * divide Array into chuncks
 * @method chunk
 * @param  arr       [description]
 * @param  chunkSize [description]
 * @return [description]
 */

export function chunk(arr: Array<any>, chunkSize: number) {
  let result = [];
  for (let i = 0; i < arr.length; i += chunkSize)
    result.push(arr.slice(i, i + chunkSize));
  return result;
}
