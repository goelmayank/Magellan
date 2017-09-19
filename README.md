# Magellan

### A data viz tool for viewing first-/last-mile solutions

The tool will serve two purposes:

* To simulate how a given allocation of resources will be used over time, having made initial assumptions, **and**
* To view actual resource usage over a "real" demonstration

The components of the tool will be designed keeping the above two goals in mind.

## How will it work?

### Information Storage

We define our **event** as anything that can happen during the time the Auto is in service. 
This includes, but is not restricted to, the following:

* Auto starts logging time at the Base.
* Passenger makes a request for a journey.
* Passenger is matched to a particular Auto.
* Auto begins to move towards a Passenger, destination, or back to Base.
* Passenger starts waiting for the Auto to arrive.
* Passenger is picked up by the Auto. 
* Auto/Passenger location is updated.
* Passenger is dropped off by Auto.
* Auto finishes logging time.

The information will be stored in a [Firebase](https://firebase.google.com/) database.  

*The exact format of the database is currently undecided.*
`By format, I mean what are the various fields to be stored for each entry made in the database.`

Obviously, we should have something for:  

	* Time of entry,
	* Which Auto 
	* Which Passenger(s)
	* Location
  
But each of these data points need to be stored in a manner that can be generated when simulating, and by the app during an actual demo.  
`How much information do we need in each event? Is it feasible to produce the amount of info needed per event?`  

**End Result**: We now have a Firebase database that has recorded all the events that occurred during the course of one run. Once this database has been created, we can obtain additional summary statistics for the visualization.

### Generating the visualization

Once a database has been created, the tool will access it to obtain the required information. Certain queries will need to be run on the database to obtain the data/summary statistics, but the tool will proceed as follows:

* The summary statistics can (possibly) be used to create infographics like [the ones here](https://www.washingtonpost.com/graphics/2017/national/escape-time/?utm_term=.ec0cd2d2cd9f):

	![Image from the Washington Post Article](magellan_p1.png)

	
* The animations can be generated in two ways:
	* **Each entry in the database is a 'frame' of the 'video'**: After processing the initial assumptions, The tool merely converts each record in the database into a visual form. This is straightforward, but might produce long/laggy animations.
	* **Process the database to obtain each Auto's information and then run queries in simultaneous context**: The tool processes the initial assumptions, and creates threads to simulate the actions of each Auto. These threads then query the database simultaneously and obtain their information either all at once (high memory usage) or in an event-by-event manner (possibly slower animations, but *way* less memory use).

### 'God Mode' vs. 'Reality Mode'

Since the tool produces visualizations based on the input database, we **need not** focus on the differences between the two modes; we can have a separate script that produces the database corresponding to a 'God Mode', which we can then load into the tool. 

```
Later versions of the tool can have the options: 
	'Use Real Data' which will simply load a particular database for animations; and 
	'Generate Data', which will ask for parameters, create the database (high memory/internet usage),
	 and then load the same database for animations.
```


### Simulating Data

The text-based simulation that is currently available uses a multi-threading context to simulate the actions of each Auto.

`Insert any ideas about how to better the simulation here. Not "I want the simulation to do this", but "Here's how the simulation can do this".`

### Real-Time Information

`We need to figure what fields each record of the database will contain.`

### Software Requirements

`Might require cash for stuff from Google. Example: GPU-based rendering of the map might be a fun thing to do later.`

### Additional Plans

* Shared rides - Autos should be able to take multiple Passengers
* Implement Hai Wang's allocation algorithm to account for shared rides.