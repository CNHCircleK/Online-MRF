import { Injectable } from '@angular/core';
import { Router, Resolve, RouterStateSnapshot, ActivatedRouteSnapshot } from '@angular/router';
import { Observable } from 'rxjs';
import { map, take } from 'rxjs/operators';

import { Cerf } from '@core/data/cerf';
import { DataService } from '@core/data/data.service';

@Injectable( { providedIn: 'root' })
export class CerfnavResolver implements Resolve<Cerf[]> {
	constructor(private dataService: DataService, private router: Router) { }

	resolve(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<Cerf[]> {
		let data: Cerf[];
		this.dataService.getCerfs().subscribe(cerfs => data = cerfs);
		if(data === undefined)	// CERFs haven't been loaded. Note, "!data" doesn't work because the empty array returns false
		{
			this.router.navigate(['/']);
			return null;
		}

		// return this.cerfDataService.getCerfs().pipe(map(cerf => {	// Each CERF card
		// 	if(cerf) {
		// 		return cerf;
		// 	} else {
		// 		this.router.navigate(['/cerfs']);
		// 		return null;
		// 	}
		// })
		// )
	}
}