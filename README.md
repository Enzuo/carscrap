# What is it
This project retrieve info about cars on the second hand market.
It helps to see a model median price on the parket per age/mileage.


# How to use :

- Install postgresSql & node

- Set up your database making a duplicate of config/default.json and changing the config values

- Set up the names for the car model you want to extract info for in modelExtractor.js

- First run the scrap command

`npm run scrap`

to collect all the info about a car (car address defined in server/index.js)
it'll aggregate the info with previous scrap

- Second

`npm start` to launch the server and the visit `localhost:3000` to see the current state of the second hand market in a graph
