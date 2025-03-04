#!/bin/bash
go build -o firestream-build cmd/web/*.go && ./firestream-build -dbname=firestream -dbuser=postgres -cache=false -production=false