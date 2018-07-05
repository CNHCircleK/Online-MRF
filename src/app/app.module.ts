import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { AppComponent } from './app.component';
import { SidenavComponent } from './sidenav/sidenav.component';
import { CerfnavComponent, CerfcardComponent, CerfComponent } from './cerfs'; // barrel
import { MaterialsModule } from './materials.module';
import { AppRoutingModule } from './/app-routing.module';
import { FlexLayoutModule } from '@angular/flex-layout';

@NgModule({
  declarations: [
    AppComponent,
    SidenavComponent,
    CerfnavComponent,
    CerfcardComponent,
    CerfComponent
  ],
  imports: [
    BrowserModule,
    MaterialsModule,
    AppRoutingModule,
    FlexLayoutModule
  ],
  providers: [],
  bootstrap: [AppComponent],
})
export class AppModule { }
