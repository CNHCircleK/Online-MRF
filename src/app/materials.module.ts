import { NgModule } from '@angular/core';

import { MatFormFieldModule, MatIconModule, MatCardModule, MatGridListModule, MatInputModule,
			MatButtonModule } from '@angular/material';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

@NgModule({
	imports: [
		MatFormFieldModule,
		MatIconModule,
		MatCardModule, 
		MatGridListModule,
		MatInputModule,
		MatButtonModule,
		BrowserAnimationsModule
	],
	exports: [
		MatFormFieldModule,
		MatIconModule,
		MatCardModule, 
		MatGridListModule,
		MatInputModule,
		MatButtonModule,
		BrowserAnimationsModule
	]
})

export class MaterialsModule { }