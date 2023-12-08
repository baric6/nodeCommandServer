const { spawn } = require('child_process');
const express = require('express');
const pm2 = require('pm2')
const path = require('path');

const app = express();

// Serve static files from the 'public' folder
app.use(express.static(path.join(__dirname, 'public')));

// Define a route to handle other requests
app.get('/', (req, res) => {
  res.send('This is the home page. Go to /page1.html for Page 1.');
});

// write to log file
const fs = require('fs');
const logFilePath = 'logs/app.log';

//utilities
function writeToLogFile(message) {
    const timestamp = new Date().toLocaleString();
    const logMessage = `${timestamp}: ${message}\n`;
  
    fs.appendFile(logFilePath, logMessage, (err) => {
      if (err) {
        console.error('Error writing to log file:', err);
      }
    });
}

function convertUnixTime(time){
  const date =  new Date(time)
  return date.toLocaleString()
} 
// end untilities
/////////////////////////////////////////////////////////////////////////////////////



servers = getserverfiles()

app.get('/action/:serverName/:command', async (req, res) => {
  const serverName = req.params.serverName;
  const command = req.params.command;
  const server = servers.find(s => s.name === serverName);

  if (!server) {
    return res.status(404).send('Server not found');
  }

  try {
    switch (command) {
      case 'start':
        pm2.start({
          script: server.script,
          args: [server.port.toString()],
          name: server.name,
        }, (err) => {
          if (err) {
            console.error(err);
            return res.status(500).send(`Error starting ${server.name}`);
          }
          writeToLogFile(`Started ${serverName} server. Custom message: Your server is up and running.`);
          res.status(200).send(`Started ${serverName} server. Custom message: Your server is up and running.`);
        });

        break;
      case 'kill':
        pm2.stop(serverName, (err) => {
          if (err) {
            console.error(err);
            return res.status(500).send(`Error stopping ${server.name}`);
          }
          writeToLogFile(`Started ${serverName} server. Custom message: Your server has been stoped.`);
          res.status(200).send(`Stopped ${serverName} server.`);
        });

        break;
      case 'restart':
        pm2.restart(serverName, (err) => {
          if (err) {
            console.error(err);
            return res.status(500).send(`Error restarting ${server.name}`);
          }
          writeToLogFile(`Started ${serverName} server. Custom message: Your server has restarted.`);
          res.status(200).send(`Restarted ${serverName} server.`);
        });
        break;
      default:
        writeToLogFile(`Started ${serverName} server. Custom message: Your server is up and running.`);
        res.status(400).send('Invalid command');
    }
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Internal Server Error');
  }
});

app.get('/clear/:appName', (req, res) => {
  const { appName } = req.params;
  
  pm2.connect((err) => {
      if (err) {
        console.error(err);
        res.status(500).json({ error: 'Error connecting to PM2' });
        return;
      }
  
      pm2.stop(appName, (stopErr) => {
        if (stopErr) {
          console.error(`Error stopping process: ${appName}`, stopErr);
          pm2.disconnect();
          res.status(500).json({ error: 'Error stopping PM2 process' });
          return;
        }
  
        pm2.delete(appName, (deleteErr) => {
          pm2.disconnect();
  
          if (deleteErr) {
            console.error(`Error deleting process: ${appName}`, deleteErr);
            res.status(500).json({ error: 'Error deleting PM2 process' });
            return;
          }
  
          res.json({ success: `Cleared errored process: ${appName}` });
        });
      });
  });
})

app.get('/moniter', async (req, res) => {
  try {
    const details = await getAllServerDetails();
    res.status(200).json(details);
  } catch (error) {
    console.error('Error retrieving server details:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Endpoint to monitor a specific server
app.get('/moniter/:serverName', async (req, res) => {
  try {
    const serverName = req.params.serverName;
    const details = await getSelectedServerDetails(serverName);
    res.status(200).json(details);
  } catch (error) {
    console.error('Error retrieving server details:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.get('/getBots', async (req, res) => {
  var servers = getserverfiles()
  res.status(200).json(servers);
})


app.get('/logs', (req, res) => {
  // Read the list of files in the folder
  fs.readdir('logs', (err, files) => {
    if (err) {
      return res.status(500).send('Error reading folder');
    }

    // Read content of each file and send to the client
    const fileContents = [];
    files.forEach((file) => {
      const filePath = path.join('logs', file);
      const content = fs.readFileSync(filePath, 'utf8');
      const splFileName = file.split('.')
      fileContents.push({ fileName: splFileName[0], content });
    });

    // Send the array of file contents as JSON to the client
    res.json(fileContents);
  });
});
// end endpoints
/////////////////////////////////////////////////////////////////////////////////////////////////////



// endpoint functions
// list out all server details
function getAllServerDetails() {
  return new Promise((resolve, reject) => {
    pm2.connect((error) => {
      if (error) {
        console.error('Error connecting to PM2:', error);
        reject(error);
        return;
      }
    
      pm2.list((listError, processList) => {
        if (listError) {
          console.error('Error getting process list:', listError);
          pm2.disconnect();
          reject(listError);
          return;
        }
    
        const details = processList.map((processInfo) => {
          return {
            serverName: processInfo.name,
            PID: processInfo.pid,
            CPUUsage: `${processInfo.monit.cpu}%`,
            MemoryUsage: `${processInfo.monit.memory / (1024 * 1024)} MB`,
            Status: processInfo.pm2_env.status,
            Uptime: convertUnixTime(processInfo.pm2_env.pm_uptime),
            Instances: processInfo.pm2_env.instances,
            UnstableRestarts: processInfo.pm2_env.unstable_restarts,
          };
        });

        //console.log('Resolving details:', details);
        pm2.disconnect();
        resolve(details);
      });
    });
  });
}

// Function to get details of a specific server
async function getSelectedServerDetails(serverName) {
  return new Promise((resolve, reject) => {
    pm2.connect((error) => {
      if (error) {
        console.error('Error connecting to PM2:', error);
        reject(error);
        return;
      }
  
      pm2.list((listError, processList) => {
        if (listError) {
          console.error('Error getting process list:', listError);
          pm2.disconnect();
          reject(listError);
          return;
        }
  
        const targetProcess = processList.find((processInfo) => processInfo.name === serverName);
  
        if (targetProcess) {
          const details = {
            serverName: targetProcess.name,
            PID: targetProcess.pid,
            CPUUsage: `${targetProcess.monit.cpu}%`,
            MemoryUsage: `${targetProcess.monit.memory / (1024 * 1024)} MB`,
            Status: targetProcess.pm2_env.status,
            Uptime: convertUnixTime(targetProcess.pm2_env.pm_uptime),
            Instances: targetProcess.pm2_env.instances,
            UnstableRestarts: targetProcess.pm2_env.unstable_restarts,
          };
  
          console.log('Resolving details:', details);
          pm2.disconnect();
          resolve(details);
        } else {
          console.log(`Server '${serverName}' not found.`);
          pm2.disconnect();
          reject({ error: `Server '${serverName}' not found.` });
        }
      });
    });
  });
}


function getserverfiles(){
  const folderPath = 'bots'; // Replace this with the actual folder path

  // Read files in the folder and filter only .js files
  const jsFiles = fs.readdirSync(folderPath).filter(file => file.endsWith('.js'));

    // Define the array of server information
  const servers = jsFiles.map((file, index) => ({
      name: path.basename(file, '.js'),
      script: `bots/${file}`,
      port: 5334 + index, // Incrementing the port by one for each new file
  }));
    return servers;
}

// end enpoint functions
/////////////////////////////////////////////////////////////////////////////////////////////////////////


// control server listen on port 3000
app.listen(3000, () => {
  console.log('Controller server is running on port 3000');
});


// main
const os = require('os')
const networkInterfaces = os.networkInterfaces();

// Print IP addresses for all network interfaces
for (const interfaceName of Object.keys(networkInterfaces)) {
    const interfaceInfo = networkInterfaces[interfaceName];
    for (const info of interfaceInfo) {
        if (info.family === 'IPv4') {
        console.log(`Interface: ${interfaceName}, IP Address: ${info.address}`);
        }
    }
}

// end main