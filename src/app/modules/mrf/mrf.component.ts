import { Component } from '@angular/core';
// import { FormGroup, FormArray, FormBuilder, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { Cerf } from '@core/data/cerf';
import { Mrf } from '@core/data/mrf';
import { DataService } from '@core/data/data.service';
import { Location } from '@angular/common';

@Component({
	selector: 'app-mrf',
	templateUrl: './mrf.component.html',
	styleUrls: ['./mrf.component.css']
})

export class MrfComponent {

	constructor(private route: ActivatedRoute, private dataService: DataService,
				private _location: Location) {
	}

	//id: number;
	data: Mrf;
	cerfs: Cerf[] = [];
	ngOnInit() {
		let id = this.route.snapshot.params.id;
		this.dataService.getMrf(id).subscribe(mrf => this.data = mrf);

		for(let i=0; i < this.data.events.length; i++)
			this.dataService.getCerf(this.data.events[i])
				.subscribe(cerf => this.cerfs[i] = (cerf));
				// TODO: What if CERF id not found?
	}


	goBack() {
		this._location.back();
	}

	// addForm: FormGroup;

	// constructor(private formBuilder: FormBuilder) {

	// }

	// ngOnInit() {

	// 	this.addForm = this.formBuilder.group({

	// 	})
	// }
}