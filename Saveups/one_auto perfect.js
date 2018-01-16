var g;
var metroStations;
var metros = [];
var autos = [];
function setup(){
	createCanvas(1000,1000);
	g = new graph();
	g.addEdges();
	metroStations = new metroStations();
	rectMode(CENTER);

	for(var i = 1 ; i < metroStations.stations.length-1 ; i++){
		metros.push(new metroTrain(i,true));
		metros.push(new metroTrain(i,false));
	}

	for(var i = 0 ; i < 1 ; i++){
		autos.push(new Auto(floor(random(50)),floor(random(50))));
	}

	autos[0].setDestination(4,4);

}

function draw(){
	background(255);
	g.show();

	//console.log(frameCount);
	
	metroStations.show();

	for(var i = 0 ; i < metros.length ; i++){
		metros[i].show();
	}

	for(var i = 0 ; i < autos.length ; i++){
		autos[i].show();
		autos[i].showPath();
	}

	if(frameCount%800==0){
		for(var i = 0 ; i < metros.length ; i++){
		metros[i].update();
	}
	}

	if(frameCount%120==0){
		for(var i = 0 ; i < autos.length ; i++){
		autos[i].update();
	}
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

function graph(){
	this.nodes = [];
	//this.edges = [];
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


	// for( var i = 0 ; i < 49 ; i++){
	// 	for( var j = 0 ; j < 50 ; j++){
	// 		this.edges.push(new edge(i,j,i+1,j));
	// 	}
	// }

	// for( var i = 0 ; i < 50 ; i++){
	// 	for( var j = 0 ; j < 49 ; j++){
	// 		this.edges.push(new edge(i,j,i,j+1));
	// 	}
	// }



	
	this.show = function(){
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


	}

	this.unvisit = function(){
		for( var i = 0 ; i < 50 ; i++){
		for( var j = 0 ; j < 50 ; j++){
			var v = this.nodes[i][j];
		      v.visited=false;
		      v.cost=0;
		      v.prev=null;
		  }
    	}
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
		//return path;
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
				console.log("found way");
				return this.constructPath(n2);

			}


			for( var z = 0 ; z < v.edges.length ; z++){
				var edge = v.edges[z];
				var n = edge.n2;


				if(!n.visited){
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

		console.log(path);
		return path;
	}

}






function station(x,y){
	this.x = x;
	this.y = y;

	this.show = function(){
		noStroke();
		fill(0);
		ellipse(x,y,17,17);
		fill(255,0,0);
		rect(x,y,10,10);
	}
}
var s = 5;
function metroStations(){
	this.stations = [];

	this.stations.push(new station(38*20,1*20));
	this.stations.push(new station(31*20,4*20));
	this.stations.push(new station(27*20,9*20));
	this.stations.push(new station(22*20,13*20));
	this.stations.push(new station(19*20,18*20));
	this.stations.push(new station(15*20,21*20));
	this.stations.push(new station(11*20,26*20));
	this.stations.push(new station(10*20,31*20));
	this.stations.push(new station(15*20,35*20));
	this.stations.push(new station(25*20,38*20));


	
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


	// this.pos = createVector(this.stations[0].x,this.stations[0].y);




	// this.metroRun = function(){
	// 	this.pos.x += 
	// }

}

function metroTrain(i , dir){

	this.up = dir;
	this.cur = i;
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


		this.x+= (this.x2 - this.x)*0.005;
		this.y+= (this.y2 - this.y)*0.005;

	}

	this.update = function(){
		if( this.next == metroStations.stations.length-1 || this.next == 0){
			this.up = !this.up;
		}


		if(this.up) {
			this.cur = this.next;
			this.next = this.next+1;}
		else {
			this.cur = this.next;
			this.next = this.next-1;
		}
		this.x2 = metroStations.stations[this.next].x;
		this.y2 = metroStations.stations[this.next].y;
	}

	

}


function Auto (i,j){
	this.i = i;
	this.j = j;
	this.x = i*20;
	this.y = j*20;
	this.path = [];
	this.cur = 1;
	
	this.show = function(){
		fill(0);
		stroke(255,0,0);
		//if(this.cur  < this.path.length-1){
		this.x+=(this.path[this.cur].x - this.x)*0.01;
		this.y+=(this.path[this.cur].y - this.y)*0.01;
		//}
		rect(this.x,this.y,6,6);
	}

	this.setDestination = function(i2,j2){
		this.path = g.Dijsktra(i,j,i2,j2);

	}

	this.update = function(){
		if(this.cur < this.path.length-1) this.cur = this.cur+1;
	}

	this.showPath = function(){
		strokeWeight(2);
		for(var i = this.cur-1; i < this.path.length -1 ; i++){
			line(this.path[i].x, this.path[i].y , this.path[i+1].x , this.path[i+1].y);
		}
	}
}








































function MinHeap() {
  this.data = [];
}

MinHeap.prototype.insert = function(node) {
  this.data.push(node);
  this.bubbleUp(this.data.length-1);
};

MinHeap.prototype.bubbleUp = function(index) {
  while (index > 0) {
    // get the parent
    var parent = Math.floor((index + 1) / 2) - 1;
    
    // if parent is greater than child
    if (this.data[parent].cost > this.data[index].cost) {
      // swap
      var temp = this.data[parent];
      this.data[parent] = this.data[index];
      this.data[index] = temp;
    }
    
    index = parent;
  }
};

MinHeap.prototype.extractMin = function() {
  var min = this.data[0];
  
  // set first element to last element
  this.data[0] = this.data.pop();
  
  // call bubble down
  this.bubbleDown(0);
  

  return min;
};

MinHeap.prototype.bubbleDown = function(index) {
  while (true) {
    var child = (index+1)*2;
    var sibling = child - 1;
    var toSwap = null;
    
    // if current is greater than child
    if (child < this.data.length && this.data[index].cost > this.data[child].cost) {
      toSwap = child;
    }
    
    // if sibling is smaller than child, but also smaller than current
    if ( (child < this.data.length && sibling >= 0 ) && this.data[index].cost > this.data[sibling].cost && (this.data[child] == null || (this.data[child] !== null && this.data[sibling].cost < this.data[child].cost))) {
        toSwap = sibling;
    }
    
    // if we don't need to swap, then break.
    if (toSwap == null) {
      break;
    }
    
    var temp = this.data[toSwap];
    this.data[toSwap] = this.data[index];
    this.data[index] = temp;
    
    index = toSwap;
  }
};
