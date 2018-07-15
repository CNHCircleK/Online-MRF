import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { Resolve } from '@angular/router';

import { CerfListComponent, CerfComponent,
		MrfListComponent, MrfComponent,
		ProfileComponent } from '@app/modules/';
import { CerfnavResolver } from '@core/guards/cerfnav-resolver.service';

const routes: Routes = [
	{ path: 'cerfs', component: CerfListComponent, resolve: { CerfnavResolver } },
	{ path: 'cerf/:id', component: CerfComponent, resolve: { CerfnavResolver } },
	{ path: 'mrfs', component: MrfListComponent },
	{ path: 'mrf/:id', component: MrfComponent },
	{ path: '', component: ProfileComponent}	// DEFAULT ROUTE
]

@NgModule({
  imports: [
    RouterModule.forRoot(routes)
  ],
  exports: [ RouterModule ]
})
export class AppRoutingModule { }