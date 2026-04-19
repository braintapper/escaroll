---
paths:
  - "**/.ignore"
  - "**/.keep"
---

# Ignoring a folder tree when scanning code

When encountering a file named `.ignore` during scanning, ignore the contents of the containing folder AND all subfolders.

In other words, don't include in any analysis or modifications on anything in a folder containing an `.ignore` file.


# Folders that shouldn't be deleted

When encountering a file named `.keep` during scanning, don't ever delete any files or folders in the containing folder. If trying to delete this folder, throw a warning and tell the user to delete this folder manually instead.
