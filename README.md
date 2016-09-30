# pws-poc-node
A test replacement of an internal PWS tier - written in js

To initially build: npm install

To run using the local env and no docker container: node src/server.js
To run using a specified environment and no docker container: export PWS_ENVIRONMENT=environment_name followed by node src/server.js

To build docker image: docker build -t test-pws:v0 .

To run as docker container (includes logging to elastic search): docker run -d -t -p 5000:5000 -e "PWS_ENVIRONMENT=rqa3" test-pws:v0
