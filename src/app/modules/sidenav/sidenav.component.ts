import {Component, Input} from '@angular/core'
// import {FormControl} from '@angular/forms'
import { AuthService } from '@core/authentication/auth.service';

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
			{icon: 'table_cell', text:'MRFs', route: '/mrfs', color: '#9EA374'},
			// {icon: 'library_books', text: 'Past MRFs'},
			{icon: 'library_books', text: 'Division MRFs'},
			{icon: 'library_books', text: 'District MRFs'},
		];
	authLinks = [];

	// @Input() level: number = 1;

	constructor(private auth: AuthService) {

	 }

	ngOnInit() {
		this.refreshView();
	}

	refreshView() {
		this.auth.getUser().subscribe(user => {
			this.authLinks = [];
			if(user)
			{
				let access = user.access;
				this.authLinks.push(this.links[0]);
				this.authLinks.push(this.links[1]);
				if(access.club > 0)
				{
					this.authLinks.push(this.links[2]);
				}
				if(access.division == 1)
				{
					this.authLinks.push(this.links[3]);
				}
				if(access.district == 1)
				{
					this.authLinks.push(this.links[4]);
				}
			}
		});
	}
}