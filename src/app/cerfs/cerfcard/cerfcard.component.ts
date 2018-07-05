import { Component, Input } from '@angular/core';
import { ViewEncapsulation } from '@angular/core';

@Component({
	selector: 'app-cerfcard',
	templateUrl: './cerfcard.component.html',
	styleUrls: ['./cerfcard.component.css']
})

export class CerfcardComponent {

	@Input() data;
}