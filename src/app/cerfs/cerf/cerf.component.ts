import { Component } from '@angular/core';
// import { FormGroup, FormArray, FormBuilder, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { Cerf } from '../../cerf';
import { CerfDataService } from '../../cerf-data.service';

@Component({
	selector: 'app-cerf',
	templateUrl: './cerf.component.html',
	styleUrls: ['./cerf.component.css']
})

export class CerfComponent {

	constructor(private route: ActivatedRoute, private cerfDataService: CerfDataService) {
	}

	id: number;
	data: Cerf;
	ngOnInit() {
		this.id = this.route.snapshot.params.id;
		this.cerfDataService.getCerf(this.id).subscribe(cerf => this.data = cerf);
	}


	// addForm: FormGroup;

	// constructor(private formBuilder: FormBuilder) {

	// }

	// ngOnInit() {

	// 	this.addForm = this.formBuilder.group({

	// 	})
	// }
}