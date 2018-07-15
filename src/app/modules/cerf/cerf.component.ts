import { Component, Input, Directive, Renderer2, ElementRef, ViewChild } from '@angular/core';
// import { FormGroup, FormArray, FormBuilder, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { Cerf } from '@core/data/cerf';
import { DataService } from '@core/data/data.service';
import { NgForm } from '@angular/forms';
import { Location } from '@angular/common';

import { MatSort, MatTableDataSource } from '@angular/material';

import { MatDialog, MatDialogRef } from '@angular/material';
import { ConfirmDialogComponent } from '@app/modules/confirm-dialog/confirm-dialog.component';


// @Directive({
// 	selector: 'input'
// })
// export class MemberInput {
// 	constructor(public renderer: Renderer2, public elementRef: ElementRef) {}

// 	ngOnInit() {
// 		this.renderer.selectRootElement('#');
// 	}
// }


@Component({
	selector: 'app-cerf',
	templateUrl: './cerf.component.html',
	styleUrls: ['./cerf.component.css'],
})

export class CerfComponent {
	@Input() mrfView: boolean = false;

	constructor(private route: ActivatedRoute, private dataService: DataService,
		private _location: Location, public dialog: MatDialog) {
	}

	//id: number;
	data: Cerf;
	members: MatTableDataSource<string>;
	displayedColumns = ['members'];
	@ViewChild(MatSort) sort;
	ngOnInit() {
		let id = this.route.snapshot.params.id;
		this.dataService.getCerf(id).subscribe(cerf => this.data = cerf);

		this.members = new MatTableDataSource(this.data.attendees);
	}
	ngAfterViewInit() {
		this.members.sort = this.sort;
	}


	ngOnDestroy() {
		this.saveCerf();
	}
	saveCerf() {
		this.data.attendees = this.members.data;
		this.dataService.updateCerf(this.data);
	}

	goBack() {
		this._location.back();
	}


	trackByIndex(index: number, obj: any): any {
		return index;
	}

	addMember() {
		this.data.attendees = this.members.data;
		this.data.attendees.push("Member " + this.data.attendees.length);
		this.members.data = this.data.attendees;
	}

	removeMember(i: number) {
		this.data.attendees.splice(i, 1);
	}

	deleteCerf() {
		const dialogRef = this.dialog.open(ConfirmDialogComponent, {

		});
		dialogRef.componentInstance.confirmMessage = "Are you sure you want to delete?";
		dialogRef.afterClosed().subscribe(result => {
			if(result)
			{
				this.dataService.deleteCerf(this.data._id);
				this._location.back();
			}
		})
		
	}

	generateExcel() {
		// const items: any[] = [this.data];
		// const replacer = (key, value) => value === null ? '' : value // specify how you want to handle null values here
		// const header = Object.keys(items[0])
		// let csv = items.map(row => header.map(fieldName => JSON.stringify(row[fieldName], replacer)).join(','))
		// csv.unshift(header.join(','))
		// let csvString = csv.join('\r\n')
		// let fields = ['_id', 'chair_id', 'time.start', 'time.end', 'location', 'attendees', 'hours_per_attendee.service',
		// 				'hours_per_attendee.leadership', 'hours_per_attendee.fellowship', 'override_hours', 'tags', 'fundraised', 'status'];
		// console.log(json2csv({ data: this.data, fields: fields }));
	}

	submitCerf() {
		this.dataService.submitCerf(this.data._id);

	}

	approveCerf() {
		this.data.status = 0;
	}
}