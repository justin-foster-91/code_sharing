#!/bin/bash


echo "Waiting to be sure postgres container fully starts first " #Can we get docker compose to check this for us??

sleep 10

if psql $DATABASE_URL_BASE/instances -c '\q' 2>&1; then
	echo "DB FOUND!"
else
	echo "NO DB FOUND at $DATABASE_URL_BASE!  Creating DB"
	psql $DATABASE_URL_BASE -c "create database instances"

	echo "Creating Tables"
	npm run migrate 

	echo "Creating Seed Data"
	psql $DATABASE_URL_BASE/instances -f ./seeds/seed.tables.sql
fi

if psql $DATABASE_URL_BASE/instances-test -c '\q' 2>&1; then
	echo "TEST DB FOUND!"
else
	echo "NO TEST DB FOUND!  Creating DB"
	psql $DATABASE_URL_BASE -c "create database \"instances-test\""

	echo "Creating Tables"
	npm run migrate:test
fi


npm run dev
