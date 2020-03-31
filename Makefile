DOCKER_NAME=yanivonline

test:
	docker-compose up -d --build --force-recreate
	sh build_scripts/inspect_container.sh

clean: 
	docker-compose down
	rm container_info container_message container_ip	
