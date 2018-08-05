import { Injectable } from '@angular/core';
import { CanActivate, Router, RouterStateSnapshot, ActivatedRouteSnapshot } from '@angular/router';
import { Observable, of } from 'rxjs';
import { map, take, filter, pairwise } from 'rxjs/operators';

import { Cerf } from '@core/data/cerf';
import { DataService } from '@core/data/data.service';
import { AuthService } from '@core/authentication/auth.service';

@Injectable( { providedIn: 'root' })
export class AuthGuard implements CanActivate {
	constructor(private auth: AuthService, private router: Router) {

	}

	canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot) {
		if(!this.auth.isLoggedIn())
		{
			//window.alert("You must be logged in");
			this.router.navigate(['/login']);
			return false;
		}

		return this.auth.getUser().pipe(map(user => {
			if(!user) return false;
			console.log(state.url);
			if(state.url=='/mrfs')
			{
				if(user.access.club > 0) return true;
				else {
					window.alert("You do not have permission to view this");
					this.router.navigate(['']);
					return false;
				}
			}
			if(state.url=='/cerfs')
					return true;
			return true;	// should definitely default false, but need to figure out how to authorize '/cerf/:id'
		}));
	}
}