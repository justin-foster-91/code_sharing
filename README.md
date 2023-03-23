# backendboiler

# Installation
* Use WSL, not windows
* `git clone git@github.com:thoughtstem/backendboiler.git`
* `cd backendboiler`
* `docker-compose -f stack.yml build`
* `docker-compose -f stack.yml up`
* Check localhost:8000 in your browser. You should see "Cannot GET".
* Check localhost:80 in your browser. You should see the create an account page.
* It may take several minutes for the database to spin up.

# Running Tests
* Run `docker ps` to get your container name.
* Use the first few characters of the container name to run docker exec dd8 (replace dd8 with your ID)
* `docker exec dd8 npm run test`

# Gotchas
* If the backend container builds but doesn't start, it might be because the ./scripts/setup-and-run.sh isn't running. You may have to enter the backend container and run dos2unix on the file to fix its line endings

# Getting into Docker
* Run `docker ps` to get container name
* Use the first few characters of the container name to Run `docker exec -it dd8 bash` (replace dd8 with your ID)
