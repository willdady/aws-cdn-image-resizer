#!/bin/bash
docker build -t willdady/lambda-layer-sharp .
id=$(docker create willdady/lambda-layer-sharp)
docker cp $id:/opt/layer.zip layer.zip
docker rm -v $id