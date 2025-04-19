PostgREST is a standalone web server which turns a PostgreSQL database into a RESTful API. It serves an API that is customized based on the structure of the underlying database.

To make an API we’ll simply be building a database. All the endpoints and permissions come from database objects like tables, views, roles, and functions. These tutorials will cover a number of common scenarios and how to model them in the database.

In order to set up the postgrest API server, a working postgreSQL server shall be avaliable, and the correct db-uri shall be set in the postgrest.conf.

Install the PostgREST, details please refer to [PostgREST Docs](https://postgrest.org/en/v12/)

Then run the server via:

```bash
cd backend
postgrest postgrest.conf
```
