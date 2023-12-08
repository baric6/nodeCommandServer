const express = require('express')
const firebaseAdmin = require('firebase-admin')
const schedule = require('node-schedule')

const PORT = 5345
const app = express()
const run = app.listen(PORT, ()=>{
    console.log('app is listening on port ' + PORT )
    writeToLogFile(`ips is listening on port: ${PORT}`)
})

const fs = require('fs');
const logFilePath = 'logs/ips.log';
function writeToLogFile(message) {
    const timestamp = new Date().toLocaleString();
    const logMessage = `${timestamp}: ${message}\n`;
  
    fs.appendFile(logFilePath, logMessage, (err) => {
      if (err) {
        console.error('Error writing to log file:', err);
        
      }
    });
}

async function listFilenamesInDirectory(username, repo, directoryPath) {
    const apiUrl = `https://api.github.com/repos/${username}/${repo}/contents/${directoryPath}`;

    try {
        const response = await fetch(apiUrl, {
            headers: {
                'Accept': 'application/vnd.github.v3+json', // Use the GitHub API version 3 header
            },
        });

        if (!response.ok) {
            throw new Error(`Failed to retrieve directory contents. Status: ${response.status}`);
        }

        const directoryContents = await response.json();

        const fileContentsObject = {};

        for (const item of directoryContents) {
            if (item.type === 'file') {
                try {
                    const rawUrl = `https://raw.githubusercontent.com/${username}/${repo}/main/${item.path}`;
                    const fileResponse = await fetch(rawUrl);

                    if (fileResponse.ok) {
                        const content = await fileResponse.text();

                        let cleanerFilename = item.name.replace(/\.txt$/i, '');
                        // Remove "ips" if it appears in the filename
                        cleanerFilename = cleanerFilename.replace(/ips/i, '');
                        // Trim any leading or trailing whitespace
                        cleanerFilename = cleanerFilename.trim();

                        fileContentsObject[cleanerFilename] = content.split('\n');

                    } else {
                        throw new Error(`Failed to download file. Status: ${fileResponse.status}`);
                    }
                } catch (error) {
                    writeToLogFile(error);
                }
            }
        }

        //console.log(fileContentsObject["Caldera C2"]);
        writeToLogFile('server2 IP data was able to be got');
        for (const key in fileContentsObject) {
            if (fileContentsObject.hasOwnProperty(key)) {
                const value = fileContentsObject[key];
                saveToFirebase(key, value);
            }
        }

    } catch (error) {
        console.error(error);
    }
}

var serviceAccount = require("<path to json firebase auth>");
firebaseAdmin.initializeApp({
    credential: firebaseAdmin.credential.cert(serviceAccount),
    databaseURL: "<enter firbase db link>"
});

// [cveID, description, publish date(array), url]
var saveToFirebase = ((malware, ips)=>{

    const currentDateTime = new Date();
    const options = { year: 'numeric', month: '2-digit', day: '2-digit' };
    const formattedDate = currentDateTime.toLocaleDateString('en-US', options).replace(/\//g, '-');
    const dateString = formattedDate.toString()

    var db = firebaseAdmin.database()
    var ref = db.ref("<path to database in firebase>").child(dateString);

    const cveRef = ref.child(malware);
    cveRef.set({
        malware: {
        malwareName: malware,
        malwareIPs: ips,
        }}, 
        function(error){
            if(error){
                writeToLogFile(error)
                writeToLogFile("broke at " + malware)
            }
            else{
                writeToLogFile(malware + " has been saved to firebase")
            }
        }    
    )    
})


const username = 'montysecurity';
const repo = 'C2-Tracker';
const directoryPath = 'data';

// 0 10 * * * every day at 10 am 
const job = schedule.scheduleJob('0 10 * * *', function(){   
    const currentDateTime = new Date().toLocaleString();
    writeToLogFile("Ran at: " + currentDateTime)
    listFilenamesInDirectory(username, repo, directoryPath);
    writeToLogFile('server2 ran on '+ currentDateTime);
})
