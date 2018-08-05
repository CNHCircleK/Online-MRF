import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { Resolve, CanActivate } from '@angular/router';

import { CerfComponent, MyCerfsComponent,
		MrfComponent, MrfSecretaryComponent, MrfDivisionComponent, MrfDistrictComponent,
		ProfileComponent, LoginComponent, SignupComponent } from '@app/modules/';
import { MyCerfsResolver, CerfResolver } from '@core/guards/cerf-resolver.guard';
import { MrfResolver, MrfSecretaryResolver, MrfDivisionResolver, MrfDistrictResolver } from '@core/guards/mrf-resolver.guard';
import { AuthGuard } from '@core/guards/auth.guard';

const routes: Routes = [
	{ path: 'cerfs', component: MyCerfsComponent, resolve: { myCerfs: MyCerfsResolver }, canActivate: [AuthGuard]  },
	{ path: 'login', component: LoginComponent },
	{ path: 'signup', component: SignupComponent },	
	{ path: 'cerf/:id', component: CerfComponent, resolve: { cerf: CerfResolver }, canActivate: [AuthGuard] },
	{ path: 'mrfs', component: MrfSecretaryComponent, resolve: { secretaryMrfs: MrfSecretaryResolver }, canActivate: [AuthGuard] },
	{ path: 'mrf/:id', component: MrfComponent, resolve: { mrf: MrfResolver }, canActivate: [AuthGuard]  },
	{ path: 'divmrfs', component: MrfDivisionComponent, resolve: { divisionMrfs: MrfDivisionResolver }, canActivate: [AuthGuard] },
	{ path: 'distmrfs', component: MrfDistrictComponent, resolve: { districtMrfs: MrfDistrictResolver }, canActivate: [AuthGuard] },
	{ path: '', component: ProfileComponent, canActivate: [AuthGuard]}	// DEFAULT ROUTE
]

@NgModule({
  imports: [
    RouterModule.forRoot(routes)
  ],
  exports: [ RouterModule ]
})
export class AppRoutingModule { }