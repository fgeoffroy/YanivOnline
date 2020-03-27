#!/bin/sh

docker inspect yanivonline_django_1 > container_info
cat container_info | grep '"IPAddress"' | head -n 1 | sed -r -e 's/^.*"([0-9]+\.[0-9]+\.[0-9]+\.[0-9]+)".*$/\1/g'> container_ip
echo > container_message
echo >> container_message
echo >> container_message
echo >> container_message
echo "#######################################################" >> container_message
echo >> container_message
echo >> container_message
echo "Welcome to yaniv online testing instance" >> container_message
echo >> container_message
echo "Please connect to http://$(cat container_ip):8080/game/room1 " >> container_message
echo >> container_message
echo >> container_message
echo "#######################################################" >> container_message
echo >> container_message
echo >> container_message
echo >> container_message

cat container_message

