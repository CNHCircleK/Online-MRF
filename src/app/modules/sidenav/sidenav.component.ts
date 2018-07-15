import {Component, Input} from '@angular/core'
// import {FormControl} from '@angular/forms'

@Component({
	selector: 'app-sidenav',
	templateUrl: './sidenav.component.html',
	styleUrls: ['./sidenav.component.css', './sidenav.component.scss']
})

export class SidenavComponent {
	isExpanded=false;
	links = [
			{icon: 'person', text: 'Profile', route: '/', color: '#F2E18B'},
			{icon: 'assessment', text:'CERFs', route: '/cerfs', color: '#C7D6EE'},
			{icon: 'table_cell', text:'MRFs', route: '/mrfs', color: '#9EA374'}//,
			// {icon: 'library_books', text: 'Past MRFs'},
			// {icon: 'cloud_download', text: 'Submitted MRFs'}
		];

	@Input() level: number = 1;

	/* constructor() won't work, wait until data-bound properties have been initialized */
	ngOnInit() {
		this.links = this.links.slice(0, this.level);
	}
}