DOCKER_NAME=yanivonline

test:
	docker-compose build
	docker-compose up -d
	sh build_scripts/inspect_container.sh

clean: 
	docker-compose down
	rm container_info container_message container_ip	
