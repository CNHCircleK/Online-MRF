import { BrowserModule } from '@angular/platform-browser';

import { NgModule } from '@angular/core';

import { AppComponent } from './app.component';
import { CoreModule } from '@core/core.module';


import { SidenavComponent,
		CerfComponent, CerfListComponent, 
		MrfComponent, MrfListComponent,
		ProfileComponent,
    ConfirmDialogComponent } from '@app/modules/';

import { JwtModule } from '@auth0/angular-jwt';
export function tokenGetter() {
  return localStorage.getItem('access_token');
}

@NgModule({
  declarations: [
    AppComponent,
    SidenavComponent,
    CerfComponent,
    MrfComponent,
    CerfListComponent,
    MrfListComponent,
    ProfileComponent,
    ConfirmDialogComponent
  ],
  imports: [
    BrowserModule,
    CoreModule,
    JwtModule.forRoot({
      config: {
        tokenGetter: tokenGetter,
        whitelistedDomains: [],
        blacklistedRoutes: []
      }
    })
  ],
  providers: [],
  bootstrap: [AppComponent],
  entryComponents: [ConfirmDialogComponent]
})
export class AppModule {
}
