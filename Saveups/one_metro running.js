function node(i,j){
	this.i = i;
	this.j = j;
	this.x = i*20;
	this.y = j*20;

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

	this.show = function(){
		line(i1*20,j1*20,i2*20,j2*20);
	}
}

function graph(){
	this.nodes = [];
	this.edges = [];
	for( var i = 0 ; i < 50 ; i++){
		this.nodes[i] = [];
		console.log("done");
	}

	
	for( var i = 0 ; i < 50 ; i++){
		for( var j = 0 ; j < 50 ; j++){
			this.nodes[i][j] = new node(i,j);
		}
	}


	for( var i = 0 ; i < 49 ; i++){
		for( var j = 0 ; j < 50 ; j++){
			this.edges.push(new edge(i,j,i+1,j));
		}
	}

	for( var i = 0 ; i < 50 ; i++){
		for( var j = 0 ; j < 49 ; j++){
			this.edges.push(new edge(i,j,i,j+1));
		}
	}



	
	this.show = function(){
		// for( var i = 0 ; i < 50 ; i++){
		// 	for( var j = 0 ; j < 50 ; j++){
		// 		this.nodes[i][j].show();
		// 	}
		// }

		// for(var i = 0 ; i < this.edges.length ; i++){
		// 	this.edges[i].show();
		// }

		stroke(0);
		for(var i = 0 ; i < 50 ; i++){
			line(i*20,0,i*20,1000-20);
		}
		for(var i = 0 ; i < 50 ; i++){
			line(0,i*20,1000-20, i*20);
		}


	}

}

var g;
var metroStations;
var metros = [];
function setup(){
	createCanvas(1000,1000);
	g = new graph();
	metroStations = new metroStations();
	rectMode(CENTER);
	metros.push(new metroTrain(0));
}

function draw(){
	background(255);
	g.show();
	console.log(frameCount);
	metroStations.show();

	for(var i = 0 ; i < metros.length ; i++){
		metros[i].show();
	}

	if(frameCount%800==0){
		for(var i = 0 ; i < metros.length ; i++){
		metros[i].update();
	}
	}
}


function station(x,y){
	this.x = x;
	this.y = y;

	this.show = function(){
		fill(255,0,0);
		rect(x,y,6,6);
	}
}

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


	s = 4;
	this.show = function(){
		for(var  i = 0 ; i < this.stations.length-1 ; i++){
			this.stations[i].show();
			stroke(0,170,170);
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

function metroTrain(i){

	this.up = true;
	this.cur = i;
	this.next = i+1;

	this.x = metroStations.stations[this.cur].x;
	this.y = metroStations.stations[this.cur].y;

	this.x2 = metroStations.stations[this.next].x;
	this.y2 = metroStations.stations[this.next].y;
	

	this.show = function(){
		fill(0);
		if(this.up)
			ellipse(this.x-4,this.y , 8,8);
		else ellipse(this.x+4,this.y , 8,8);


		this.x+= (this.x2 - this.x)*0.005;
		this.y+= (this.y2 - this.y)*0.005;

	}

	this.update = function(){
		this.next = this.next+1;
		this.x2 = metroStations.stations[this.next].x;
		this.y2 = metroStations.stations[this.next].y;
	}

	

}