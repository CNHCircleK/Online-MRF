import { BrowserModule } from '@angular/platform-browser';

import { NgModule } from '@angular/core';

import { AppComponent } from './app.component';
import { CoreModule } from '@core/core.module';


import {
    LoginComponent,
    SignupComponent,
	CerfComponent,
    CerfListComponent, 
	MrfComponent,
    MrfListComponent,
    MyCerfsComponent,
    MrfSecretaryComponent,
    MrfDivisionComponent,
    MrfDistrictComponent,
    MembersComponent,
    DialogNewMember,
    ClubsComponent,
    DialogNewClub,
	ProfileComponent,
    FAQsComponent,
    SettingsComponent,
    ConfirmDialogComponent,
    InfoDialog,
    TagsDialog,
    NewFocusInput,
    InputList } from '@app/modules/';

import { RouteReuseStrategy } from '@angular/router';
import { MrfReuseStrategy } from '@core/guards/reuse-strategy';
import { httpInterceptorProviders } from '@core/http-interceptors';
import { HttpClientModule } from '@angular/common/http';
import HttpConfig from '@env/api_config';
import { MemberIDPipe } from '@core/utils/memberid.pipe';
// import { JwtModule, JWT_OPTIONS } from '@auth0/angular-jwt';
// export function tokenGetter() {
//   return localStorage.getItem('access_token');
// }

@NgModule({
  declarations: [
    AppComponent,
    LoginComponent,
    SignupComponent,
    CerfComponent,
    MrfComponent,
    CerfListComponent,
    MrfListComponent,
    MyCerfsComponent,
    MrfSecretaryComponent,
    MrfDivisionComponent,
    MrfDistrictComponent,
    MembersComponent,
    DialogNewMember,
    ClubsComponent,
    DialogNewClub,
    ProfileComponent,
    FAQsComponent,
    SettingsComponent,
    ConfirmDialogComponent,
    InfoDialog,
    TagsDialog,
    NewFocusInput,
    InputList,
    MemberIDPipe
  ],
  imports: [
    BrowserModule,
    CoreModule,
    HttpClientModule
    // JwtModule.forRoot({
    //   config: {
    //     tokenGetter: tokenGetter,
    //     whitelistedDomains: [HttpConfig.schemelessUrl],
    //     blacklistedRoutes: []
    //   }
    // })
  ],
  providers: [httpInterceptorProviders],//, {provide: RouteReuseStrategy, useClass: MrfReuseStrategy}],
  bootstrap: [AppComponent],
  entryComponents: [ConfirmDialogComponent, InfoDialog, TagsDialog, DialogNewMember, DialogNewClub]
})
export class AppModule {
}
