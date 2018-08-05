import { NgModule } from '@angular/core';

import { MatFormFieldModule, MatIconModule, MatCardModule, MatGridListModule, MatInputModule,
			MatButtonModule, MatTooltipModule, MatSelectModule, MatTableModule,
			MatSortModule, MatPaginatorModule, MatDividerModule, MatDialogModule } from '@angular/material';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

@NgModule({
	imports: [
		MatFormFieldModule,
		MatIconModule,
		MatCardModule, 
		MatGridListModule,
		MatInputModule,
		MatButtonModule,
		MatTooltipModule,
		MatSelectModule,
		MatTableModule,
		MatSortModule,
		MatPaginatorModule,
		MatDividerModule,
		MatDialogModule,
		BrowserAnimationsModule
	],
	exports: [
		MatFormFieldModule,
		MatIconModule,
		MatCardModule, 
		MatGridListModule,
		MatInputModule,
		MatButtonModule,
		MatTooltipModule,
		MatSelectModule,
		MatTableModule,
		MatSortModule,
		MatPaginatorModule,
		MatDividerModule,
		MatDialogModule,
		BrowserAnimationsModule
	],
})

export class MaterialsModule { }