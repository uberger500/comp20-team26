##COMP20 - Team 26
- Berger, Urs
- Ford, Kristen
- Friedman, Garrett
- Lockwood, Foster
- Purcell, Sam
- Vrettos, Charlie

### 1. Title
* WingMan

### 2. Problem Statement
* Have you ever been bored on a plane ride before? We know we have and we have the solution for you. As internet is becoming more available on regular commercial flights, and while almost everyone travels with a electronic device with internet capabilities, there still isn't a product that includes all the entertainment needs that a flyer desires.

### 3. How do you solve the problem?
* Our product works on laptops, smartphones, tablets, you name it. All you have to do is select your plane from those flying in your area or type in your flight number while flying. You will have access to a map showing your planes progress on your flight path, your current location, and trivia and facts about the state below you as one of our educational features. Once you log into your account you will have access to an entertainment section with games like frogger, donkey kong, connect4, and tetris. Maybe you want to listen to the embedded radio with stations streaming on the internet; you can do that too. Want to connect with other flyers on the flight? Compare game and trivia high scores with them and even chat with them in our chatroom. Information will update from your flight every 5-10 minutes giving you an updated flight path, and new trivia/facts (from a new state if you cross state borders).

### 4. Features (5+ required)
1. Data scraping from wolfram alpha and flightaware for plane information, location, etc.
2. Local storage for game and trivia highscores.
3. Chat with others on your flight (or send emails/SMS for the requirement).
4. Data storage in the clouds for all your past flights, miles traveled, etc connected to your login account.
5. Reporting with charts and graphs; charts about your flyer history and trivia.game scores.
6. Geolocation for detecting flights around you
7. Front-end framework

### 5. Data
* Trivia/facts collected from http://www.50states.com/facts/ . Flight info (location, speed, altitude, etc) from http://www.wolframalpha.com/ api. Airplane info from http://www.http://flightaware.com/ api. The flight number and sometimes geolocation of the user is collected. The flights flown by a user will be stored as data connected to their login account.

### 6. Algorithms & special techniques necessary
* Techniques involving google maps API like drawing polylines of flight paths, identifying which state the user is above according to longitude and latitude to determine the facts/trivia to be shown.

### 7. Markups 
* ???

Helpful Links --

http://www.rgraph.net