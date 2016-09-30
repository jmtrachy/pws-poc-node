# pws-poc-node
A test replacement of an internal PWS tier - written in js

To build as standalone using the local env: node src/server.js
To build as standalone using a specified environment: export PWS_ENVIRONMENT=environment_name followed by node src/server.js

To build docker image: docker build -t test-pws:v0 .

To run as docker container (includes logging to elastic search): docker run -d -t -p 5000:5000 -e "PWS_ENVIRONMENT=rqa3" test-pws:v0
