import { Cerf } from './cerf';

export interface Mrf {
	_id: number,
	year: number,
	month: number,
	status: 0,	// Enum?
	events: number[],	// Cerf[] or number[] (id)
	submission_time: string,
}

/*
TODO:
-> localstorage persistant data when jumping between files (saving data locally shouldn't be too much of a risk)
	-> fetching from localdata and repeatedly fetching from database (requests, diff conflicts)?
-> expand form
	-> elastic "Member attendance" section
	-> look at example cerf
	-> tooltip help (question mark next to certain input fields)
-> make MRF support
-> excel integration (load/export)
-> navigation animation?


-> How much data to load? We could load it all (not that much data vs multiple requests), or just load basic info to display then when they click on a card, it calls on the endpoint
		{
			"id": 0,
			"date": "01-01-18",
			"dataURL": "https://some.rest.api.endpoint"
		},
  		
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

*/