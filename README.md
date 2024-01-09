# prusa-mqtt

NodeJS Daemon to fetch info about prusa printer and publish it to mqtt

Supports multiple printers

# Message

Format:

```
 {“Printer”:string, “Job”:string, “Elapsed_time_s”:int64, “Progress_percent”:int} 
```
