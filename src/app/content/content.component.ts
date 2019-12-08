import { Component, OnInit } from "@angular/core";
import { ActivatedRoute } from "@angular/router";

@Component({
  selector: "app-content",
  templateUrl: "./content.component.html",
  styleUrls: ["./content.component.scss"]
})
export class ContentComponent implements OnInit {
  data = {};
  constructor(private route: ActivatedRoute) {}
  ngOnInit() {
    this.data = this.route;
  }

  getData() {
    let params = this.route.paramMap;
    this.httpService.get(`/api/${params.type}/${params.id}`);
  }
}
