DOCKER_NAME=yanivonline

test: docker
	docker run -d $(DOCKER_NAME) > container_id
	sh build_scripts/inspect_container.sh

docker:
	docker build -t $(DOCKER_NAME) .

clean: 
	sh build_scripts/clean_container.sh
	rm container_id container_info container_message container_ip	
