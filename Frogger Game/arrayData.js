function reset_coords(){ //reset all these coordinates and data to original

	coordinates = new Array(); // master array of all coordinates in the sprite png

	coordinates['deadfrog'] = new Object; //coordinates of dead frog image in png
	coordinates['deadfrog'].x = 0;
	coordinates['deadfrog'].y = 0;
	coordinates['deadfrog'].w = 29;
	coordinates['deadfrog'].h = 30;

	coordinates['frogu'] = new Object;		//coordinates of frog facing u for up
	coordinates['frogu'].x = 13;
	coordinates['frogu'].y = 368;
	coordinates['frogu'].w = 22;
	coordinates['frogu'].h = 20;

	coordinates['frogju'] = new Object;		//ju for jumping up
	coordinates['frogju'].x = 45;
	coordinates['frogju'].y = 364;
	coordinates['frogju'].w = 23;
	coordinates['frogju'].h = 27;

	coordinates['frogd'] = new Object;		//frog looking down
	coordinates['frogd'].x = 79;
	coordinates['frogd'].y = 368;
	coordinates['frogd'].w = 22;
	coordinates['frogd'].h = 20;

	coordinates['frogjd'] = new Object;		//frog jumping down
	coordinates['frogjd'].x = 114;
	coordinates['frogjd'].y = 366;
	coordinates['frogjd'].w = 23;
	coordinates['frogjd'].h = 27;

	coordinates['frogl'] = new Object;		//frog looking left
	coordinates['frogl'].x = 82;
	coordinates['frogl'].y = 336;
	coordinates['frogl'].w = 22;
	coordinates['frogl'].h = 23;

	coordinates['frogjl'] = new Object;		//frog jumping left
	coordinates['frogjl'].x = 110;
	coordinates['frogjl'].y = 336;
	coordinates['frogjl'].w = 28;
	coordinates['frogjl'].h = 23;

	coordinates['frogr'] = new Object;		//frog looking right
	coordinates['frogr'].x = 13;
	coordinates['frogr'].y = 335;
	coordinates['frogr'].w = 22;
	coordinates['frogr'].h = 23;

	coordinates['frogjr'] = new Object;		//frog jumping right
	coordinates['frogjr'].x = 42;
	coordinates['frogjr'].y = 336;
	coordinates['frogjr'].w = 27;
	coordinates['frogjr'].h = 23;

	coordinates['log'] = new Array();	//array of all the diff log/car type coordinates
	coordinates['car'] = new Array();    //^
	coordinates['lillyfrog'] = new Array(); //array of all frogs shown on lilly pads

	coordinates['log'][0] = new Object;	//long log; type 0
		coordinates['log'][0].x = 8; // a few extra to left so half frogger on log counts
		coordinates['log'][0].y = 165;
		coordinates['log'][0].w = 178;
		coordinates['log'][0].h = 22;
	coordinates['log'][1] = new Object; //medium log; type 1
		coordinates['log'][1].x = 8; // a few extra to left so half frogger on log counts
		coordinates['log'][1].y = 198;
		coordinates['log'][1].w = 117;
		coordinates['log'][1].h = 22;		
	coordinates['log'][2] = new Object; //short log; type 2
		coordinates['log'][2].x = 8; // a few extra to  left so half frogger on log counts
		coordinates['log'][2].y = 230;
		coordinates['log'][2].w = 85;
		coordinates['log'][2].h = 22;

	coordinates['log'][3] = new Object; // open mouth alligator; log type 3
		coordinates['log'][3].x = 154; 
		coordinates['log'][3].y = 335;
		coordinates['log'][3].w = 88;
		coordinates['log'][3].h = 30;	
	coordinates['log'][4] = new Object; // closed mouth alligator; log type 4
		coordinates['log'][4].x = 154; 
		coordinates['log'][4].y = 368;
		coordinates['log'][4].w = 90;
		coordinates['log'][4].h = 30;				

	coordinates['car'][0] = new Object; //pink car; type 0
		coordinates['car'][0].x = 10.5;
		coordinates['car'][0].y = 265;
		coordinates['car'][0].w = 27;
		coordinates['car'][0].h = 25;
	coordinates['car'][1] = new Object; //pointed car; type 1
		coordinates['car'][1].x = 46;
		coordinates['car'][1].y = 265;
		coordinates['car'][1].w = 28;
		coordinates['car'][1].h = 25;
	coordinates['car'][2] = new Object; //yellow car; type 2
		coordinates['car'][2].x = 80;
		coordinates['car'][2].y = 265;
		coordinates['car'][2].w = 25;
		coordinates['car'][2].h = 25;
	coordinates['car'][3] = new Object; //1 of 3 duplicate cars; type 3
		coordinates['car'][3].x = 12;
		coordinates['car'][3].y = 300;
		coordinates['car'][3].w = 24;
		coordinates['car'][3].h = 25;
	coordinates['car'][4] = new Object; //truck; type 4
		coordinates['car'][4].x = 107;
		coordinates['car'][4].y = 300;
		coordinates['car'][4].w = 46;
		coordinates['car'][4].h = 25;

	coordinates['lillyfrog'][0] = new Object; //frog in lilly pad;  	
		coordinates['lillyfrog'][0].x = 80;
		coordinates['lillyfrog'][0].y = 368;
		coordinates['lillyfrog'][0].w = 22;
		coordinates['lillyfrog'][0].h = 20;
	//Note: there is only 1 type of lilly pad frog but I keep the array format so that my
	//draw_stuff function that draws logs and cars too also draws these lilly frogs

	lillies = new Array(); //array of acceptable x-values for a frog to land on lilly pad

	lillies[1] = new Object;
		lillies[1].min = 3;
		lillies[1].max = 28; // a little extra; lilly pad 1 is hard to get with animation
	lillies[2] = new Object;
		lillies[2].min = 96;
		lillies[2].max = 107;
	lillies[3] = new Object;
		lillies[3].min = 181;
		lillies[3].max = 193;
	lillies[4] = new Object;
		lillies[4].min = 265;
		lillies[4].max = 278;
	lillies[5] = new Object;
		lillies[5].min = 351;
		lillies[5].max = 362;

	//array of the 13 logs with their types (short, gator, etc) and speeds and coordinates
	logarray = new Array(); 
	logarray[0]={type:1, speed:3.25, x:50, y:120};   
	logarray[1]={type:1, speed:3.25, x:200, y:120}; 
	logarray[2]={type:1, speed:3.25, x:350, y:120}; 
	logarray[3]={type:2, speed:-2.5, x:5, y:155};    
	logarray[4]={type:2, speed:-2.5, x:145, y:155};    
	logarray[5]={type:2, speed:-2.5, x:285, y:155};    
	logarray[6]={type:0, speed: 4.25, x:20, y:190};    
	logarray[7]={type:0, speed: 4.25, x:240, y:190};    
	logarray[8]={type:2, speed:-2.5, x:155, y:225};    
	logarray[9]={type:2, speed:-2.5, x:315, y:225};    
	logarray[10]={type:2, speed:-2.5, x:475, y:225};  
	logarray[11]={type:1, speed:3.25, x:-40, y:260};   
	logarray[12]={type:1, speed:3.25, x:110, y:260}; 
	logarray[13]={type:1, speed:3.25, x:260, y:260}; 
// some of these logs are later changed to gators (type 3 and 4), but keep the speeds etc

	//array of the 13 cars with their types (truck, yellow, white, etc), speeds, & coords
	cararray = new Array();
	cararray[0] = {type:4, speed: -4, x:60, y:328}; 
	cararray[1] = {type:4, speed: -4, x:172.5,  y:328}; 
	cararray[2] = {type:1, speed: 3, x:142, y:360}; 
	cararray[3] = {type:1, speed: 3, x:248, y:360}; 
	cararray[4] = {type:1, speed: 3, x:354, y:360}; 
	cararray[5] = {type:0, speed: -2.5, x:100, y:395};  
	cararray[6] = {type:0, speed: -2.5, x:206, y:395};   
	cararray[7] = {type:0, speed: -2.5, x:312, y:395};   
	cararray[8] = {type:3, speed: 2.5, x:56, y:430};   
	cararray[9] = {type:3, speed: 2.5, x:162, y:430};   
	cararray[10] = {type:3, speed: 2.5, x:268, y:430};   
	cararray[11] = {type:2, speed: -4, x:156, y:465};  
	cararray[12] = {type:2, speed: -4, x:262, y:465};  
	cararray[13] = {type:2, speed: -4, x:368, y:465};  
}