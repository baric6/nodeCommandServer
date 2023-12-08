// alert('this is from js')
// app.js

async function getServerInfo(){
  const response = await fetch('http://localhost:3000/moniter');
  return await response.json();
  
}

async function getLogs(){
  const response = await fetch('http://localhost:3000/logs');
  return await response.json();
}


async function setServerInfo(){
  var data = await getServerInfo()
  const container = document.getElementById('serverUseage');
  container.innerHTML = '';
  data.forEach((item, index) => {
    // Create a div for each server entry
    const serverElement = document.createElement('div');
    serverElement.className = 'serverEntry';

    // Add server information to the element
    serverElement.innerHTML = `
      <div>Server Name: ${item.serverName}</div>
      <div>CPU Usage: ${item.CPUUsage}</div>
      <div>Memory Usage: ${item.MemoryUsage}</div>
      <div>------------------------------</div>
    `;

    // Append the server element to the container
    container.appendChild(serverElement);
  });
}



async function fetchData() {
    try {
      var data = await getServerInfo()
      var logs  = await getLogs()
      // Clear the existing content
      const resultList = document.getElementById('allServerThreads');
      resultList.innerHTML = '';
  
      // Iterate through the data and create a card for each item
      data.forEach((item, index) => {
        const cardContainer = document.createElement('div');
        cardContainer.classList.add('card-container');

        const card = document.createElement('div');
        card.classList.add('card');
  
        const cardContent = document.createElement('div');
        cardContent.classList.add('card-content'); // Add the card-content class
        // Set the inner HTML with placeholders for server status and uptime
        cardContent.innerHTML = `${item.serverName}
        <div class="server-status">${item.Status}</div> server Started:
        <span class="server-uptime">${item.Uptime}</span>
        `;

        const cardTextArea = document.createElement(`div`)
        cardTextArea.classList.add('cardtextarea'); 

        // Filter logs that match the current server name
        const matchingLogs = logs.filter(log => log.fileName === item.serverName);

        // Output logs to the textarea for the current server
        matchingLogs.forEach((log, index) => {
          cardTextArea.innerHTML += `filename: ${log.fileName}\n${log.content} 

          `;
        });

        // You can add more details to the card if needed
        // const additionalDetails = document.createElement('p');
        // additionalDetails.textContent = `Additional Info: ${item.someOtherProperty}`;
        // Button creation
        const startButton = document.createElement('button');
        startButton.textContent = 'start';
        startButton.addEventListener('click', async () => {
            console.log('start')
            console.log(item.serverName)
            try {
                // Replace 'https://api.example.com/data' with the actual API endpoint
                const response = await fetch(`http://localhost:3000/action/${item.serverName}/start`);
                
                // Check if the request was successful (status code 200-299)
                if (!response.ok) {
                  throw new Error(`HTTP error! Status: ${response.status}`);
                }
            
              } catch (error) {
                console.error('Error fetching data:', error.message);
              }
              location.reload();
        });

        const restartButton = document.createElement('button');
        restartButton.textContent = 'restart';
        restartButton.addEventListener('click', async() => {
            console.log('restart')
            try {
                // Replace 'https://api.example.com/data' with the actual API endpoint
                const response = await fetch(`http://localhost:3000/action/${item.serverName}/restart`);
                
                // Check if the request was successful (status code 200-299)
                if (!response.ok) {
                  throw new Error(`HTTP error! Status: ${response.status}`);
                }
            
              } catch (error) {
                console.error('Error fetching data:', error.message);
              }
              location.reload();
        });

        const clearButton = document.createElement('button');
        clearButton.textContent = 'remove';
        clearButton.addEventListener('click', async() => {
            console.log('restart')
            try {
                // Replace 'https://api.example.com/data' with the actual API endpoint
                const response = await fetch(`http://localhost:3000/clear/${item.serverName}`);
                
                // Check if the request was successful (status code 200-299)
                if (!response.ok) {
                  throw new Error(`HTTP error! Status: ${response.status}`);
                }
            
              } catch (error) {
                console.error('Error fetching data:', error.message);
              }
              location.reload();
        });

        const stopButton = document.createElement('button');
        stopButton.textContent = 'stop';
        stopButton.addEventListener('click', async() => {
            console.log('stop')
            try {
                const response = await fetch(`http://localhost:3000/action/${item.serverName}/kill`);
                
                if (!response.ok) {
                  throw new Error(`HTTP error! Status: ${response.status}`);
                }
        
            } catch (error) {
                console.error('Error fetching data:', error.message);
            }
            location.reload();
        });

        cardContainer.appendChild(card);
        card.appendChild(startButton);
        card.appendChild(restartButton);
        card.appendChild(stopButton);
        card.appendChild(clearButton);
        card.appendChild(cardContent);
        card.appendChild(cardTextArea)
        
        
  
        resultList.appendChild(card);
      });
    } catch (error) {
      console.error('Error fetching data:', error);
      document.getElementById('allServerThreads').innerHTML = '<div class="card">Error fetching data.</div>';
    }
}

var refresh = document.getElementById('refresh');
var nameList = document.getElementById('nameList');

refresh.addEventListener('click', async () => {
  listFileNames()
});

document.addEventListener('DOMContentLoaded', async () => {
  listFileNames()
});

async function listFileNames(){
  try {
  
    // Replace 'http://localhost:3000/getBots' with the actual API endpoint
    const response = await fetch('http://localhost:3000/getBots');
  
    // Check if the request was successful (status code 200-299)
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
  
    // Parse the JSON response
    const data = await response.json();
  
    // Clear existing content in the nameList
    nameList.innerHTML = '';
  
    // Create a list of names and append it to the nameList element
    const names = data.map(item => item.name);
    names.forEach(name => {
      const listItem = document.createElement('div');
      listItem.className = 'fileCard';
      listItem.textContent = name;
  
      // Add a click event listener to each list item
      listItem.addEventListener('click', async () => {
        console.log(`You clicked ${name}`); // Log the clicked name
  
        /////////////////////////////////////////////////////////////
        switch (name) {
          case 'cve':
            // Add your logic for the 'start' case
            console.log('Starting...cve');
            try {
              const response = await fetch(`http://localhost:3000/action/${name}/start`);
              
              if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
              }
      
            } catch (error) {
                console.error('Error fetching data:', error.message);
            }

            location.reload();
    
            break;

          case 'exploit':
            // Add your logic for the 'start' case
            console.log('Starting...exploit');
            try {
              const response = await fetch(`http://localhost:3000/action/${name}/start`);
              
              if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
              }
      
            } catch (error) {
                console.error('Error fetching data:', error.message);
            }

            location.reload();

            break;

          case 'ips':
            // Add your logic for the 'restart' case
            // Add your logic for the 'start' case
            console.log('Starting...ips');
            try {
              const response = await fetch(`http://localhost:3000/action/${name}/start`);
              
              if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
              }
      
            } catch (error) {
                console.error('Error fetching data:', error.message);
            }

            location.reload();

            break;
        }
      });
  
      nameList.appendChild(listItem);
    });
  
  } catch (error) {
    console.error('Error fetching data:', error.message);
    // Handle the error, show an error message, etc.
  }
}


fetchData()
// this runs every second 
// not liking this running like this hackish
// call api a billion times
// Get a reference to the checkbox element
var myCheckbox = document.getElementById('myCheckbox');
// Add an event listener to the checkbox for the 'change' event
var fetchInterval
myCheckbox.addEventListener('change', function() {
  // Check the current state of the checkbox
  if (myCheckbox.checked) {
    console.log('Checkbox is checked');
    // Perform actions when the checkbox is checked
    fetchInterval = setInterval(setServerInfo, 1000);
  } else {
    console.log('Checkbox is unchecked');
    // Perform actions when the checkbox is unchecked
    clearInterval(fetchInterval);
  }
});
//const fetchInterval = setInterval(setServerInfo, 1000);
