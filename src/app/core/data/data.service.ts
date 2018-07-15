import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { Cerf } from './cerf';
import { Mrf } from './mrf';
import { LocalStorage } from '@ngx-pwa/local-storage';
// import { MrfDataService } from './mrf-data.service';

@Injectable()
export class DataService {

	constructor(protected localStorage: LocalStorage) {
		this.loadCerfs();
		this.loadMrfs();
	}

	/* CERF handling */
	cerfData: Cerf[];
	nextCerfId: number;

	loadCerfs(): void {
		this.localStorage.getItem('cerfs').subscribe((cerfs) => {
			if(!cerfs) {	// First time loading
				this.nextCerfId = 1;
				this.cerfData = [];
				this.newCerf();
			} else {		// Data exists in client-DB
				this.cerfData = cerfs;
				// console.log("Service ", this.cerfData)
				this.nextCerfId = this.cerfData[this.cerfData.length-1]._id + 1;
			}
		});
	}

	// CREATE
	newCerf(): number {
		let blankCerf =  {"_id" : this.nextCerfId,"name" : "New Event","chair_id" : "User","time" : {"start" : "2018-00-00T00Z:00:00Z","end" : ""},
						"location" : "","attendees" : [ ],"hours_per_attendee" : {"service" : 0,"leadership" : 0,"fellowship" : 0},
						"override_hours" : [ ],"tags" : [ ],"fundraised" : 0,"status" : 1};
		this.cerfData.push(blankCerf);
		this.nextCerfId++;
		return blankCerf._id;
	}

	// READ
	getCerfs(): Observable<Cerf[]> {
		return of(this.cerfData);
	}

	getCerf(id: number): Observable<Cerf> {
		return of(this.cerfData.find(cerf => cerf._id == id));
	}

	// UPDATE
	updateCerf(data: Cerf) {
	  	let ind = this.cerfData.findIndex(cerf => cerf._id == data._id);	// can probably store index in the CERF cerfData for easy access
	  	this.cerfData[ind] = data;
	  	// this.localStorage.setItem('cerfs' + cerfData._id, this.cerfData[ind]).subscribe(() => {});
	  	this.localStorage.setItem('cerfs', this.cerfData).subscribe(()=>{});
	  		// I would like to only have to update a specific CERF, but if we store by ID,
	  			// where do we get the list of IDs to retrieve. Another field called 'ids' duh
	}
	submitCerf(id: number) {
	  	let ind = this.cerfData.findIndex(cerf => cerf._id == id);
	  	if(ind != -1)
	  	{
	  		this.addCerf(id, 1);	// TODO: submit to a pool instead of the MRF with id 1 perpetually?
	  	}
	}

  	// DELETE
  	deleteCerf(id: number) {
  		let ind = this.cerfData.findIndex(cerf => cerf._id == id);
  		this.cerfData.splice(ind, 1);

    	this.removeCerfAll(id);	// Propagate changes to MRFs. This will be done through MongoDB eventually
    }







    /* MRF handling */
    mrfData: Mrf[];

    loadMrfs(): void {
    	this.localStorage.getItem('mrfs').subscribe((mrfs) => {
    		if(!mrfs) {
    			this.mrfData = this.mockData;
    		} else {
    			this.mrfData = mrfs;
    		}
    	});
    }
    mockData: Mrf[] = [
  		{"_id": 1,"year": 2018,"month": 7,"status": 0,"events": [],"submission_time": "2018-03-01T07:00:00Z"},
		{"_id": 2,"year": 2018,"month": 2,"status": 0,"events": [],"submission_time": "2018-04-01T07:00:00Z"},
		{"_id": 3,"year": 2018,"month": 3,"status": 0,"events": [],"submission_time": "2018-05-01T07:00:00Z"},
		{"_id": 4,"year": 2018,"month": 4,"status": 0,"events": [],"submission_time": "2018-06-01T07:00:00Z"},
		{"_id": 5,"year": 2018,"month": 5,"status": 0,"events": [],"submission_time": "2018-07-01T07:00:00Z"},
		{"_id": 6,"year": 2018,"month": 6,"status": 0,"events": [],"submission_time": null}
	];

	// CREATE
		// A new CERF will be provided by the database when ready

  	// READ
  	getMrfs(): Observable<Mrf[]> {
  		return of(this.mrfData);
  	}
  	getMrf(id: number): Observable<Mrf> {
  		return of(this.mrfData.find(mrf => mrf._id == id));
  	}

  	// UPDATE
  	addCerf(cerfId: number, mrfId: number) {
  		let ind = this.mrfData.findIndex(mrf => mrf._id == mrfId);
  		if(ind != -1) {
  			if(!this.mrfData[ind].events.find(event_id => event_id == cerfId))	// If it's not part of that MRF already
      		this.mrfData[ind].events.push(cerfId);
  		}
    	
  	}
  	removeCerfAll(id: number) {	// Remove CERF from every MRF
  		this.mrfData.forEach(mrf => {
  			let ind = mrf.events.findIndex(event_id => event_id == id)
  			if(ind != -1)
  				mrf.events.splice(ind, 1);
  		});
  	}
  	removeCerf(cerfId: number, mrfId: number) {
  		let mrf: Mrf = this.mrfData.find(mrf => mrf._id == mrfId);
  		if(mrf) {
  			let ind = mrf.events.findIndex(event_id => event_id == cerfId)
  			if(ind != -1)
  				mrf.events.splice(ind, 1);
  		}
  	}
  	saveToClient() {
    	this.localStorage.setItem('mrfs', this.mrfData).subscribe(() => {});  // Only called when mrfnav component is loaded, for testing purposes
  	}





  	getCerfsFromMrf(mrfId: number) {
  		let mrf: Mrf = this.mrfData.find(mrf => mrf._id == mrfId);
  		let cerfs: Cerf[] = [];
  		if(mrf) {
  			mrf.events.forEach(id => {
  				this.getCerf(id).subscribe(cerf => { if(cerf) cerfs.push(cerf) });
  			});
  		}
  		return cerfs;
  	}
}