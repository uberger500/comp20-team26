function start_game(){

	var gameover;
	var levelcompleted;
	var froghome; //home = in lilly pad region
	var furthest; //furthest pixels reached so far for tracking when to score += 10
	var input;
	var lastloop; // used for calculating FPS
	score = 0;
	hscore = 0;
	var curfrog; //curfrog = current frog image being used; u up, ju jumping up, etc
	var animating_jump; // frames left in jump animation
	var animating_death; // framtes left in death animaton
	var fly_visible; //ticker, removes current fly if exists, possibly creates new one
	var fly_location; // 1-5; lilly pad that the fly is in; 0 if none
	var gator_mouth; //gator mouth ticker; opens/closes on 25; resets to 50 at 0
	var gator1; // all gators initially turned off except for gator0
	var gator2;
	var gator11;
	var gator12;
	var gator13;
	var token;
	fps = 13;

// set up canvas
	canvas = document.getElementById('game');
	if (canvas.getContext){
		ctx = canvas.getContext('2d');
		img = new Image();
		img.src = 'assets/frogger_sprites.png';
		deadfrog = new Image();
		deadfrog.src = 'assets/dead_frog.png';
		lillypic = new Image();
		lillypic.src = 'assets/lilly.png';
		document.addEventListener("keydown", function(event){
			trigger_move(event); // set the input according to the key pressed
		});
// initialize game variables and data
  		initialize();		
  		a = 0;
// start loop on sprite image load
  		img.onload = gameloop();
  		delay = 75;
  		a = setInterval(gameloop, delay);
	}
	else {
		alert('Canvas not supported on your browser.');
	}
}
//=====================================================================================
function trigger_move(event, key){

// Event is undefined when the user clicks one of the arrows for mobile play; onclick
// sends 'up' 'down' etc as the key value
	if (event != undefined){
		if (event.keyCode == 38)
			key = 'up';
		else if (event.keyCode == 40)
			key = 'down';
		else if (event.keyCode == 37)
			key = 'left';
		else if (event.keyCode == 39)
			key = 'right';
		else if (event.keyCode == 32)
			key = 'restart';
	}
	if (key == 'up') { 	// move up
		if (animating_jump == 0){
			input = 'up';
			curfrog = 'frogu';
			animating_jump = 4; // gameloop will loop 4 times animating the frog jump
		}
	}
	else if (key == 'down'){ // move down
		if(animating_jump == 0){
			input = 'down';
			curfrog = 'frogd';
			animating_jump = 4;
		}	
	}
	else if (key == 'left'){ // move left
		if(animating_jump == 0){
			input = 'left';
			curfrog = 'frogl';
			animating_jump = 4;
		}
	}
	else if (key == 'right'){ // move right
		if(animating_jump == 0){
			input = 'right';
			curfrog = 'frogr';
			animating_jump = 4;
		}
	}
	else if (key == 'restart'){ //restart / new game
		initialize();		
		a = 0;
		img.onload = gameloop();
		delay = 75;
		a = setInterval(gameloop, delay);
	}
}
//=====================================================================================
function initialize(){
//load highscore if set in local storage or set current score to high score
	if (localStorage['hscore'] != undefined){
		hscore = localStorage['hscore'];
	}
	else
		localStorage.setItem('hscore', 0);
	if (score != undefined){
		if (score > hscore){
			hscore = score;
			localStorage['hscore'] = hscore;
		}
	}
	level = 1;
	score = 0;
	lives = 3;
	frogx = 186; //starting coordinates for frog
	frogy = 505;
	furthest = 505;
	gameover = false;
	input = 'no';
	lastloop = new Date;
	curfrog = 'frogu';
	gameover = false;
	froghome = false;
	reset_coords(); // in arrayDate.js; resets coordinates of all logs and cars to default
	animating_jump = 0; //not currently animating a jump
	animating_death = 0; //not currently animating a death
	gator1 = false; 
	gator2 = false;
	gator11 = false;
	gator12 = false;
	gator13 = false;
	if (fps < 100)
		fly_visible = fps*8; //frames per second * 8 seconds = # frames required
	else
		fly_visible = 85; //fly visible for 85 frames
	if (fps < 100) //sometimes fps gets calcualted as infinity and stuff
		gator_mouth = fps*8; //goal is 4 seconds before opening/closing so *8 total
	else
		gator_mouth = 100; //gator mouths open or closed for 50 frames
	initial_gator_mouth = gator_mouth;
	fly_location = 0;
	lillyfrogarray = new Array(); //array of frogs on lilly pads(for coordinates etc)
	pads = [false, false, false, false, false, false]; //array of lillypads, some w/frogs
	flies = [false, false, false, false, false, false]; //array of lillypads, 0-1 w/frog
}
//=====================================================================================
function gameloop(){

	thisloop = new Date;
	fps = 1000 / (thisloop - lastloop);
	lastloop = thisloop;
	if (gameover){
		var scoreobj = new Object;
		scoreobj.game_title = "frogger";
		scoreobj.score = score;
		scoreobj.token = "7cb2c74a-f4ec-4691-a92b-540366f0db87";

		$.post(masterurl + "/api/score/submit", scoreobj);
//		$.post("http://localhost:3000/submit.json", scoreobj);
//		$.post("http://localhost:3000/submit.json", {game_title: "frogger", username: "bob", score:9001});
		clearInterval(a); //stop game loop
		gameover_screen(); //show the game over screen, prompt replay
	}
	else{ // display normal game frame
		set_gator_mouths(); //set all the alligator images; open or closed mouths
		set_flies();
		if (animating_death >= 1)//if animating death ticker isnt finished, show dead frog
			animate_death(fps);
		else{
			if (animating_jump > 0)
				update_frog(input, fps); //update frog coordinates 4 times; once per loop
			if (pads[1] && pads[2] && pads[3] && pads[4] && pads[5]) //if 5 frogs home
				increase_level();	
			check_lillies(); //check if frog landed on lilly pad
			update_objs('car', cararray, fps); //update car locations
			update_objs('log', logarray, fps); //update log and gator locations
			check_death(fps); //check if frog died
			check_bounds(); //die if log moves you into the side of the screen
			draw_statics(); //draw road, sidewalks, water, etc
			draw_footer();  //draw lives, level, score, etc
			draw_stuff('car', cararray); //draw cars
			draw_stuff('log', logarray); //draw logs (and gators)
			draw_stuff('lillyfrog', lillyfrogarray); //draw frogs on lillypads
			if(fly_location != 0 && pads[fly_location] == false){//draw fly if one exists
				var xval = 18 + ((fly_location - 1) * 85);
				ctx.drawImage(img, 139, 235, 20, 20, xval, 85,20, 20);
			}
			draw_frog(img); //draw frog
		}
	}
}
//=====================================================================================
function gameover_screen(){

	draw_statics(); //draw background stuff so no cars or logs
	draw_footer();
	ctx.font = "bold 40pt Arial";
	ctx.fillStyle = 'red';	
	ctx.fillText("GAME OVER", 37, 215); // GAME OVER 
	ctx.font = "bold 20pt Arial";
	if (score > hscore){
		ctx.fillText("New High Score!", 95, 250);
	}
	ctx.fillText("Hit spacebar to play again", 34, 420); 	
}
//=====================================================================================
function draw_statics(){

	ctx.fillStyle = "#191970";
	ctx.fillRect(0,0,399,290);	 // Water

    ctx.fillStyle="#000000";
    ctx.fillRect(0,314.5,399,250.5); // Road, including behind bottom roadside
    
	ctx.drawImage(img, 0, 0, 345, 50, 24, 2, 345, 50); // FROGGER

	ctx.drawImage(img, 0, 53, 399, 57, 0, 58, 399, 57); // Grass

	ctx.drawImage(img, 0, 117, 399, 37, 0, 285, 399, 37);
	ctx.drawImage(img, 0, 117, 399, 37, 0, 492, 399, 37); // Roadsides
}
//=====================================================================================
function draw_footer(){

	ctx.font = "bold 15pt Arial";
	ctx.fillStyle = 'yellow';
	ctx.fillText("Level " + level, 50, 545); // Level

	ctx.font = "bold 10pt Arial";
	ctx.fillText("Score: " + score, 3, 561); 
	ctx.fillText("Highscore: " + hscore, 92, 561); // Scores
	ctx.fillText(Math.floor(frogx) + ", " + Math.floor(frogy), 344, 561); // coordinates

	for (i = 0; i < lives; i++){ 
		xcoord = i * 15 + 2;	 			//Loop makes x = 2, 17, 32 for 3 lives
		ctx.drawImage(img, 10, 335, 32, 32, xcoord, 531.5, 20, 20);	//Frogs
	}
}
//=====================================================================================
function set_gator_mouths(){
	if (gator_mouth > (initial_gator_mouth / 2)){ //ticker that switches after half
		logarray[0].type = 3; //gator 0 always on
		if (gator1)
			logarray[1].type = 4; //type 4 is mouth closed
		if (gator2)
			logarray[2].type = 3; //type 3 is mouth open
		if (gator11)
			logarray[11].type = 4;
		if (gator12)
			logarray[12].type = 3;
		if (gator13)
			logarray[13].type = 4;
	}
	else if (gator_mouth > 0){
		logarray[0].type = 4;
		if (gator1)
			logarray[1].type = 3;
		if (gator2)
			logarray[2].type = 4;
		if (gator11)
			logarray[11].type = 3;
		if (gator12)
			logarray[12].type = 4;
		if (gator13)
			logarray[13].type = 3;
	}
	else{
		if (fps < 100)
			gator_mouth = fps*8; //goal is 4 seconds before opening/closing so *8 total
		else
			gator_mouth = 100; //gator mouths open or closed for 50 frames
		initial_gator_mouth = gator_mouth;
	}
	gator_mouth--;
}
//=====================================================================================
function set_flies(){
	if (fly_visible <= 0){
		if (fps < 100)
			fly_visible = fps*8; //frames per second * 8 seconds = # frames required
		else
			fly_visible = 85;

		flies = [false, false, false, false, false, false];
		rand = Math.floor(Math.random()*10); //random num 0-10; if its 1-5 we use it as a
		if (rand >= 1 && rand <= 5){          //lilly pad for the fly, else no fly for 85
			set_fly(rand); //add fly to pad
		}
		else{
			set_fly(0); //dont add a fly for 85 more frames
		}
	}
	fly_visible--;
}
//=====================================================================================
function set_fly(num){
	fly_location = num;
	if (pads[fly_location] == true){ //if theres already a frog home there dont put fly
		fly_location = 0;
	}
	else{
		flies[fly_location] = true; //add fly array of flies
	}
}
//=====================================================================================
function animate_death(fps){
//if animating death we want to continue rendering the background, cars, logs, etc
//but not draw frogger; instead we draw dead frog where he died for 25 frames
	if (animating_death > 1){
		update_objs('car', cararray, fps);
		update_objs('log', logarray, fps);
		draw_statics();
		draw_footer();
		draw_stuff('car', cararray);
		draw_stuff('log', logarray);
		draw_stuff('lillyfrog', lillyfrogarray);
		input = 'no';
		curfrog = 'deadfrog';
		draw_frog(deadfrog);
		animating_death--;
	}
	else if (animating_death == 1){ //end of animation, reset current frog img, new frog
		curfrog = 'frogu';
		if (lives > 0){
			lives--;
			new_frog(0);
		}
		else{ //no lives yet, end the game, prompt replay
			animating_jump = 0;
			gameover = true; 
		}
		animating_death--;
	}
}
//=====================================================================================
function update_objs(type, objarray, fps){

if (type == 'car')		//leftmost varies because cars and lgos have different widths
	var leftmost = -50;  //rightmost doesnt matter; both dissapear when x coordinate > 400
else //log or gator
	var leftmost = -180;

//realspeed is the number of pixels per frame that we need to change
//it is calculated by taking the px per frame that we want the object to move (speed) and
// dividing it by the fps; 13 is goal px per frame

//Move the logs and cars by the realspeed value left or right (speed will pass on to frog)
	for (var j = 0; j < objarray.length; j++){
		realspeed = (objarray[j].speed * 13) / fps;
		if (objarray[j].speed < 0){ //moving left	
			objarray[j].x += realspeed;
			if (objarray[j].x < leftmost) //if object went left off screen
				objarray[j].x = 400;		//set it on the right side
		}
		else { //right moving, 1 or 3
			objarray[j].x += realspeed;
			if (objarray[j].x > 400)	  //if object went right off scrne
				objarray[j].x = leftmost; //set it on the left side
		}
	}
}
//=====================================================================================
function draw_stuff(obj, objarray){
// car, cararray or log, logarray, or lillyfrog lillyfrogarray

	if (obj == 'lillyfrog'){
		for (var i = 1; i < 6; i++){
			if (pads[i] == false){	//draw zelda lilly pads if no frog there;
				xcoord = 18 + ((i - 1) * 85);  //lilly frogs on lilly pads looked weird
				ctx.drawImage(lillypic, 0, 0, 48, 48, xcoord, 85, 18, 18);
			}
		}
	}
	if (objarray.length != 0){ //grab png coordinates from arrayData.js
		for (var j = 0; j < objarray.length; j++){
			imgx = coordinates[obj][objarray[j].type].x;
			imgy = coordinates[obj][objarray[j].type].y;
			imgw = coordinates[obj][objarray[j].type].w;
			imgh = coordinates[obj][objarray[j].type].h;

			//draw the object with these png coordinates png with its in-game coordinates
			ctx.drawImage(img, imgx, imgy, imgw, imgh, objarray[j].x, objarray[j].y, 
						  imgw, imgh);
		}
	}
}
//=====================================================================================
function draw_frog(image){ //draw the frog with the current frog image and current coords
   ctx.drawImage(image, coordinates[curfrog].x, coordinates[curfrog].y, 
   				 coordinates[curfrog].w, coordinates[curfrog].h, frogx, 
   				 frogy, coordinates[curfrog].w, coordinates[curfrog].h);
}
//=====================================================================================
function new_frog(lillypad){
	//add the frog to the lillyfrogarray so its drawn until new level or death
	if (lillypad != 0){
		newlillyfrog = new Object;
		newlillyfrog.type = 0;
		if (lillypad == 1) //leftmost lillypad is hard to get so we give it a wider range
			newlillyfrog.x = lillies[lillypad].min +13; 
		else
			newlillyfrog.x = lillies[lillypad].min + 4; //center frog in lilly pad region
		newlillyfrog.y = 85;
		lillyfrogarray.push(newlillyfrog);
		pads[lillypad] = true;
	}
//set coordinates for new movable frog
	frogx = 186;
	frogy = 505;
	furthest = 505;  //reset furthest px counter for more +10 movement points
	animating_jump = 0; //if died while jumping somehow, dont want to animate new frog
	curfrog = 'frogu';
}
//=====================================================================================
function update_frog(input, fps){

//When frogger is moved, each frame (of 4) in the animation must move him by 8.75 px for
//a total of 35 px so that he lands 35 px away. Gameloop continues so cars/logs etc move
//while he is being animated

	if (input == 'up'){
		if (frogy-8.75 >= 85){
			curfrog = 'frogju';	//frog jumping up image
			frogy = frogy - 8.75;
			animating_jump--;
			if (animating_jump == 0){
				curfrog = 'frogu'; //frog facing up not jumping image
			}
		}
		else 
			frogy = 85;
		if (frogy < furthest){
			furthest = frogy;
			if(animating_jump == 0){
				score+= 10;
			}
		}
		check_collisions('car', cararray, true);
	}
	else if (input == 'down'){
		if (frogy+8.75 <= 505){
			curfrog = 'frogjd'; // frog jumping down image... etc
			frogy = frogy + 8.75;
			animating_jump--;
			if (animating_jump == 0){
				curfrog = 'frogd';
			}
		}
		else {
			curfrog = 'frogjd';
			frogy = frogy - ((505 - frogy)/4); //make it look like hes trying to jump
			animating_jump--;					//but cant due to the bottom of sidewalk
			if (animating_jump == 0){
				curfrog = 'frogd';
			}
		}
	}
	else if (input == 'left'){
		if (frogx-35 >= 3){
			curfrog = 'frogjl';
			frogx = frogx - 8.75;
			animating_jump--;
			if(animating_jump == 0){
				curfrog = 'frogl';
			}
		}
		else{ //if we cant make a full hop leftwards, hop as far left as possible
			curfrog = 'frogjl';
			frogx = frogx - ((frogx - 2)/4); //jump frog to edge of screen, 1/4th of 
			animating_jump--;				  //distance for each animation frame
			if (animating_jump == 0)
				curfrog = 'frogl';
		}
	}
	else if (input == 'right'){
		if (frogx+35 <= 375){
			curfrog = 'frogjr';
			frogx = frogx + 8.75;
			animating_jump--;
			if (animating_jump == 0){
				curfrog = 'frogr';
			}
		}
		else{ //if we cant make full hop right, hop as far right as possible
			curfrog = 'frogjr';
			frogx = frogx + ((375-frogx)/4);
			animating_jump--;
			if (animating_jump == 0){
				curfrog = 'frogr';
			}
		}
	}
}
//=====================================================================================
function check_collisions(obj, objarray, nullscore, fps){
	for (var j = 0; j < objarray.length; j++){
		var frog = new Object;
		frogx = frogx;
		frogy = frogy;
		frog.w = coordinates[curfrog].w;
		frog.h = coordinates[curfrog].h;

		var movingObj = new Object;
		movingObj = objarray[j];	//sets x and y
		movingObj.realx = movingObj.x;
		movingObj.w = coordinates[obj][objarray[j].type].w;
//+10 so when he is animated and only goes up 8.75 pixels it doesnt think hes in the water
		movingObj.h = coordinates[obj][objarray[j].type].h + 10; 
		if (obj == 'log'){
			movingObj.w -= 15;//frogger should die if he is only a couple px on the log 
			movingObj.realx += 4;//frogger should die if he is only a couple px on the log
		// however if the "log" were talking about is an open-mouthed gator, we want the 
		//  head-region of the gator to act as if it were water and kill the frogger
		//  if the gator currently has his mouth closed, it will not kill him
			if (objarray[j].type == 3){ //open mouth
				movingObj.w -= 30; //make collision box smaller^
			}
		// Also, because the gator images were taller than logs, their collisionboxes need
		// to be decreased a bit
			if (objarray[j].type == 3 || objarray[j].type == 4){
			    movingObj.h -= 5;
			}
		}
		//if collision box of frog overlaps collision box of log or car, die
		if (frogx < movingObj.realx + movingObj.w && frogx + frog.w > movingObj.realx && 
		    frogy < movingObj.y + movingObj.h && frogy + frog.h > movingObj.y){
			if (obj == 'car'){
				if (nullscore){
					if (animating_jump == 0){
						score -= 10; //offset +10 pts if frog dies after fully landing
					}
				}
				die();
			}
			else if (obj == 'log'){
				realspeed = (objarray[j].speed * 13) / fps;
				if	(animating_jump == 0){
					frogx = frogx + realspeed; //pass on logs movement to frogs if hes on
				}
				return true; //return that frogger is on a log
			}
			return false; //frogger not on a log
		}
	}
}
//=====================================================================================
function die(){
	animating_death = 25; //25 frames of dead frog
}
//=====================================================================================
function increase_level(){
	if (lives < 3) //free life if just beat a level and have less than 3
		lives++;
	for (var i = 0; i < pads.length; i++){ //reset lilly pads as non-occupied
		pads[i] = false;
	}
	delete lillyfrogarray; //delete array of 5 frogs shown on lilly pads
	lillyfrogarray = new Array(); //recreate it empty
	level++;
	score += 1000;
	increase_speeds(cararray); //add 1 px per frame (or subtract for leftward) to each obj
	increase_speeds(logarray);
	if (level > 1){
		gator2 = true;	//turn on these gators at these levels
		gator13 = true;	
	}
	if (level > 2){
		gator1 = true;
		gator12 = true;
		gator11 = true;
	}
}
//=====================================================================================
function increase_speeds(objarray){
	for (var i = 0; i < objarray.length; i++){
		if (objarray[i].speed < 0) //leftward
			objarray[i].speed -= 1;
		else						//rightward
			objarray[i].speed += 1;
	}
}
//=====================================================================================
function check_lillies(){
	if (frogy == 85){ // if frogs in the win row
		froghome = lilly_checker(); //check if frog in win spot; 
		if (froghome != 0){
			if (pads[froghome]){ // if theres already a frog in the pad.. die
				die();
			}
			else{
				score += 50; //50 pts for frog home
				if (flies[froghome]){
					score += 200; //200 pts extra if theres a fly there
				}			
				new_frog(froghome); //pass which lilly pad it landed on 1-5
				froghome = false;
			}
		}
		else{ //else frog isnt in win spot and therefor hit the grass; dies
			if (animating_jump == 0){ //if not animating jump (frogs move 35 px)
				score -= 10; // frog shouldnt get 10 pts for jumping on a full lilly pad
			}
			die();
		}
	}
}
//=====================================================================================
function lilly_checker(){
var j = 0;
	for (var j = 1; j < 6; j++){ 
		if (frogx >= lillies[j].min && frogx <= lillies[j].max){
			return j; //returns 1-5 (lilly pad #) if frog's x coordinates in in the x
		}				//coordinate range of accepted landing spots
	}
	return 0;
}
//=====================================================================================
function check_death(fps){
	if (animating_jump == 0){ //dont wanna die while frogs in the air
		check_collisions('car', cararray, false); //check if hit by a car
		onlog = check_collisions('log', logarray, false, fps);//check if on log
		if (!onlog){ //if not on log and in water region, die
			if (frogy < 295 && frogy >= 120){
				die();
			}
		}
		input = 'no'; //dont want a new input while animating
	}
}
//=====================================================================================
function check_bounds(){
	if (frogy < 295 && frogy >= 120){	//if in water region
		if (frogx < 0)	
			die();
		else if (frogx > 380)
			die();
	}
}
