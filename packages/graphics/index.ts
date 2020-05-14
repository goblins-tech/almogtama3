import _sharp from "sharp";
import { parsePath, existsSync } from "../nodejs-tools/fs";

export const sharp = _sharp;

export interface ResizeOptions {
  format?: string;
  withMetadata?: boolean;
  dest?:
    | string
    | boolean
    | ((img: string | Buffer, size: number[], options: any) => string);
  [key: string]: any;
}
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
  options?: ResizeOptions
): Promise<any> {
  options = options || {};

  //this function always override the existing resized file, to prevent this
  //check if it exists, ore use nodejs-tools/fs.cache()

  if (options.dest == "")
    Promise.reject(
      "options.dest cannot be empty, to get a Buffer, remove this option"
    );

  //todo: devide options into options[part]={ ... }
  //to make other operations, such as rotate(), make them outside of this function
  //ex: resize().rotate()
  //todo: img: Obj{width,height,..} -> sharp({create:{ .. }});
  if (typeof size == "string") size = size.split(",").map(el => +el);
  else if (typeof size == "number") size = [size, null];

  //passing (0) to resizedImg.resize() will not generate the image.
  if (size[0] == 0) size[0] = null;
  if (size[1] == 0) size[1] = null;

  //it's allowed to dismmess both width and height, in this case the original
  //  dimemsions will be used to change the format
  if (!size[0] && !size[1] && !options.format)
    Promise.reject("no width or height specified");

  var resizedImg;
  if (!(img instanceof _sharp)) resizedImg = _sharp(img, options.sharp);
  resizedImg = resizedImg.resize(size[0], size[1], options.resize);

  if (options.withMetadata !== false) resizedImg = resizedImg.withMetadata();
  if (options.format) resizedImg.toFormat(options.format);

  if (options.dest) {
    if (typeof options.dest == "function")
      options.dest = options.dest(img, size, options);
    else if (options.dest === true) {
      //automatically set the destination
      let parts = parsePath(img);
      options.dest = `${parts.dir}/${parts.file}_${size[0]}${
        size[1] ? "X" + size[1] : ""
      }${parts.extension}`;
    }
    resizedImg = resizedImg
      .toFile(options.dest)
      .then(info => ({ options, ...info }));
  } else resizedImg = resizedImg.toBuffer();

  return resizedImg;
}
