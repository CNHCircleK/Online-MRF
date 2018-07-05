import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { Cerf } from './cerf'

@Injectable({
  providedIn: 'root'
})
export class CerfDataService {

  constructor() { }

  getCerfs(): Observable<Cerf[]> {
  	return of(this.data);
  }

  getCerf(id: number): Observable<Cerf> {
  	return of(this.data.find(x => x.id == id));
  }

  data: Cerf[] = [
		{
			"id": 1,
			"date": "07-01-18",
			"data": { 
				"eventName": "",
				"author": "John",
				"membersAttended": null,
				"hours": 6
			}
		},
		{
			"id": 2,
			"date": "07-02-18",
			"data": { 
				"eventName": "Benefit Concert",
				"author": "Kevin",
				"membersAttended": 500,
				"hours": 10
			}
		},
		{
			"id": 3,
			"date": "06-30-18",
			"data": { 
				"eventName": "Banquet",
				"author": "William",
				"membersAttended": 60,
				"hours": 5
			}
		},
		{
			"id": 4,
			"date": "06-30-18",
			"data": { 
				"eventName": "",
				"author": "Chris",
				"membersAttended": 0,
				"hours": 2
			}
		},
		{
			"id": 5,
			"date": "07-03-18",
			"data": {
				"eventName": "Committee Meeting",
				"author": "Jonathan",
				"membersAttended": 0,
				"hours": 0
			}
		}
	];
}
