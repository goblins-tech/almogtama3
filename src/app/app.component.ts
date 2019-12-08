import { Component } from "@angular/core";
import { Router } from "@angular/router";

@Component({
  selector: "app-root",
  templateUrl: "./app.component.html",
  styleUrls: ["./app.component.scss"]
})
export class AppComponent implements OnInit {
  title = "almogtama3";
  constructor(private router: Router) {}
  ngOnInit() {}
  go(path: Array | string) {
    if (typeof path == "string") path = [path];
    this.router.navigate(path);
  }
}
