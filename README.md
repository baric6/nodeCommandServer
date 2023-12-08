# Node Bot Command Server
This a node server that spins up child servers using PM2

What i was trying to solve is having my desktop with multiple shells up and having to go back and forth 
starting stopping the servers

The servers write to their own log file and you can see what each bot is doing

               ----------------
               |control server|
               ---------------- 
                /      |      \
               /       |       \
              /        |        \
        ---------   ---------   ---------
        |server1|   |server2|   |server3| 
        ---------   ---------   ---------

![Example Image](https://github.com/baric6/nodeCommandServer/blob/main/screenshot.png)


## How it works
- Write a bot in node or any node project works, best if it is one file
- Put the bot in the bot folder
- The UI should see the new file added
- Click on bot and it should run and populate the UI with server details and control buttons
