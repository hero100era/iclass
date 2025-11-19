.PHONY: all clean build install

all: build

build:
	$(MAKE) -C extensions/data
	$(MAKE) -C extensions/logic
	$(MAKE) -C extensions/api

install: build
	# Copies built extensions to local Postgres (if running locally)
	$(MAKE) -C extensions/data install
	$(MAKE) -C extensions/logic install
	$(MAKE) -C extensions/api install
