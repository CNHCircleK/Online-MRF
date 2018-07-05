import { Component } from '@angular/core';
import { fadeAnimation } from './fade.animation';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
  animations: [fadeAnimation]
})
export class AppComponent {
  title = 'app';

  // getRouterOutletState(outlet) {
  // 	return outlet.isActivated ? outlet.activatedRoute : '';
  // }
}