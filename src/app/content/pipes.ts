import { Pipe, PipeTransform } from "@angular/core";
import { DomSanitizer } from "@angular/platform-browser";

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
  transform(value: string, length = 200): string {
    let slug = value.replace(/\s+/g, "-");
    if (length) slug = slug.slice(0, length);
    return slug;
    //todo: remove unwanted words
  }
}

@Pipe({
  name: "replace"
})
export class ReplacePipe implements PipeTransform {
  transform(value: string, x: string | RegExp, y: string = ""): string {
    return value.replace(x, y);
  }
}

@Pipe({
  name: "nl2br"
})
export class Nl2brPipe implements PipeTransform {
  transform(value: string): string {
    return value.replace(/\r\n|\n\r|\r|\n/g, "<br />");
  }
}

@Pipe({ name: "keepHtml", pure: false })
export class KeepHtmlPipe implements PipeTransform {
  constructor(private sanitizer: DomSanitizer) {}
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
  transform(content: string) {
    return content;

    return this.sanitizer.bypassSecurityTrustHtml(content);
  }
}
