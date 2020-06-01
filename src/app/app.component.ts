import { Component, OnInit } from "@angular/core";
import { Router } from "@angular/router";
import { metaTags } from "../config/front";

@Component({
  selector: "app-root",
  templateUrl: "./app.component.html",
  styleUrls: ["./app.component.scss"]
})
export class AppComponent implements OnInit {
  name = metaTags().name;
  constructor(private router: Router) {}
  ngOnInit() {}
  go(path: any[] | string) {
    if (typeof path == "string") path = [path];
    //  this.router.navigate(path);
  }
}
