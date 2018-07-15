export interface Cerf {
	_id: number,
	name: string,
	chair_id: string,
	time: {
		start: string, // Date
		end: string
	},
	location: string,
	attendees: string[],
	hours_per_attendee: {
		service: number,
		leadership: number,
		fellowship: number
	}
	override_hours: number[],
	tags: string[], // Tag object?
	fundraised: number,
	status: number	// Enums
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
		"_id" : ObjectId("5b3f1157adf45d36e65bf5d1"),
    "name" : "Test Event",
    "chair_id" : "5b3efbf307f2a3084adc2426",
    "time" : {
        "start" : ISODate("2018-04-01T07:00:00Z"),
        "end" : ISODate("2018-04-02T07:00:00Z")
    },
    "location" : "Some Place",
    "attendees" : [ ],
    "hours_per_attendee" : {
        "service" : 3,
        "leadership" : 2,
        "fellowship" : 3
    },
    "override_hours" : [ ],
    "tags" : [ ],
    "fundraised" : 0,
    "status" : 0


*/