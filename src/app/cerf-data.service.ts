import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { Cerf } from '@core/data/cerf';
import { LocalStorage } from '@ngx-pwa/local-storage';
import { MrfDataService } from './mrf-data.service';

@Injectable(
	{  providedIn: 'root'}  // TODO: Make separate module instead of using the global root?
	)
export class CerfDataService {

	data: Cerf[];

	constructor(protected localStorage: LocalStorage, private mrfDataService: MrfDataService) {
		this.localStorage.getItem('cerfs').subscribe((cerfs) => {
			if(!cerfs)
			{
				this.nextId = 1;
        this.data = [];
        this.newCerf();
			} else {
				this.data = cerfs;
				// console.log("Service ", this.data)
				this.nextId = this.data[this.data.length-1]._id + 1;
			}
		});

	}

	getCerfs(): Observable<Cerf[]> {
		return of(this.data);
	}

	getCerf(id: number): Observable<Cerf> {
		return of(this.data.find(x => x._id == id));
	}

	setCerf(data: Cerf) {
  	let ind = this.data.findIndex(x => x._id == data._id);	// can probably store index in the CERF data for easy access
  	this.data[ind] = data;
  	// this.localStorage.setItem('cerfs' + data._id, this.data[ind]).subscribe(() => {});
  	this.localStorage.setItem('cerfs', this.data).subscribe(()=>{});
  		// I would like to only have to update a specific CERF, but if we store by ID,
  			// where do we get the list of IDs to retrieve. Another field called 'ids' duh
  }


  		nextId: number;
  // Returns ID
  newCerf(): number {
  	let temp =  {
      "_id" : this.nextId,
      "name" : "New Event",
        "chair_id" : "User",  // Use log-in username
        "time" : {
          "start" : "2018-00-00T00Z:00:00Z",
          "end" : ""
        },
        "location" : "",
        "attendees" : [ ],
        "hours_per_attendee" : {
          "service" : 0,
          "leadership" : 0,
          "fellowship" : 0
        },
        "override_hours" : [ ],
        "tags" : [ ],
        "fundraised" : 0,
        "status" : 1
    };
		this.data.push(temp);
		this.nextId++;
		return temp._id;
	}

	deleteCerf(id: number) {
		let ind = this.data.findIndex(x => x._id == id);
		this.data.splice(ind, 1);

    this.mrfDataService.updateCerfRemoved(id);
	}

  submitCerf(id: number) {
    let ind = this.data.findIndex(x => x._id == id);
    if(ind != -1)
    {
      this.mrfDataService.submitCerf(id);
    }
  }

	dataLocal: Cerf[] = [
	{
  			"_id" : 1111,	// Thinking UID concatenated by division, club, month, etc.
  			"name" : "Banquet",
  			"chair_id" : "Chris",
  			"time" : {
  				"start" : "2018-04-01T07:00:00Z",
  				"end" : "2018-04-02T07:00:00Z"
  			},
  			"location" : "Some Place",
  			"attendees" : [ "Chris", "name", "name2" ],
  			"hours_per_attendee" : {
  				"service" : 3,
  				"leadership" : 2,
  				"fellowship" : 3
  			},
		    "override_hours" : [ ],	// How to override hours without specifying everyones?
		    "tags" : [ "CO" ],
		    "fundraised" : 0,
		    "status" : 0
		},
		{
  			"_id" : 1112,	// Thinking UID concatenated by division, club, month, etc.
  			"name" : "Beach Cleanup",
  			"chair_id" : "Alvin",
  			"time" : {
  				"start" : "2018-04-01T07:00:00Z",
  				"end" : "2018-04-02T07:00:00Z"
  			},
  			"location" : "Some Place",
  			"attendees" : [ "Alvin", "john", "smith" ],
  			"hours_per_attendee" : {
  				"service" : 3,
  				"leadership" : 2,
  				"fellowship" : 3
  			},
		    "override_hours" : [ ],	// How to override hours without specifying everyones?
		    "tags" : [ "CO" ],
		    "fundraised" : 0,
		    "status" : 0
		},
		{
  			"_id" : 1113,	// Thinking UID concatenated by division, club, month, etc.
  			"name" : "Pancake Breakfast",
  			"chair_id" : "Kevin",
  			"time" : {
  				"start" : "2018-04-01T07:00:00Z",
  				"end" : "2018-04-02T07:00:00Z"
  			},
  			"location" : "Some Place",
  			"attendees" : [ "Chris", "Jonathan", "Sandy" ],
  			"hours_per_attendee" : {
  				"service" : 3,
  				"leadership" : 2,
  				"fellowship" : 3
  			},
		    "override_hours" : [ ],	// How to override hours without specifying everyones?
		    "tags" : [ "CO" ],
		    "fundraised" : 0,
		    "status" : 0
		},
		{
  			"_id" : 1114,	// Thinking UID concatenated by division, club, month, etc.
  			"name" : "Ice Cream Social",
  			"chair_id" : "Sandy",
  			"time" : {
  				"start" : "2018-04-01T07:00:00Z",
  				"end" : "2018-04-02T07:00:00Z"
  			},
  			"location" : "Some Place",
  			"attendees" : [ "Chris", "another", "someone" ],
  			"hours_per_attendee" : {
  				"service" : 3,
  				"leadership" : 2,
  				"fellowship" : 3
  			},
		    "override_hours" : [ ],	// How to override hours without specifying everyones?
		    "tags" : [ "CO" ],
		    "fundraised" : 0,
		    "status" : 0
		},
		{
  			"_id" : 1110,	// Thinking UID concatenated by division, club, month, etc.
  			"name" : "Cat Cafe",
  			"chair_id" : "Will",
  			"time" : {
  				"start" : "2018-04-01T07:00:00Z",
  				"end" : "2018-04-02T07:00:00Z"
  			},
  			"location" : "Some Place",
  			"attendees" : [ "Will", "Will 2", "Will 3" ],
  			"hours_per_attendee" : {
  				"service" : 3,
  				"leadership" : 2,
  				"fellowship" : 3
  			},
		    "override_hours" : [ ],	// How to override hours without specifying everyones?
		    "tags" : [ "CO" ],
		    "fundraised" : 0,
		    "status" : 0
		},
		{
  			"_id" : 1115,	// Thinking UID concatenated by division, club, month, etc.
  			"name" : "Elections",
  			"chair_id" : "Noone",
  			"time" : {
  				"start" : "2018-04-01T07:00:00Z",
  				"end" : "2018-04-02T07:00:00Z"
  			},
  			"location" : "Some Place",
  			"attendees" : [ "Jonathan"],
  			"hours_per_attendee" : {
  				"service" : 3,
  				"leadership" : 2,
  				"fellowship" : 3
  			},
		    "override_hours" : [ ],	// How to override hours without specifying everyones?
		    "tags" : [ "CO" ],
		    "fundraised" : 0,
		    "status" : 0
		}
		];
	}
