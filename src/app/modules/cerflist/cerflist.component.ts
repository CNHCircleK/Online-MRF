import { Component, ViewChild, Input } from '@angular/core';
import { Router } from '@angular/router';

import { MatPaginator, MatSort, MatTableDataSource } from '@angular/material';

import { DataService } from '@core/data/data.service';
import { Cerf } from '@core/data/cerf';

@Component({
	selector: 'app-cerflist',
	templateUrl: './cerflist.component.html',
	styleUrls: ['./cerflist.component.css', './cerflist_theme.scss'],
})

export class CerfListComponent {
	data: Cerf[];
	displayedColumns = ["name", "chair_id", "time.start", "action"];	// Add "status" to display notification of status
	list: MatTableDataSource<Cerf>;

	@ViewChild(MatPaginator) paginator: MatPaginator;
  	@ViewChild(MatSort) sort: MatSort;

  	@Input() mrfId: number;	// Change some logic if viewing through an MRF

	constructor(private dataService: DataService, private router: Router) {
		// this.getCerfs();
	}

	getCerfs(): void {
		this.dataService.getCerfs()
		.subscribe(cerfs => this.data = cerfs,
			error => console.log("Error: ", error),
			() => console.log("Success Cerf", this.data));	// replaced "this.data = this.cerfDataServce.getCerfs()"
															// bc we're using Observable<Cerf[]> now
		// The old method was synchronous. We need an async way to get data
	}

	ngOnInit() {
		if(this.mrfId) {
			this.data = this.dataService.getCerfsFromMrf(this.mrfId);
			this.displayedColumns.push('status');
		} else {
			this.getCerfs();	// TODO: this subscription fetches 'undefined,' temporary fix is to instantiate the service class
							// in app.module so the constructor is called (and data is fetched) before this component is loaded
							// This works if the user DOESN'T directly try to land on /cerfs route (since it won't be pre-loaded)
		}
		// Maybe a router resolver?

		this.list = new MatTableDataSource(this.data);
		this.list.sortingDataAccessor = (item, property) => {	// Need to specify sorting by deep property or else it'll try to sort cerf[time.start]
			switch(property) {
				case 'time.start': return item.time.start;
				default: return item[property];
			}
		};
	}

	ngAfterViewInit() {
		this.list.paginator = this.paginator;
		this.list.sort = this.sort;
	}

	applyFilter(filterValue: string) {
	    filterValue = filterValue.trim(); // Remove whitespace
	    filterValue = filterValue.toLowerCase(); // list defaults to lowercase matches
	    this.list.filter = filterValue;
	}

	newCerf() {
		let id = this.dataService.newCerf();
		if(this.mrfId)
			this.dataService.addCerf(id, this.mrfId);
		this.router.navigate(['/cerf', id]);
	}
	removeCerfFromMrf(id: number) {
		this.dataService.removeCerf(this.mrfId, id);
	}
}