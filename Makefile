.PHONY: all run textsrv

testsrv:
	screen -S testsrv -dm
#	screen -S testsrv -p 0 -X quit
	screen -S testsrv -p 0 -X screen
	screen -S testsrv -p 0 -X screen
	screen -S testsrv -p 0 -X stuff "./srv 10002"
	screen -S testsrv -p 1 -X stuff "./srv 10003"
#	screen -S testsrv -p 2 -X stuff "./srv 10002"
	screen -S testsrv -r &
	screen -S testsrv -p 0 -X select 0
	screen -S testsrv -p 0 -X split
	screen -S testsrv -p 0 -X split
	screen -S testsrv -p 0 -X focus
	screen -S testsrv -p 0 -X select 1
	screen -S testsrv -p 0 -X focus
	screen -S testsrv -p 0 -X select 2
all: run

run:
	node ./app.js 10001 127.0.0.1:10002:/healthcheck:OK 127.0.0.1:10003:/healthcheck:OK
