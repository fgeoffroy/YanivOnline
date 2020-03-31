DOCKER_NAME=yanivonline

test: submodules
	docker-compose up -d --build --force-recreate
	sh build_scripts/inspect_container.sh

submodules:
	git submodule update --recursive --init

clean: 
	docker-compose down
	rm container_info container_message container_ip
