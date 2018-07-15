/* 3rd party libraries */
import { NgModule, Optional, SkipSelf } from '@angular/core';
import { CommonModule } from '@angular/common';

/* Our components */
import { SidenavComponent,
		CerfComponent, CerfListComponent, 
		MrfComponent, MrfListComponent,
		ProfileComponent,
    ConfirmDialogComponent } from '@app/modules/';

/* Our services */
import { DataService } from '@core/data/data.service';

/* Our modules */
import { MaterialsModule } from '@app/modules/';
import { AppRoutingModule } from '@app/modules/app-routing.module';

/* Other modules */
import { FormsModule } from '@angular/forms';
import { FlexLayoutModule } from '@angular/flex-layout';

@NgModule({
  imports: [
    CommonModule,
    MaterialsModule,
    AppRoutingModule,
    FlexLayoutModule,
    FormsModule
  ],
  declarations: [
	 
  ],
  providers: [
    DataService
  ],
  exports: [
    CommonModule,
    MaterialsModule,
    AppRoutingModule,
    FlexLayoutModule,
    FormsModule
  ]
})
export class CoreModule {
  /* make sure CoreModule is imported only by one NgModule the AppModule */
  constructor (
    @Optional() @SkipSelf() parentModule: CoreModule,
    private dataService: DataService 	// We want to instantiate our service so the data is loaded before it's routed to /cerf
  ) {
    if (parentModule) {
      throw new Error('CoreModule is already loaded. Import only in AppModule');
    }
  }
}