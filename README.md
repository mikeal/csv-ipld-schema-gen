# csv-ipld-schema-gen

Generate an IPLD Schema template from CSV data

## CLI

```
csv-ipld-schema-gen [files..]

Generate IPLD Struct from source csv files

Options:
  --help     Show help                                                 [boolean]
  --version  Show version number                                       [boolean]
```

The resulting IPLD Schema will give you a Struct for every csv file.

The schema should be considered a base template. You will still want to read and edit it
as the script leans more towards reserving the original names rather than producing
100% valid IPLD Schema.

* The struct name will be the filename with dots replaced with `_`. These should
  be edited to conform with the standard camelCase style.
* Values are parsed and simple types are inferred: string, int, float.
* If any values have a string as well as other types they will be typed as "string"
  in order to avoid aggressive parsing errors.
* If a field has instances of `null` the field will be `nullable`.
* If a filed has instances where it is empty the field will be `optional`.
* If a field name contains `(*string*)` it will be parsed as a list value.
  * If all the values found in the field are the same type the schema will contain
    a typed list definition which the field will be typed as.
  * If the values in the field vary in type it will generate a kinded union for 
    all the observed types.
  * The field, union, and list names will all be the original string (w/ `(*string*)` intact)
    so this won't actually be a valid parsable schema. 
