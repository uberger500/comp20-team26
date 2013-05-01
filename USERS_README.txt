User API - README

Described below are the API endpoints that allow clients to create, login, logout, and delete Users. Currently a user only stores an email address, a name, and a password (encrypted using bcrypt and stored as a hash), but auxiliary data could be added via the 'userSchema' in 'models.js'.

API calls are prefixed with '/api' currently (can be changed if we want). Currently all API calls EXCEPT 'create' and 'login' require a session token (obtained from 'login') to work, or else an error will be returned (in JSON). The token is passed in as the parameter 'token'.

API: /user/create
Method: POST
Input: email, password, name
Output: (none)
Action: Creates a user with the associated information. Emails are unique and cannot be used more than once.

API: /user/login
Method: POST
Input: email, password
Output: session token
Action: Creates a session for the user with email and password. Returns the token for additional calls.

API: /user/logout
Method: POST
Input: (none)
Output: (none)
Action: Logs out the user currently logged in.

API: /user/delete
Method: POST
Input: (none)
Output: (none)
Action: Deletes the user account associated with the logged in user. That email can be reused again.