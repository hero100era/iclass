EXTENSION = iclass
EXTVERSION = $(shell grep default_version $(EXTENSION).control | \
               sed -e "s/default_version[[:space:]]*=[[:space:]]*'\([^']*\)'/\1/")

PG_CONFIG ?= pg_config
PG_VER = $(shell $(PG_CONFIG) --version | sed "s/^[^ ]* \([0-9]*\).*$$/\1/" 2>/dev/null)

PG_VER_min = 14

ifeq ($(shell expr "$(PG_VER_min)" \<=  "$(PG_VER)"), 0)
$(error Minimum version of PostgreSQL required is $(PG_VER_min) (but have $(PG_VER)))
endif

.PHONY: all
all: src/$(EXTENSION)--$(EXTVERSION).sql

# Assemble all .sql files under src/data into the extension SQL file in src/data
DATA_SQL := $(wildcard src/data/*.sql src/data/tables/*.sql)

src/$(EXTENSION)--$(EXTVERSION).sql: $(DATA_SQL)
	cat $^ > $@

# Declare the assembled file as DATA so packaging systems can find it
DATA = src/$(EXTENSION)--$(EXTVERSION).sql
EXTRA_CLEAN = src/$(EXTENSION)--$(EXTVERSION).sql

PGXS := $(shell $(PG_CONFIG) --pgxs)
include $(PGXS)
