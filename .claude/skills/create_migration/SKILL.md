---
name: create_migration
description: Adds a database migration SQL file into the db/migrations folder. Usage: /add_migration <filename>
model: sonnet
---

When running this skill, the user may pass a filename as an argument (e.g. `/add_migration create_users_table`). Use that as the migration name if provided. If no filename is given, ask the user for one before proceeding.

* Add a new file with the `.sql` file extension into the db/migrations folder
* The file name is made up of two components:
    1. The serial number, which is a zero padded four digit number. The first migration file has a serial of 0001
    2. The name of the migration — use the argument passed by the user, or the name they provide when asked.
* The file name pattern is: {serial}__{filename}.sql
* If no files exist in the db/migrations folder, start with 0001 as the serial
* If files exist in the db/migrations folder, add 1 to the highest existing serial for the new file


Migration files content:

A new, "empty" migration file should create an SQL file with the code below:

```sql
--CREATE TABLE IF NOT EXISTS table_name
--(
--    id bigserial PRIMARY KEY,
--    name varchar(255),
--    created_at timestamp default NOW(),
--    updated_at timestamp default NOW()
--)
```
