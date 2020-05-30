import { Component, OnInit } from "@angular/core";
import { MetaService } from "pkg/ngx-tools/meta.service";

@Component({
  selector: "app-social",
  templateUrl: "./social.html",
  styleUrls: ["./social.scss"]
})
export class SocialComponent implements OnInit {
  constructor(private metaService: MetaService) {}

  ngOnInit() {
    this.metaService.setTags({
      title: "تابعونا علي السوشيال ميديا",
      name: "almogtama3.com" //todo: from siteConfig{}
    });
  }
}
