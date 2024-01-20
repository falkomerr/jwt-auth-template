# Endpoints

- /auth

  - /signup **POST**

  > Creates a user in the database, sets a refreshToken in the httpOnly cookie and returns mail with an accessToken

  - /signin **POST**

  > Looks up the user in the database, validates the entered values, sets the refreshToken to the httpOnly cookie, returns email and accessToken

  - /refreshToken **GET**

  > Creates a new pair of tokens, sets the refresh token to the httpOnly cookie and returns accessToken

  - /logout **GET**

  > Gets and deletes refreshToken from cookies, acessToken needs to be deleted on the client

- /user

  - **GET** Gets the user

# Fork

- To start working with template you need to create an **.env** file in the project root with the following variables:

  I.  DATABASE_URL=
      > This is the URL where you will connect to your database (for this template you need to use postgresQL)<br/>
  II.  JWT_SECRET=
      > This is a secret string that is used to sign JWT tokens
- After that, you can go to **http://localhost:9999/api** and browse availble endpoints
