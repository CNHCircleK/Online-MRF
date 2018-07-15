import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { Mrf } from '@core/data/mrf';
import { LocalStorage } from '@ngx-pwa/local-storage';

@Injectable({
  providedIn: 'root'
})
export class MrfDataService {

  constructor(protected localStorage: LocalStorage) {
    
  }

  getMrfs(): Observable<Mrf[]> {
  	return of(this.data);
  }

  getMrf(id: number): Observable<Mrf> {
  	return of(this.data.find(x => x._id == id));
  }

  submitCerf(id: number) {
    if(!this.data[0].events.find(event_id => event_id == id))
      this.data[0].events.push(id);
  }

  updateCerfRemoved(id: number) {  
    this.data.forEach(x => {
      let ind = x.events.findIndex(event_id => event_id == id)
      if(ind != -1)
        x.events.splice(ind, 1);
    })
  }

  saveToClient() {
    this.localStorage.setItem('mrfs', this.data).subscribe(() => {});  // Only called when mrfnav component is loaded, for testing purposes
  }

  data: Mrf[];

  mockData: Mrf[] = [
  		/*
		{
			"id": 0,
			"date": "01-01-18",
			"dataURL": "https://some.rest.api.endpoint"
		},
  		*/
  		{
  			"_id": 1,
  			"year": 2018,
  			"month": 7,
  			"status": 0,
  			"events": [],
  			"submission_time": "2018-03-01T07:00:00Z"
  		},
		{
  			"_id": 2,
  			"year": 2018,
  			"month": 2,
  			"status": 0,
  			"events": [],
  			"submission_time": "2018-04-01T07:00:00Z"
  		},
  		{
  			"_id": 3,
  			"year": 2018,
  			"month": 3,
  			"status": 0,
  			"events": [],
  			"submission_time": "2018-05-01T07:00:00Z"
  		},
  		{
  			"_id": 4,
  			"year": 2018,
  			"month": 4,
  			"status": 0,
  			"events": [],
  			"submission_time": "2018-06-01T07:00:00Z"
  		},
  		{
  			"_id": 5,
  			"year": 2018,
  			"month": 5,
  			"status": 0,
  			"events": [],
  			"submission_time": "2018-07-01T07:00:00Z"
  		},
  		{
  			"_id": 6,
  			"year": 2018,
  			"month": 6,
  			"status": 0,
  			"events": [],
  			"submission_time": null
  		}
	];
}
