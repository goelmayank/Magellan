# Metro-City-Simulation
Visualized Simulation for Metro stations, Autos and paths.

# Current Functionality :
Up-down Cyclic non-colliding (synchronized at 800 frames) METRO system running.

Manhattan-styled (large square road network) city. Blocks added randomly where there isn't a node( junction) or a Metro station.

Autos spawned at the Start of the program where there isn't a station or a block. 

Autos stand still unless called.

People spawned, call Autos.

Shortest path calculated and stored through A* Algorithm.

Person catches Auto, takes it to nearest station.

Person waits for Metro train, boards it according to direction wished.

Person gets down at end station (nearest to his final destination) and calls another Auto.

Person goes with alotted auto to his stop, and full journey is completed.

Animated: Red line showing path of Auto to station, Red squares are Autos.

Blue lines showing Metro tracks, Blue circles are Metros-Trains.

Persons are green. They travel with the mode they are currently on.

# Logs:

Press F12. Auto id's are same as their position in array.

Persons id is the number at which they spawned, getIndex(persons, id) can be used to get the person.


