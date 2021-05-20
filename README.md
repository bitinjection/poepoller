# Compiling

npm run-script build

# Tests

Currently these must be compiled individually:
`tsc spec/fractionfinder.spec.ts`

Then tests may be run with
`npm test`

# Setup


The following environment variables must be set with sensible values for the node Postgres module to function properly:

* "PGUSER": "poeuser",
* "PGHOST": "localhost",
* "PGPASSWORD": "password",
* "PGDATABASE": "poe",
* "PGPORT": "5432"
 
