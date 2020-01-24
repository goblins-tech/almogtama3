import { Observable, combineLatest } from "rxjs";
import { ActivatedRoute } from "@angular/router";

export function urlParams(route: ActivatedRoute): Observable<[any, any]> {
  return combineLatest(route.paramMap, route.queryParamMap);
}
