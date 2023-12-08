const request = require('request')
const cheerio = require('cheerio')
const express = require('express')
const firebaseAdmin = require('firebase-admin')
const schedule = require('node-schedule')

const PORT = 5334
const app = express()
const run = app.listen(PORT, ()=>{
    console.log('app is listening on port ' + PORT )
    writeToLogFile(`cve server is up on port: ${PORT}`)
})

const fs = require('fs');
const logFilePath = 'logs/cve.log';
function writeToLogFile(message) {
    const timestamp = new Date().toLocaleString();
    const logMessage = `${timestamp}: ${message}\n`;
  
    fs.appendFile(logFilePath, logMessage, (err) => {
      if (err) {
        console.error('Error writing to log file:', err);
      }
    });
}

var getHtmldata = ((webpage) =>{

    request(webpage, (err, res, htmlData)=>{
        console.log(res.statusCode)
        if(!err && res.statusCode == 200){

            const $ = cheerio.load(htmlData);

            $('tr').slice(1).each((index, rowElement) => {
                // Create a new cheerio instance for the row
                const row = cheerio.load(rowElement);
            
                // Extract information from the current row based on the structure
                const cveID = row('a').text().trim();
                const description = row('p').text().trim();
                const getPublishedDate = row('strong:contains("Published:") + span').text();
                publishedDate = dateStandardize(getPublishedDate)
                const url = row('a').attr('href');
            
                // Output the extracted information for the current row
               
                // [cveID, description, publish date(array), url]
                saveToFirebase(cveID, description, publishedDate, url)

            });
            
        }
        else{
            console.log('errored out')
            writeToLogFile('Server1 errored out getting data');
        }
    })
})

var dateStandardize = (dateString) => {
    var dateStringSplit = dateString.split(';');
    dateStringSplit[1] = dateStringSplit[1].trim();
    return dateStringSplit
};

var serviceAccount = require("<path to json firebase auth>");
firebaseAdmin.initializeApp({
    credential: firebaseAdmin.credential.cert(serviceAccount),
    databaseURL: "<enter firbase db link>"
});

// [cveID, description, publish date(array), url]
var saveToFirebase = ((cve, dis, released, url)=>{
    var db = firebaseAdmin.database()
    var ref = db.ref("<path to database in firebase>");

    const cveRef = ref.child(cve);
    cveRef.set({
        cve: {
        cveName: cve,
        cveDis: dis,
        cveDate: released,
        cveUrl: url
        }}, 
        function(error){
            if(error){
                writeToLogFile(error)
                writeToLogFile("broke at " + cve)
            }
            else{
                writeToLogFile(cve + " has been saved to firebase")
            }
        }    
    )   
    

})

var scrape = () =>{
    // main // to get multi pages // 
    const baseURL = 'https://nvd.nist.gov/vuln/search/results';

    // Define the number of pages to fetch (e.g., 3 pages)
    const numPagesToFetch = 3;

    // Loop to fetch data from the first 3 pages
    for (let page = 1; page <= numPagesToFetch; page++) {
        // Create the URL for the current page
        const pageURL = `${baseURL}?isCpeNameSearch=false&results_type=overview&form_type=Basic&search_type=all&startIndex=${(page - 1) * 20}`;
        
        // Call the getHtmldata function to scrape data from the current page
        getHtmldata(pageURL);
    }
}

// run every 4 hours
const job = schedule.scheduleJob('* */4 * * *', function(){   
    const currentDateTime = new Date().toLocaleString();
    writeToLogFile("Ran at: " + currentDateTime)
    writeToLogFile('im still alive from server 1')
    scrape()
    writeToLogFile('server1 finished on ' + currentDateTime);
})


