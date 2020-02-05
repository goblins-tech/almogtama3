import _sharp from "sharp";
import { parsePath } from "./fs";

export const sharp = _sharp;

/**
 * [resize description]
 * @method resize
 * @param  {string | Buffer} img     file path or image buffer;
 * @param  {number | number[] | string} size    width or [width, height] or 'width,height'
 * @param  {[type]} options [description]
 * @return Promise<info>
 */
export function resize(
  img: string | Buffer,
  size: number | number[] | string,
  options?
): Promise<any> {
  options = options || {};
  //todo: devide options into options[part]={ ... }
  //to make other operations, such as rotate(), maje them outside of this function
  //ex: resize().rotate()
  //todo: img: Obj{width,height,..} -> sharp({create:{ .. }});
  if (typeof size == "string") size = size.split(",").map(el => +el);
  else if (typeof size == "number") size = [size, null];
  var resizedImg;

  if (!(img instanceof _sharp)) resizedImg = _sharp(img, options.sharp);

  resizedImg = resizedImg.resize(size[0], size[1], options.resize);

  if (options.withMetadata !== false) resizedImg = resizedImg.withMetadata();

  //by default the return type is the same of the input type unless options.output
  //forces another type
  let name;
  if (options.output == "file" || (!options.output && typeof img == "string")) {
    if (typeof options.name == "string") name = options.name;
    else if (typeof options.name == "function")
      name = options.name(img, size, options);
    //todo: info
    else {
      if (typeof img == "string") {
        let parts = parsePath(img);
        name = `${parts.dir}/${parts.file}_${size[0]}${parts.extension}`;
      } else name = "image"; //todo: get extension from mimeType
    }
    resizedImg = resizedImg.toFile(name);
  } else if (
    options.output == "buffer" ||
    (!options.output && img instanceof Buffer)
  )
    resizedImg = resizedImg.toBuffer();
  else resizedImg = resizedImg.toFormat(options.output); //todo: .JPEG(), .png(), ..
  return resizedImg.then(info => {
    info.file = name;
    return info;
  });
}
