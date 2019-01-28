import { Component, Input, Directive, Renderer2, ElementRef, ViewChild, ViewChildren, QueryList } from '@angular/core';
// import { FormGroup, FormArray, FormBuilder, Validators } from '@angular/forms';
import { FormGroup, FormControl, FormBuilder, FormArray, Validators, ValidatorFn, AbstractControl } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { Cerf } from '@core/data/cerf';
import { DataService } from '@core/data/data.service';
import { NgForm } from '@angular/forms';
import { Location } from '@angular/common';

import { MatSort, MatTableDataSource } from '@angular/material';

import { MatDialog, MatDialogRef } from '@angular/material';
import { ConfirmDialogComponent } from '@app/modules/confirm-dialog/confirm-dialog.component';
import { InfoDialog } from '@app/modules/info-dialog/info-dialog';
import { TagsDialog } from './tags-dialog.component';

import { AuthService } from '@core/authentication/auth.service';
import { Member } from '@core/authentication/member';

import { Observable, BehaviorSubject, zip } from 'rxjs';

type Attendee = {name: string, service: number, leadership: number, fellowship: number};

@Component({
	selector: 'app-cerf',
	templateUrl: './cerf.component.html',
	styleUrls: ['./cerf.component.css', './_cerf.component.scss'],
})
export class CerfComponent {

	pendingAction: boolean = false;
	fromMrf: boolean = false;

	tabs: string[] = ["main", "attendance", "fundraising", "drivers", "commentary"];
	currentTab: string;
	openedPanels: number[] = [0, 0, 0, 0, 0, 0];

	members: MatTableDataSource<Attendee>;
	attendanceColumns: string[] = ['members', 'service', 'leadership', 'fellowship'];// 'unpaid'];
	memberName: string;
	// memberService: number;
	// memberLeadership: number;
	// memberFellowship: number;

	myForm: FormGroup;
	// comment: string = "HEY";
	categoryButtons: string[] = ["service", "leadership", "fellowship", "dogs"];
	categoriesActive: string[] = [];
	addingCategory: boolean = false;

	tagOptions: string[] = ['CO', 'CA', 'CS', 'DSI', 'ISI', 'AD', 'SD', 'MD', 'FR', /* ? */ 'CK', 'KF', 'IN', 'WB', 'DV', 'DE', 'INT', 'HE'];
	tagNames: string[] = ['Community Service', 'Campus Service', 'Continuing Service', 'District Service Initiative',
							'International Service Initiative', 'Administrative', 'Social Event', 'Membership Development', 'Fundraiser',
							'Circle K', 'Kiwanis Family', 'Interclub', 'Webinar', 'Divisional', 'District', 'International', 'Club Hosted'];
	tagDescriptions: string[] = [
	"An event where your club members are serving for the community without pay",
	"Any event where your club is doing community service on your school's campus",
	"An event that has been completed with the same organization repeatedly at least once a month for a two-month duration",
	"Any event that contributes to the current District Service Initiative",
	"Any event that contributes to the current International Service Initiative",
	"Any event related to the operation of the club should be tagged as AD. Examples of administrative events include but are not limited to\
		 attending meetings (e.g. general meetings, board meetings, committee meetings, Kiwanis meetings), and workshops",
	"Any event in which club members are socially interacting with one another should be tagged as SE. A social event promotes the moral of\
		members so it is usually tagged as MD; however, remember that although all SE events are MD-tagged, not all MD events are SE-tagged (e.g. workshops)",
	"An event that promotes membership recruitment and development",
	"A home club-hosted event that raises money for a charity or for administrative funds",
	"An event in which at least two members from your Circle K club and at least two members from another Circle K club are present",
	"An event in which at least two members from your Circle K club and at least two members from another non-Circle K Kiwanis Family club are present",
	"An event in which there must be a certain amount of members from your Circle K club and the same amount of members from another\
		Circle K/Kiwanis Family club present, depending on your Circle K club's number of dues paid members. Clubs with less than or equal to\
		20 members need a minimum of two members present; clubs with 21-30 members need a minimum of three memberrs present; and clubs with greater\
		than or equal to 31 members need a minimum of four members present",
	"An online webinar usualy hosted by the District Board for the District. This tag applies to both District and International webinars",
	"An event hosted by and for the Division, which is usually hosted by the respective Lieutenant Governor (and Divisional Board)",
	"An event hosted by and for the District",
	"An event hosted by Circle K International",
	"Any event hosted through your Circle K club"];
	showTagHints = false;

	filteredRoster: Observable<{name: string, email: string}[]>;

	constructor(private route: ActivatedRoute, private dataService: DataService,
		private auth: AuthService, private _location: Location, public dialog: MatDialog,
		private builder: FormBuilder) {
		// this.route.data.subscribe(response => this.cerf = response.cerf);
		this.cerf = this.route.snapshot.data['cerf'];
		this.fromMrf = this.route.snapshot.data['mrfNav'];
		console.log("Coming from MRF ", this.fromMrf);
		this.myForm = this.createCerf(this.cerf);

		console.log(this.myForm);
	}

	//id: number;
	user: Member;
	cerf: Cerf;
	
	@ViewChild(MatSort) sort;

	get editable() {
		return (this.cerf.status == 0 && this.cerf.author_id == this.user._id) ||
		(this.cerf.status <= 1 && this.user.access.club == 2);
	}

	 ngAfterContentInit() {
		this.auth.getUser().subscribe(user => {
			this.user = user;
		});

		// this.members = new MatTableDataSource(this.cerf.data.attendees);

		let membersControl = this.attendees;	// invoke getter
		// this.members = new MatTableDataSource(new Array(membersControl.length).map((v, index) => membersControl.at(index).value as string));
		for(let control of membersControl.controls) {
			if(typeof control.value === 'string' || control.value instanceof String)
			{
				control = this.builder.group({name: control.value, service: [''], leadership: [''], fellowship: ['']});
			}
		}
		this.members = new MatTableDataSource(membersControl.getRawValue());

		this.categoriesActive = this.labels.value;

		if(!this.editable) {
			this.myForm.disable();
		}
	}

	ngAfterViewInit() {
		// if(!this.editable) {
		// 	this.myForm.disable();
		// }
		this.members.sort = this.sort;
	}

	trackByIndex(index: number, obj: any): any {
		return index;
	}

	// setColor(color: string) {
	// 	if(this.color==color) {
	// 		this.color = '';
	// 	} else {
	// 		this.color = color;
	// 	}
	// 	this.myForm.patchValue({color: this.color});
	// 	this.myForm.get('color').markAsDirty();
	// 	// console.log(this.myForm);
	// }

	openTagHelp() {
		this.showTagHints = !this.showTagHints;
		// const dialogRef = this.dialog.open(TagsDialog);
		// let descriptions = "";
		// for(let i = 0; i < this.tagDescriptions.length; i++) {
		// 	descriptions += "<p><strong>" + this.tagNames[i] + "</strong>: " + this.tagDescriptions[i] + "</p>";
		// }
		// dialogRef.componentInstance.title = "Tag Descriptions";
		// dialogRef.componentInstance.htmlContent = "<div>" + descriptions + "</div>";
	}

	isLabelActive(label: string): boolean {
		return this.categoriesActive.includes(label);
	}

	toggleLabel(label: string) {

		if(this.isLabelActive(label)) {
			this.categoriesActive.splice(this.categoriesActive.indexOf(label), 1);
			this.labels.removeAt(this.labels.value.indexOf(this.categoryButtons.indexOf(label)));
		}
		else {
			this.categoriesActive.push(label);
			this.labels.controls.push(this.builder.control(label));
		}
		// const labels = this.myForm.controls['labels'] as FormArray;
		// labels.controls.push(this.builder.control(""));
		console.log(this.myForm.get('labels'));
		this.myForm.get('labels').markAsDirty();
	}

	newLabel(label: string) {

		if(!this.categoryButtons.includes(label)) {
			this.categoryButtons.push(label);
			this.categoriesActive.push(label);
			this.labels.controls.push(this.builder.control(label));
		}
		// const labels = this.myForm.controls['labels'] as FormArray;
		// labels.controls.push(this.builder.control(""));
		// this.myForm.patch({labels: this.categoriesActive});
		console.log(this.myForm.get('labels'));
		this.myForm.get('labels').markAsDirty();
		this.addingCategory = false;
	}

	removeLabel(i: number) {

		if(this.categoriesActive.indexOf(this.categoryButtons[i]) > 0) {
			this.categoriesActive.splice(this.categoriesActive.indexOf(this.categoryButtons[i]), 1);
			this.labels.removeAt(this.labels.value.indexOf(this.categoryButtons[i]));
		}
		this.categoryButtons.splice(i, 1);

		// const labels = this.myForm.controls['labels'] as FormArray;
		// labels.removeAt(i);
		console.log(this.myForm.get('labels'));
		this.myForm.get('labels').markAsDirty();
	}

	get labels() {
		return (this.myForm.controls['labels'] as FormArray);
	}

	addRemoveTag(tag: string, isChecked: boolean)
	{
		const tagArray = this.myForm.controls.tags as FormArray;
		let index = tagArray.controls.findIndex(item => item.value == tag);

		if(isChecked && index == -1)
		{
			tagArray.push(new FormControl(tag));
		} else if(index > 0) {
			tagArray.removeAt(index);
		}
		this.myForm.get('tags').markAsDirty();
	}

	addMember() {
		// this.cerf.data.attendees = this.members.data;
		// this.cerf.data.attendees.push("Member " + this.cerf.data.attendees.length);
		// this.members.data = this.cerf.data.attendees;

		const attendees = this.attendees;
		// const hours = this.myForm.get('hoursPerAttendee').value;
		// attendees.controls.push(this.builder.group({name: [''], service: [hours.service || 0], leadership: [hours.leadership || 0], fellowship: [hours.fellowship || 0]}));
		attendees.controls.push(this.builder.group({name: [this.memberName], service: [this.memberService || 0], leadership: [this.memberLeadership || 0],
			fellowship: [this.memberFellowship || 0]}));
		console.log(attendees.getRawValue());
		// this.members = new MatTableDataSource(attendees.getRawValue());
		this.members.data.push({name: this.memberName, service: this.memberService || 0, leadership: this.memberLeadership || 0, fellowship: this.memberFellowship || 0});
		this.members._updateChangeSubscription();
		this.myForm.get('attendees').markAsDirty();
		this.filterMembers({target: {value: ""}});
	}

	removeMember(i: number) {
		const attendees = this.attendees;	// invoke the getter
		attendees.removeAt(i);


		// this.members.data = new Array(attendees.length).map((v, index) => attendees.at(index).value as string);
		// this.members = new MatTableDataSource(attendees.getRawValue());
		this.members.data.splice(i, 1);
		this.members._updateChangeSubscription();
		this.myForm.get('attendees').markAsDirty();
	}

	// Only update hours. Safer to update everything though
	syncMemberList() {
		const attendees = this.attendees;
		const hours = this.members.data;

		// for(let i=0; i < attendees.length; i++) {
		// 	attendees.at(i).patchValue({override_hours: hours[i].})
		// }
	}

	filterMembers(event: any) {
		this.filteredRoster = this.dataService.filterMembers(event.target.value);
	}

	get attendees() {
		return (this.myForm.controls['attendees'] as FormArray);
	}

	get memberService() {
		return this.myForm.get('hoursPerAttendee.service').value;
	}
	get memberLeadership() {
		return this.myForm.get('hoursPerAttendee.leadership').value;
	}
	get memberFellowship() {
		return this.myForm.get('hoursPerAttendee.fellowship').value;
	}

	saveCerf() {
		// this.cerf.data.attendees = this.members.data;
		this.dataService.updateCerf(this.getCerfFromForm()).subscribe(res => {this.myForm.markAsPristine();});
	}

	deleteCerf() {
		const dialogRef = this.dialog.open(ConfirmDialogComponent, {

		});
		dialogRef.componentInstance.confirmMessage = "Are you sure you want to delete?";
		dialogRef.afterClosed().subscribe(result => {
			if(result)
			{
				this.dataService.deleteCerf(this.cerf._id).subscribe(res => {
					if(res)
						this._location.back();
					else
						window.alert("Could not delete.");
				},
				error => console.log(error));
			}
		})
		
	}

	submitCerf() {
		this.pendingAction = true;
		this.myForm.disable();
		this.dataService.changeCerfStatus(this.cerf._id, "SUBMIT").subscribe(res => {
			if(res.result)
				this.cerf.status = 1;
			this.pendingAction = false;
			if(this.editable) {
				this.myForm.enable();
			}
		},
		error => {
			console.log(error);
			window.alert("Failed Submitting!");
			this.pendingAction = false;
			if(this.editable) {
				this.myForm.enable();
			}
		},
		() => {});
	}

	unsubmitCerf() {
		this.pendingAction = true;
		this.myForm.disable();
		this.dataService.changeCerfStatus(this.cerf._id, "UNSUBMIT").subscribe(res => {
			if(res.result)
				this.cerf.status = 0;
			this.pendingAction = false;
			if(this.editable) {
				this.myForm.enable();
			}
		},
		error => {
			console.log(error);
			window.alert("Failed Unsubmitting!");
			this.pendingAction = false;
		},
		() => {});
	}

	approveCerf() {
		this.pendingAction = true;
		this.myForm.disable();
		this.dataService.changeCerfStatus(this.cerf._id, "CONFIRM").subscribe(res => {
			if(res.result)
				this.cerf.status = 2;
			this.pendingAction = false;
			if(this.editable) {
				this.myForm.enable();
			}
		},
		error => {
			console.log(error);
			window.alert("Failed Approving!");
			this.pendingAction = false;
			this.myForm.enable();
		},
		() => {});
	}

	unapproveCerf() {
		this.pendingAction = true;
		this.myForm.disable();
		this.dataService.changeCerfStatus(this.cerf._id, "UNCONFIRM").subscribe(res => {
			if(res.result)
				this.cerf.status = 1;
			this.pendingAction = false;
			if(this.editable) {
				this.myForm.enable();
			}
		},
		error => {
			console.log(error);
			window.alert("Failed Unapproving!");
			this.pendingAction = false;
		},
		() => {});
	}


	/* Structure
	
	author_id
	chair_id
	club_id
	division_id
	name
	status
	tags: [ ]
	time: { start, end }
	labels: [ ]
	hoursPerAttendee: { service, leadership, fellowship }
	attendees: [{ _id }]
	unverifiedAttendees: [{ any_string }]
	overrideHours: [{ _id, service, leadership, fellowship }]
	color
	fundraised: { fa, kfh, ptp }

	*/

	private createCerf(model: Cerf): FormGroup {
		/* Fill in CERF with null values so we can at least create a form */
		/* We're assuming a Cerf IS passed in (i.e. has all the non-optional properties at least */
		this.fillDefaults(model);
		let copyModel = JSON.parse(JSON.stringify(model));	// Cooking the data passes by reference, so nested arrays in objects are altered
		const form = this.cookData(copyModel);
		this.setValidators(form, [
			{ control: 'name', validator: Validators.required },
			{ control: 'hoursPerAttendee', validator: Validators.pattern('^[0-9]*$')}
			]);
		for(let x of (form.controls['attendees'] as FormArray).controls) {
			x.setValidators([this.memberListValidator]);
		}
		console.log(form);

		// this.memberService = form.get('hoursPerAttendee.service').value;
		// this.memberLeadership = form.get('hoursPerAttendee.leadership').value;
		// this.memberFellowship = form.get('hoursPerAttendee.fellowship').value;

		return form;
	}

	private fillDefaults(model: Cerf): void
	{
		if(!model.labels)
			model.labels = [];
		if(!model.color)
			model.color = "";
	}

	private cookData(model: Object): FormGroup
	{
		if(model instanceof FormGroup)	// Some protection against infinite loops
			return model;
		let formGroup: { [id: string]: AbstractControl; } = {};
		Object.keys(model).forEach(key => {
			formGroup[key] = 	model[key] instanceof Date ? this.builder.control(model[key]) : // making formgroups out of single Dates doesn't make sense
			model[key] instanceof Array ? this.builder.array(this.helperCookArray(model[key])) :
			(model[key] instanceof Object ? this.cookData(model[key]) : this.builder.control(model[key]));
			// Note, Arrays are objects but objects are not arrays
		});
		return this.builder.group(formGroup);
	}

	private helperCookArray(arr: any[]): any[] {
		arr.forEach((element, index, array) => {
			if(element instanceof Object)
				array[index] = this.cookData(element);
			else
				array[index] = this.builder.control(element);
		});	// Dangerously infinite loop
		return arr;
	}

	private setValidators(form: FormGroup, validators: {control: string, validator: ValidatorFn | ValidatorFn[]}[]) {
		validators.forEach((element, index, array) => {
			form.get(element.control).setValidators(element.validator);
			/* Check that this method will add new validators to exist validators in case when passed validators will be in array.
			In other case it will override previous validators. Here is the source:
				function coerceToValidator(validator: ValidatorFn | ValidatorFn[]): ValidatorFn {
					return Array.isArray(validator) ? composeValidators(validator) : validator;
				}
				*/
			})
	}

	private memberListValidator(): ValidatorFn {
		return (control: AbstractControl): { [key:string]: any } | null => {
			return this.dataService.searchMember(control.value) ? null : {'notMember': {value: control.value}};
		};
	}

	public getCerfFromForm() {
		let rawCerf = this.myForm.getRawValue();
		// Destructure the form in case 
		// Object.keys(rawCerf).forEach(key => {
		// 	if(rawCerf instanceof AbstractControl)
		// 		rawCerf[key] = rawCerf[key].getRawValue();
		// });
		console.log(rawCerf);
		Object.assign(this.cerf, rawCerf);
		console.log(this.cerf);
		return this.cerf;

		// Object Destructuring https://stackoverflow.com/questions/17781472/how-to-get-a-subset-of-a-javascript-objects-properties
		/*let rawData = ( ({cerf_author, chair_id, chair_name, event_contact, event_number,location, total_attendees, total_drivers,
							total_mileageTo,total_mileageFrom, totale_mileage, funds_raised, funds_spent,
							funds_profit, funds_usage, status}) =>
							({cerf_author, chair_id, chair_name, event_contact, event_number,
							location, total_attendees, total_drivers, total_mileageTo,
							total_mileageFrom, totale_mileage, funds_raised, funds_spent,
							funds_profit, funds_usage, status}) ) (rawCerf);
							console.log(rawData);*/	
		// manually attach time, hours_per_attendee, attendance, tags, drivers, commentary
		// rawData['time'] = ( ({time_start: start, time_end: end}) => ( {time_start: start, time_end: end}) ) (rawCerf);
		// rawData['hour_per_attendee'] = ( ({service_hours, leadership_hours, fellowship_hours}) => ( {service_hours, leadership_hours, fellowship_hours}) ) (rawCerf);
		// rawData['attendees'] = rawCerf['attendees'];
		// rawData['tags'] = ( ({service_tags, leadership_tags, fellowship_tags, miscellaneous_tags}) => ( {service_tags, leadership_tags, fellowship_tags, miscellaneous_tags}) ) (rawCerf);
		// rawData['drivers'] = rawCerf['drivers'];
		// rawData['commentary'] = rawCerf['commentary'];
	}

	goBack() {
		if(!this.myForm.dirty) {	// No changes made. May have to add another condition to check for newly generated (unsaved)
			this._location.back();
		} // else
		const dialogRef = this.dialog.open(ConfirmDialogComponent, {

		});
		dialogRef.componentInstance.confirmMessage = "You have not saved yet. Leave?";
		dialogRef.afterClosed().subscribe(result => {
			if(result) this._location.back();
			return result;
		})
	}

	/*
	@HostListener('window:beforeunload')
	canDeactivate(): Observable<boolean> | boolean {
	
	}
	*/
}