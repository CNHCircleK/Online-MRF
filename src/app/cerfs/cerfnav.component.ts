import { Component } from '@angular/core';
import { Cerf } from '../cerf'
import { CerfDataService } from '../cerf-data.service';

@Component({
	selector: 'app-cerfnav',
	templateUrl: './cerfnav.component.html',
	styleUrls: ['./cerfnav.component.css'],
})

export class CerfnavComponent {
	importedData: Cerf[];

	constructor(private cerfDataService: CerfDataService) {

	}

	getCerfs(): void {
		this.cerfDataService.getCerfs()
			.subscribe(cerfs => this.importedData = cerfs);	// replaced "this.importedData = this.cerfDataServce.getCerfs()"
															// bc we're using Observable<Cerf[]> now
		// The old method was synchronous. We need an async way to get data
	}

	ngOnInit() {
		this.getCerfs();
	}
}