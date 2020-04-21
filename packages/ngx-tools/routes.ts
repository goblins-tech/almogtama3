import { Observable, combineLatest } from "rxjs";
import { ActivatedRoute, ParamMap } from "@angular/router";

export type Param = Observable<ParamMap>;
/**
 * Observe changes of the activated route for both params and query strings.
 * @method urlParams
 * @param  route     the current activated route
 * @return Observable<[Param, Param]>
 */
export function urlParams(route: ActivatedRoute): Observable<[Param, Param]> {
  return combineLatest(route.paramMap, route.queryParamMap);
}
