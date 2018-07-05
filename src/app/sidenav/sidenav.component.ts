import {Component, Input} from '@angular/core'
// import {FormControl} from '@angular/forms'

@Component({
	selector: 'app-sidenav',
	templateUrl: './sidenav.component.html',
	styleUrls: ['./sidenav.component.css']//'./_sidenav.component.scss']
})

export class SidenavComponent {
	isExpanded=false;
	links = [
			{icon: 'person', text: 'Profile', route: '/'},
			{icon: 'assessment', text:'CERFs', route: '/cerfs'},
			{icon: 'table_cell', text:'Current MRF'},
			{icon: 'library_books', text: 'Past MRFs'},
			{icon: 'cloud_download', text: 'Submitted MRFs'}
		];

	@Input() level: number = 1;

	/* constructor() won't work, wait until data-bound properties have been initialized */
	ngOnInit() {
		this.links = this.links.slice(0, this.level);
	}
}