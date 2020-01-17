import { Pipe, PipeTransform } from "@angular/core";
import * as fn from "./functions";

@Pipe({
  name: "slug"
})
export class SlugPipe implements PipeTransform {
  /**
   * convert the post title into a slug,
   * i.e: replace white spaces, remove unwanted words (numbers, Prepositions, 2 chars words),
   * limit slug to $n words
   * @method transform
   * @param  value     [description]
   * @return [description]
   */
  transform(value, length = 200): string {
    return fn.slug(value, length);
  }
}

@Pipe({
  name: "content"
})
export class ContentPipe implements PipeTransform {
  //constructor(private sanitizer: DomSanitizer) {}
  transform(value): string {
    return fn.content(value);
  }
}

@Pipe({
  name: "summary"
})
export class SummaryPipe implements PipeTransform {
  transform(value): string {
    return fn.summary(value);
  }
}

@Pipe({
  name: "length"
})
export class LengthPipe implements PipeTransform {
  transform(value: string, length = 200): string {
    return fn.length(value, length);
  }
}

@Pipe({
  name: "nl2br"
})
export class Nl2brPipe implements PipeTransform {
  transform(value: string): string {
    return fn.nl2br(value);
  }
}

@Pipe({ name: "keepHtml", pure: false })
export class KeepHtmlPipe implements PipeTransform {
  constructor(/*private sanitizer: DomSanitizer*/) {}
  /**
  Display HTML without sanitizing
  don't do: <p>{{content | keepHtml}}</p> -> error: SafeValue must use [property]=binding
  do: <p [innerHTML]='content | keepHtml'></p>
  https://stackoverflow.com/a/58618481
  https://medium.com/@AAlakkad/angular-2-display-html-without-sanitizing-filtering-17499024b079

 * @method transform
 * @param  content   [description]
 * @return [description]
 */
  transform(content) {
    return fn.keepHtml(content /*, this.sanitizer*/);
  }
}
