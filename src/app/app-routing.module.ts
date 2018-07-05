import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { AppComponent } from './app.component';
import { CerfnavComponent } from './cerfs';
import { CerfComponent } from './cerfs/cerf/cerf.component';

const routes: Routes = [
	{ path: 'cerfs', component: CerfnavComponent},
	{ path: 'cerf/:id', component: CerfComponent }
]

@NgModule({
  imports: [
    RouterModule.forRoot(routes)
  ],
  exports: [ RouterModule ]
})
export class AppRoutingModule { }