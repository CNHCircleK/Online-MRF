import { Component, ViewChild, Input } from '@angular/core';
import { Router } from '@angular/router';
import { Mrf } from '@core/data/mrf';
import { DataService } from '@core/data/data.service';

import { MatPaginator, MatSort, MatTableDataSource } from '@angular/material';

@Component({
	selector: 'app-mrflist',
	templateUrl: './mrflist.component.html',
	styleUrls: ['./mrflist.component.css'],
})

export class MrfListComponent {
	data: Mrf[];
	displayedColumns = ['month', 'year', 'action'];
	list: MatTableDataSource<Mrf>;

	@ViewChild(MatPaginator) paginator;
	@ViewChild(MatSort) sort;

	constructor(private dataService: DataService, private router: Router) {

	}

	getMrfs(): void {
		this.dataService.getMrfs()
			.subscribe(mrfs => this.data = mrfs);	// replaced "this.importedData = this.cerfDataServce.getCerfs()"
															// bc we're using Observable<Cerf[]> now
		// The old method was synchronous. We need an async way to get data

		this.list = new MatTableDataSource(this.data);
	}

	ngOnInit() {
		this.getMrfs();
		this.dataService.saveToClient();
	}

	ngAfterViewInit() {
		this.list.paginator = this.paginator;
		this.list.sort = this.sort;
	}

	applyFilter(filterValue: string) { 
		filterValue = filterValue.trim();
		filterValue = filterValue.toLowerCase();
		this.list.filter = filterValue;
	}
}