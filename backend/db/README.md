we use dbmate for database migrations. details please refer to the [dbmate documentation](https://github.com/amacneil/dbmate).
## Installation

**Linux**

Install the binary directly:

```sh
sudo curl -fsSL -o /usr/local/bin/dbmate https://github.com/amacneil/dbmate/releases/latest/download/dbmate-linux-amd64
sudo chmod +x /usr/local/bin/dbmate
/usr/local/bin/dbmate --help
```

## Commands

```sh
dbmate --help    # print usage help
dbmate new       # generate a new migration file
dbmate up        # create the database (if it does not already exist) and run any pending migrations
dbmate create    # create the database
dbmate drop      # drop the database
dbmate migrate   # run any pending migrations
dbmate rollback  # roll back the most recent migration
dbmate down      # alias for rollback
dbmate status    # show the status of all migrations (supports --exit-code and --quiet)
dbmate dump      # write the database schema.sql file
dbmate load      # load schema.sql file to the database
dbmate wait      # wait for the database server to become available
```
