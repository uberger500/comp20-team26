##COMP20 - Team 26
- Berger, Urs
- Ford, Kristen
- Friedman, Garrett
- Lockwood, Foster
- Purcell, Sam
- Vrettos, Charlie

### 1. Title
* AccessibiliBuddy

### 2. Problem Statement
* For persons in wheelchairs or with otherwise impaired movement, accessibility is one of the most important factors in deciding a path to get from one location to another. However, for the estimated 1.6 million Americans alone who are in wheelchairs there is no dynamic application which actively interacts with its client in order to maximize accessibility in a path, location, or city-wide context.

### 3. How do you solve the problem?
* We will create a service that allows users to search their vicinity for handicapped accessible locations and attractions and to find handicapped accessible routes to those locations. These attractions will have accessibility ratings and reviews by other users that have visited them. Businesses will be encouraged to become more disability friendly in order to be added to AccessibiliBuddy’s database with good reviews to interest more potential customers. Different paths (handicapped accessible taxis, public transportation, crosswalk navigation, etc) to the locations will be shown with estimated time required to arrive, estimated cost, and unique accessibility ratings for the individual paths.

### 4. Features
1.  Geolocation- finds where users are and how close they are to their desired destination. 
2.	Reporting with charts and graphs- presents data on scaled values of destination convenience and accessibility. 
3.	Custom search- allows user to search for restaurants, stores, and public facilities (e.g., Handicap accessible restrooms).
4.	Data storage in the clouds- stores comments from past customers about restaurants, stores, and public facilities. Comments would include information about flexibility with wheel chair seating, response to service dogs, treatment of customers with disabilities, and other issues important to that community.
5.	Front-end framework including Bootstrap- we will use Bootstrap to ensure a clean responsive design. 

### 5. Data
* Geolocation data will be collected. User ratings and comments will be collected and added to the database. Public transportation locational data and taxi data will be required. 

### 6. Algorithms & special techniques necessary
* It seems obvious that handicap accessible locations can be represented as a graph. Useful, time-tested graphing algorithms like Dijkstra's, DFS, and BFS might help us plot routes very effectively. Additionally we might store locations in a hashtable (localStorage) for quick lookup to improve the load time of our application. In terms of the interface, we might use backbone.js to efficiently scrape accessibility data and display it using the frontend MV structure. For more long term data persistence, such as a login system, we might use php phar's blowfish algorithm for hashing and salt generation, with a MySQL backend (or SQLite for Heroku deployment). 

### 7. Markups 
* https://github.com/tuftsdev/comp20-team26/blob/master/accessibility_mockups.bmml
* https://github.com/tuftsdev/comp20-team26/blob/master/accessibility_mockups.pdf
