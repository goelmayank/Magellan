'use strict';

var g;
var metroStations;
var metros = [];
var autos = [];
var persons = [];
var s = 5;
var stationLocations = [ [38,1], [31,4], [27,9], [22,13], [19,18], [15,21], [11,26], [10,31], [15,35], [25,38]]; 
var rate = 5;

function setup(){
	createCanvas(1100, 1000);
	g = new graph();
	g.addEdges();
	

	metroStations = new metroStations();
	rectMode(CENTER);

	for(var i = 0 ; i < 200 ; i++){					// add road-blocks where there aren't stations.
		var x = floor(random(2,49))
		var y = floor(random(2,49))
		
		if(!metroStations.hasLocation(x,y) )
			g.addBlock(x,y);
	}

	metros.push(new metroTrain(0,true));
	for(var i = 1 ; i < metroStations.stations.length-1 ; i++){		// add a up and down metroTrain at each station. 
		metros.push(new metroTrain(i,true));
		metros.push(new metroTrain(i,false));
	}
	metros.push(new metroTrain(metroStations.stations.length-1,false));


	var count =0; 
	for(var i = 0 ; i < 250 ; i++){
		
		var x = floor(random(2,49))
		var y = floor(random(2,49))
		
		if(!g.hasBlock(x,y) && !metroStations.hasLocation(x,y))		//Spawn Autos at random positions, where there isn't a block or a station.
			{ autos.push(new Auto(x,y, count ));
				
			
		
		//var z = autos[count].chooseDestStation();					// Choose and go to nearest station (elementary functionality) through shortest path.
		//autos[count].setDestination(metroStations.stations[z].i , metroStations.stations[z].j);
		count++;
		}	
	}


	// 3 known initial people.
	persons.push(new person(14,14,38,38,0));
	persons.push(new person(2 , 2, 2,35,1));
	persons.push(new person(15,26,48, 1,2));
	
	//insert n people randomly.
	
	for (var i = 0; i < autos.length-100; i++) {
		pushperson();
	}


	for (var i = 0; i < persons.length; i++) {
		persons[i].callAuto1();
	}
	
	var t = createP("+/- keys for rate; UP for pause/resume, RIGHT for next frame");
  	t.position(width, 20);

  	var t2 = createP("Number of autos: " + autos.length);
  	t2.position(width,100);


	setInterval(checkAuto, 2000);
}

var loops= true;

function keyPressed(){
	if(keyCode == UP_ARROW){
		if(loops){
			noLoop();
			loops=!loops;
			console.log("PAUSE");
		}
		else{
			loop();
			loops=!loops;
			console.log("resume");
		}
	}

	if(keyCode == RIGHT_ARROW)
		redraw();

}

var personCount = 3;
function pushperson(){
	
		var x = floor(random(2,49))
		var y = floor(random(2,49))
		

		var x2 = floor(random(2,49))
		var y2 = floor(random(2,49))
		
		if(!g.hasBlock(x,y) && !metroStations.hasLocation(x,y)){
			var l = persons.length;
			persons.push(new person(x,y,x2,y2,personCount));
			// console.log("New person :" + personCount);
			// console.log(persons[l]);
			persons[l].callAuto1();
			personCount++;
		}
	
}


function checkAuto(){
	var unalottedpeople=0;
	for (var i = 0; i < persons.length; i++) {
		if(persons[i].journeyId==0 && !persons[i].alottedAuto){
			unalottedpeople++;
			persons[i].callAuto1();
		}
	}
	console.log(unalottedpeople);
}

var minUnoccupied = 10000;
function draw(){							// draw Everything: the Graph, edges, autos, their paths, metros, metroStations.
	background(255);
	g.show();
	// console.log(frameCount);

	if(keyIsPressed){
		if(key=='+'){
			rate+=0.3;
		}

		if(key=='-'){
			if(rate>0.4)rate-=0.3;
		}
	}

	

	metroStations.show();

	var unoccupiedcounter = 0;
	for(var i = 0 ; i < autos.length ; i++){
		autos[i].showPath();
		autos[i].show();
		if(!autos[i].occupied)
			unoccupiedcounter++;
	}
	fill(100);
	noStroke();
	textSize(15);

	if(unoccupiedcounter < minUnoccupied) minUnoccupied = unoccupiedcounter;
	
	 text("unoccu :" + unoccupiedcounter , width-100 , 60);
	 text("minUnocc :" + minUnoccupied , width-100 , 80);


	text("rate : " + rate, width-100, 20);
	text("people : " + persons.length, width-100, 40);

	

	for(var i = 0 ; i < metros.length ; i++){
		metros[i].show();
	}

	if((frameCount%Math.floor(900/rate))==0){								
		
		   
		if(random(1) < 0.5 && persons.length < autos.length+200){   // increase this probability to see more people turning up.
		for (var i = 0; i < 2*ceil(Math.sqrt(rate)); i++) {
			pushperson();
			}
		}

		if(rate<20){var c=10; while(c-->0)pushperson();  }

		for(var i = 0 ; i < metros.length ; i++){
		metros[i].update();
		}

		for (var i = 0; i < persons.length; i++) {
			
			if(persons[i].waitingAtStation && persons[i].journeyId==1){
			 	// console.log("person " + i + ": Hi Metro-Train ");
			 	var z = persons[i].chooseMetro();
			 	
			 	
			}
			else if(persons[i].seatedMetro){
				if(persons[i].alottedMetro.cur == persons[i].endStation){
					persons[i].seatedMetro = false;
					persons[i].alottedMetro = null;
					persons[i].journeyId = 3;

					// console.log("person " + persons[i].id + " reached end station " + persons[i].endStation);
					persons[i].callAuto1();
				}
			}
		}


	}

	for (var i = 0; i < persons.length; i++) {
		persons[i].show();
	}

	
}





function node(i,j){
	this.i = i;
	this.j = j;
	this.x = i*20;
	this.y = j*20;
	this.visited = false;
	this.cost = 100000;
	this.prev=null;
	this.edges = [];
	this.isBlock = false;
	this.priority = 0;

	this.show = function(){
		ellipse(this.x,this.y,3,3);
		

		// textSize(8.5);
		// text("" + i +"," + j , this.x,this.y);
	}
}

function edge(i1,j1,i2,j2){
	this.i1=i1;
	this.j1=j1;
	this.i2=i2;
	this.j2=j2;

	this.n1 = g.nodes[i1][j1];
	this.n2 = g.nodes[i2][j2];

	this.weight = 1;

	this.show = function(){
		line(i1*20,j1*20,i2*20,j2*20);
	}
}

function graph(debug=false){
	this.nodes = [];
	
	this.log= ()=>{};
	if(debug)this.log = console.log;

	this.Blocks = [];
	for( var i = 0 ; i < 50 ; i++){
		this.nodes[i] = [];
		
	}

	
	for( var i = 0 ; i < 50 ; i++){
		for( var j = 0 ; j < 50 ; j++){
			this.nodes[i][j] = new node(i,j);
		}
	}




	this.addEdges = function(){
		for( var i = 1 ; i < 49 ; i++){
			for( var j = 1 ; j < 49 ; j++){
				this.nodes[i][j].edges.push(new edge(i,j,i+1,j));  
				this.nodes[i][j].edges.push(new edge(i,j,i,j+1));	
				this.nodes[i][j].edges.push(new edge(i,j,i-1,j));	
				this.nodes[i][j].edges.push(new edge(i,j,i,j-1));	
			}
		}
	}

	this.addBlock = function(i,j){

		this.nodes[i][j].isBlock=true;

		// Not completely correct, since after prior removal of some edges ,indexes change, resulting in wrong removals or crashes.
		// current workaround : add less blocks to reduce such probability.
		// SOLVED. (changed system completely to nodal truth value).

		// this.nodes[i-1][j].edges.splice(0,1);
		// this.nodes[i][j-1].edges.splice(1,1);
		// this.nodes[i+1][j].edges.splice(2,1);
		// this.nodes[i][j+1].edges.splice(3,1);

		this.Blocks.push([i,j]);

	}

	this.hasBlock = function(x , y){
		// for (var i = 0; i < this.Blocks.length; i++) {
		// 	if(this.Blocks[i][0] == x && this.Blocks[i][1]==y){
		// 		return true;
		// 	}
		// }
		// return false;

		return this.nodes[x][y].isBlock;
	}
	



	
	this.show = function(){
		
		// FOR DISPLAYING EACH NODE AND ITS EDGES - WARNING : VERY SLOW [ O(n^3) every frame]
		
		// for( var i = 0 ; i < 50 ; i++){
		// 	for( var j = 0 ; j < 50 ; j++){
		// 		this.nodes[i][j].show();
		// 		// for(var z = 0 ; z < this.nodes[i][j].edges.length ; z++ ){
		// 		// 	this.nodes[i][j].edges[z].show();
		// 		// }
		// 	}
		// }

		

		stroke(0);
		strokeWeight(0.5);
		for(var i = 0 ; i < 50 ; i++){
			line(i*20,0,i*20,1000-20);
		}
		for(var i = 0 ; i < 50 ; i++){
			line(0,i*20,1000-20, i*20);
		}

		for(var i = 0 ; i < this.Blocks.length ; i++){
			fill(150);
			rect(this.Blocks[i][0]*20,this.Blocks[i][1]*20, 18,18 );
		}


	}

	this.unvisit = function(){
		this.log('graph >> unvisit');
		for( var i = 0 ; i < 50 ; i++){
		for( var j = 0 ; j < 50 ; j++){
			var v = this.nodes[i][j];
		      v.visited=false;
		      v.cost=0;
		      v.priority = 0;
		      v.prev=null;
		  }
    	}
    	this.log('graph >> unvisit done');
	}

	this.Dijsktra = function(i,j,i2,j2){
		var n1 = this.nodes[i][j];
		var n2 = this.nodes[i2][j2];

		
		this.unvisit();
		for( var i = 0 ; i < 50 ; i++){
			for( var j = 0 ; j < 50 ; j++){
			this.nodes[i][j].cost = 1000000;
			}
		}


		var path = [];
		return this.Dijsktras(n1,n2);
		
	}


	this.Dijsktras = function( n1 , n2 ){
		var pq = new MinHeap;
		n1.cost = 0;
		n1.visited = true;
		pq.insert(n1);

		while(pq.data.length > 0){
			var v = pq.extractMin();
			v.visited = true;

			if(v.i == n2.i && v.j == n2.j){
				//console.log("Found shortest path");
				return this.constructPath(n2);

			}


			for( var z = 0 ; z < v.edges.length ; z++){
				var edge = v.edges[z];
				var n = edge.n2;


				if(!n.visited && !n.isBlock){
					var tempCost = v.cost + edge.weight;

					if(tempCost < n.cost){
						if(pq.data.includes(n)){
							var index = pq.data.indexOf(n);
							pq.data.splice(index,1);
						}

						n.cost = tempCost;
						n.prev = v;
						pq.insert(n);
					}
				}
			}

		}
		
	}

	//invert stack generated from extracting previous pointers of chained nodes, to construct the path for Auto.
	this.constructPath = function(v2){
		var stack = [];
		var path = [];
		var v = v2;
		while(v!=null){
			stack.push(v);
			v = v.prev;
		}

		while(stack.length > 0){
			var x = stack.pop();
			path.push(x);
		}

		//console.log(path);
		return path;
	}

	

	this.Astar = function(i,j,i2,j2){
		this.log('graph >> Astar');
		var n1 = this.nodes[i][j];
		var n2 = this.nodes[i2][j2];

		
		this.unvisit();
		for( var m = 0 ; m < 50 ; m++){
			for( var n = 0 ; n < 50 ; n++){
			this.nodes[m][n].cost = 1000000;
			}
		}


		var path = [];
		this.log(i, j, i2, j2);
		if(i < 1 || i> 48 || j < 1 || j > 48 || i2 < 1 || i2> 48 || j2 < 1 || j2> 48 ){
			debugger;
			throw new Error('out of bounds');
		}
		this.log(n1.isBlock, n2.isBlock);
		while(n1.isBlock){
			n1 = n1.edges[Math.floor(Math.random()*4)].n2
		}
		while(n2.isBlock){
			n2 = n2.edges[Math.floor(Math.random()*4)].n2
		}
		return this.AstarAlgo(n1,n2);
		
	}


	//Heuristic used here in A* Algorithm is direct geometrical distance.
	this.AstarAlgo = function( n1 , n2 ){
		this.log('graph >> Astar Algo');
		var pq = new MinHeapPriority();
		n1.cost = 0;
		// n1.visited = true;
		n1.priority= dist(n1.x, n1.y , n2.x, n2.y);
		pq.insert(n1);

		// stroke('#009688');
		// ellipse(n1.x, n1.y, 10, 10);
		// stroke('#009688');
		// ellipse(n2.x, n2.y, 10, 10);
		this.log('show origin and destination');

		while(pq.data.length > 0){
			this.log('before extracting ',  pq.data.length);
			var v = pq.extractMin();
			this.log('visited', v.visited, pq.data.length);
			if(v.visited && pq.data.length == 1){
				debugger;
			}
			if(!v.visited){
				this.log('not visited yet', v);
				v.visited = true;
				// stroke('#009688');
				// ellipse(v.x, v.y, 10, 10);
				this.log(pq.data.length);
				// this.log('graph >> Astar Algo >> ', {
				// 	v,
				// 	pq
				// });
				if(v.i == n2.i && v.j == n2.j){
					//console.log("Found shortest path");
					return this.constructPath(n2);

				}


				for( var z = 0 ; z < v.edges.length ; z++){
					var edge = v.edges[z];
					var n = edge.n2;


					if(!n.visited && !n.isBlock){
						var tempCost = v.cost + edge.weight;

						if(tempCost < n.cost){
							if(pq.data.includes(n)){
								var index = pq.data.indexOf(n);
								pq.data.splice(index,1);
							}

							n.cost = tempCost;
							n.prev = v;
							n.priority = n.cost + dist(n.x,n.y, n2.x,n2.y);
							pq.insert(n);
						}
					}
				}
			}

		}

		// this.log('*************** no Path! ******************');
		// debugger;
		// throw new Error('no path');
		return [];
		
	}

}






function station(x,y){
	this.i = x/20;
	this.j = y/20;

	this.x = x;
	this.y = y;

	this.show = function(){
		noStroke();
		fill(0);
		ellipse(x,y,27,27);
		fill(255,0,0);
		rect(x,y,16,16);
	}
}



							
function metroStations(){
	this.stations = [];


	for(var i = 0 ; i < stationLocations.length ; i++){
		this.stations.push(new station( stationLocations[i][0]*20 ,stationLocations[i][1]*20 ));
	}
	


	
	this.show = function(){
		for(var  i = 0 ; i < this.stations.length-1 ; i++){
			this.stations[i].show();
			stroke(0,170,170);
			strokeWeight(2);
			line(this.stations[i].x-s, this.stations[i].y , this.stations[i+1].x-s, this.stations[i+1].y)
			line(this.stations[i].x+s, this.stations[i].y , this.stations[i+1].x+s, this.stations[i+1].y)
		}
		this.stations[this.stations.length-1].show();
	}

	this.hasLocation = function(x,y){
		for(var i = 0 ; i < stationLocations.length ; i++){
			if(stationLocations[i][0]==x && stationLocations[i][1]==y){
				return true;
			}
		}

		return false;
	}



}

function metroTrain(i , dir){

	this.up = dir;
	this.cur = i;

	this.currentStation = metroStations.stations[this.cur];
	if(this.up) this.next = this.cur+1;
	else this.next = this.cur-1;

	this.x = metroStations.stations[this.cur].x;
	this.y = metroStations.stations[this.cur].y;

	this.x2 = metroStations.stations[this.next].x;
	this.y2 = metroStations.stations[this.next].y;
	

	this.show = function(){
		fill(0,250,250);
		stroke(0);
		if(this.up)
			ellipse(this.x-s,this.y , 9,9);
		else ellipse(this.x+s,this.y , 9,9);


		this.x+= (this.x2 - this.x)*0.007*rate;		
		this.y+= (this.y2 - this.y)*0.007*rate;

	}

	this.update = function(){
		if( this.next == metroStations.stations.length-1 || this.next == 0){		// turn metro Upside down at Ending stations.
			this.up = !this.up;
		}


		if(this.up) {
			this.cur = this.next;
			this.next = this.next+1;}
		else {
			this.cur = this.next;
			this.next = this.next-1;
		}

		this.currentStation = metroStations.stations[this.cur];
		this.x2 = metroStations.stations[this.next].x;
		this.y2 = metroStations.stations[this.next].y;
	}

	

}


function Auto (i,j , id, debug=false){
	this.i = i;
	this.j = j;
	this.id = id;

	this.x = this.i*20;
	this.y = this.j*20;
	this.path = [];
	this.cur = 1;
	//this.moveRandomly = false;
																	// Normal speed:  0.005 - 0.1.  ;  currently sped up.
	this.speed = random(0.005, 0.01);							//updationSpeed parameter depends on speed, dictates frame at which updated.
	this.updation = floor(random(220,200)/(this.speed*80));		// speed inverse relation. 

	this.reachedDest = false;
	this.occupied = false;

	// this.stillOccupied = false; //  for debugging
	this.person = null;			//  for debugging
	this.log = ()=>{};
	if(debug)this.log = console.log;

	this.tripNo = 0;

	this.show = function(){
		this.i = Math.min(ceil(this.x/20), 48);
		this.j = Math.min(ceil(this.y/20), 48);
		// this.log(this.id + ':Auto >> show')
		
		// if(this.occupied && this.reachedDest && this.stillOccupied){ //  for debugging
		// 	this.highlight();
		// 	this.person.highlight();
		// 	var auto = this;
		// 	setTimeout(()=>{
		// 		console.log(auto);
		// 		debugger;
		// 	}, 50);

		// }
		// else if(this.occupied && this.reachedDest){ //  for debugging
		// 	this.stillOccupied =true;
		// }


		fill(0);
		var color = this.occupied?'#f00':'#009999';
		stroke(color);
		//if(this.cur  < this.path.length-1){
		if(this.path.length>0){
		this.x+=(this.path[this.cur].x - this.x)*this.speed*rate;
		this.y+=(this.path[this.cur].y - this.y)*this.speed*rate;
		}
		//}
		rect(this.x,this.y,6,6);

		this.updation = floor(2.4/(this.speed*rate));
		if(frameCount%this.updation==0)
			this.update();
	}
	
	this.highlight = function(){ //  for debugging
		stroke('#093');
		ellipse(this.x, this.y, 30, 30);
	}


	this.reset = function(){
		this.log(this.id + ':Auto >> reset, tripNo:', this.tripNo)
		this.path = [];
		this.reachedDest=false;
		this.cur = 0;
		this.log(this.id + ':Auto >> reset done');
	}
	this.setDestination = function(i2,j2){
		this.tripNo++;
		this.log(this.id + ':Auto >> setDestination')
		//console.log("Auto id : " + this.id);
		
		this.reset();
		this.log('AUTO : ------ call Astar with ', this.i, this.j, i2, j2, '------');
		//this.path = g.Dijsktra(this.i,this.j,i2,j2);		//choose this for a more "filled" screen..!	
		this.path = g.Astar(this.i,this.j,i2,j2);		//TWO GREAT SHORTEST PATH ALGORITHMS. CHOOSE ANY.
		
		this.log(this.id + ':Auto >>found Path', this.path);
		this.log(this.id + ':Auto >> setDestination')
		return this.path;
	}


	this.chooseDestStation = function(){			// currently: choose nearest station.
		this.log(this.id + ':Auto >> chooseDestStation')
		min = 10000;
		var z = 0;
		for(var i = 0 ; i < metroStations.stations.length ; i++){
			var d = dist( this.x, this.y , metroStations.stations[i].x , metroStations.stations[i].y )
			if( d  < min){
				min = d;
				z = i;
			}
		}
		return z;
	}


	this.update = function(){
		// this.log(this.id + ':Auto >> update')
		if(this.cur < this.path.length-1){ 
			this.cur = this.cur+1;
			this.i = floor(this.x/20);
			this.j = floor(this.y/20);
		}
		else this.reachedDest = true;
	}

	this.showPath = function(){
		// this.log(this.id + ':Auto >> showPath')
		strokeWeight(2);
		stroke(255,0,0);
		for(var i = this.cur; i < this.path.length -1 ; i++){
			line(this.path[i].x, this.path[i].y , this.path[i+1].x , this.path[i+1].y);
		}
	}
}




function person(i,j,i2,j2, id, debug=false){
	this.i = i;
	this.j = j;

	this.i2 = i2;
	this.j2 = j2;
	this.id = id;
	this.seatedAuto = false;
	this.seatedMetro = false;
	this.alottedAuto = null;
	this.alottedMetro = null;
	this.waitingAtStation = false;
	this.color = "#32ff00";

	this.firstStation = null;
	this.endStation = null;
	this.journeyId = 0;		// 0 - waiting for auto, 1 - boarded auto , 

	this.x = this.i*20;
	this.y = this.j*20;

	this.activityLog;
	this.log = ()=>{};
	if(debug)this.log = console.log;

	this.show = function(){
		// this.log(this.id , ': Person >> show');
		
		this.i = ceil(this.x/20);
		this.j = ceil(this.y/20);

		
		if(this.alottedAuto!=null && this.seatedAuto){
			this.x = this.alottedAuto.x;
			this.y = this.alottedAuto.y;
			

			if(this.alottedAuto.reachedDest) {
				
				// console.log("Auto " + this.alottedAuto.id + " Reached dest");
				this.alottedAuto.occupied=false;
				// this.alottedAuto.stillOccupied=false;
				this.alottedAuto = null;
				this.seatedAuto = false;
				
				if(this.journeyId == 1){
					this.waitingAtStation = true;
					// console.log("person " +this.id + ": waiting at station " + this.firstStation);
				}

				if(this.journeyId == 4){
					console.log("person " +this.id + " completed full journey");
					var index = getIndex(persons, this.id);
					// console.log(index);

					persons.splice(index,1);
					
				}
			}
		}

		if(this.alottedMetro!= null && this.seatedMetro){
			this.x = this.alottedMetro.x;
			this.y = this.alottedMetro.y;
		}


		strokeWeight(4);
		stroke(this.color);
		ellipse(this.x, this.y - 8 , 4,4);
		line(this.x , this.y, this.x, this.y - 8);



		if(this.alottedAuto!= null && frameCount%this.alottedAuto.updation == 0){
			if(this.alottedAuto.reachedDest){
				this.seatedAuto = true;
				this.alottedAuto.occupied=true;
				// this.alottedAuto.stillOccupied=false;
				// console.log("person " + this.id + ": Hi Auto " + this.alottedAuto.id);
				
				if(this.journeyId == 0){
					var z = this.alottedAuto.chooseDestStation();
					var path = this.alottedAuto.setDestination(metroStations.stations[z].i , metroStations.stations[z].j);
					if(path == null)this.color = '#ff0000';
					else{
						this.alottedAuto.reachedDest = false;


						this.firstStation = z;
						this.journeyId = 1;
					}
				}
				else if(this.journeyId==3){
					var path = this.alottedAuto.setDestination(this.i2, this.j2);
					if(path == null)this.color = '#ff0000';
					else{
						this.alottedAuto.reachedDest = false;
						this.journeyId=4;
					}
				}
			}
		}
	}

	this.resetState = function(){
		this.log(this.id , ':Person >> resetState');
		this.seatedAuto = false;
		this.seatedMetro = false;
		this.alottedAuto = null;
		this.alottedMetro = null;
		this.waitingAtStation = false;
	}

	this.highlight =  () => {
		stroke('#093');
		ellipse(this.x, this.y, 10, 10);
	}

	this.getState = function(){
		this.log(this.id , ':Person >> getState');
		return {
			seatedAuto: this.seatedAuto
			,seatedMetro: this.seatedMetro
			,alottedAuto: this.alottedAuto
			,alottedMetro: this.alottedMetro
			,waitingAtStation: this.waitingAtStation
		}
	}

	this.testState = function(){
		this.log(this.id , ':Person >> testState');
	}

	this.callAuto1 = function(){
		if(this.alottedAuto)return;
		this.log(this.id , ':Person >> callAuto1, journeyId', this.journeyId);
		min = 1000000;
		var z = -1;
		for (var i = 0; i < autos.length; i++) {
			var d = dist(autos[i].i, autos[i].j , this.i , this.j);
			if(d < min && d < 10 && !autos[i].occupied){
				min = d;
				z = i;
			}
		}

		if(z>=0) {
			this.alottedAuto = autos[z];
			// console.log("person " + this.id + " called Auto " + z);
			this.log(this.id,':Person >> call auto', this.i, this.j, this.x, this.y);
			autos[z].setDestination(this.i,this.j);
			autos[z].occupied=true;
			autos[z].person = this;
		}
		else console.log("person " + this.id + ": Couldn't find auto within 10 blocks")
		return z;
	}


	this.findEndStation = function(){
		this.log(this.id , ':Person >> findEndStation');
		min = 10000;
		var z = 0;
		for(var i = 0 ; i < metroStations.stations.length ; i++){
			var d = dist( this.i2*20, this.j2*20 , metroStations.stations[i].x , metroStations.stations[i].y )
			if( d  < min){
				min = d;
				z = i;
			}
		}
		return z;
	}


	this.chooseMetro = function(){
		this.log(this.id , ':Person >> chooseMetro');
		this.endStation = this.findEndStation();
		
		var up = (this.endStation > this.firstStation);

		for (var i = 0; i < metros.length; i++) {
			if(metros[i].currentStation == metroStations.stations[this.firstStation]){
				if(metros[i].up == up){
					this.alottedMetro = metros[i];
					this.seatedMetro = true;
					this.waitingAtStation = false;
					// console.log(this.alottedMetro);
					return i;
					//break;
				}
			}
		}
	}

}



function getIndex(persons , id){
	// console.log("function getIndex", persons, id);
	for(var i = 0 ; i < persons.length ; i++){
		if(persons[i].id == id){
			return i;
		}
	}
}


// Defining data structure for PRIORITY QUEUE (to be used in A star's Algo.)  Here, comparator for Nodes is Priority of the node.

function MinHeapPriority() {
  this.data = [];


	this.insert = function(node) {
	  this.data.push(node);
	  this.bubbleUp(this.data.length-1);
	}

	this.bubbleUp = function(index) {
	  while (index > 0) {
	    var parent = Math.floor((index + 1) / 2) - 1;
	    

	    if (this.data[parent].priority > this.data[index].priority) {
	      var temp = this.data[parent];
	      this.data[parent] = this.data[index];
	      this.data[index] = temp;
	    }
	    
	    index = parent;
	  }
	}

	this.extractMin = function() {
	  // console.log('MinHeap >> extract min');
	  var min = this.data[0];

	  this.data[0] = this.data.pop();
	  if(this.data.length > 1){

	  	this.bubbleDown(0);
	  }
	  else{
	  	// console.log('last element of priority queue');
	  	this.data = [];
	  }
	  return min;
	}

	this.bubbleDown = function(index) {
	  while (true) {
	    var child = (index+1)*2;
	    var sibling = child - 1;
	    var toSwap = null;
	    
	    if (child < this.data.length && this.data[index].priority > this.data[child].priority) {
	      toSwap = child;
	    }
	    
	    if ( (child < this.data.length && sibling >= 0 ) && this.data[index].priority > this.data[sibling].priority && (this.data[child] == null || (this.data[child] !== null && this.data[sibling].priority < this.data[child].priority))) {
	        toSwap = sibling;
	    }

	    if (toSwap == null) {
	      break;
	    }
	    
	    var temp = this.data[toSwap];
	    this.data[toSwap] = this.data[index];
	    this.data[index] = temp;
	    
	    index = toSwap;
	  }
	}
}



//Data structure implemented for Min Heap to be used in Dijkstra's Algo. Comparator is node's cost.
function MinHeap() {
  this.data = [];
}

MinHeap.prototype.insert = function(node) {
  this.data.push(node);
  this.bubbleUp(this.data.length-1);
};

MinHeap.prototype.bubbleUp = function(index) {
  while (index > 0) {
    var parent = Math.floor((index + 1) / 2) - 1;
    

    if (this.data[parent].cost > this.data[index].cost) {
      var temp = this.data[parent];
      this.data[parent] = this.data[index];
      this.data[index] = temp;
    }
    
    index = parent;
  }
};

MinHeap.prototype.extractMin = function() {
  var min = this.data[0];

  this.data[0] = this.data.pop();
  
  this.bubbleDown(0);
  
  return min;
};

MinHeap.prototype.bubbleDown = function(index) {
  while (true) {
    var child = (index+1)*2;
    var sibling = child - 1;
    var toSwap = null;
    
    if (child < this.data.length && this.data[index].cost > this.data[child].cost) {
      toSwap = child;
    }
    
    if ( (child < this.data.length && sibling >= 0 ) && this.data[index].cost > this.data[sibling].cost && (this.data[child] == null || (this.data[child] !== null && this.data[sibling].cost < this.data[child].cost))) {
        toSwap = sibling;
    }

    if (toSwap == null) {
      break;
    }
    
    var temp = this.data[toSwap];
    this.data[toSwap] = this.data[index];
    this.data[index] = temp;
    
    index = toSwap;
  }
};




