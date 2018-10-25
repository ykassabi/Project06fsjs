const request = require('request');
const cheerio = require('cheerio');
const fs = require('fs');
const Json2csvParser = require('json2csv').Parser;



///////////////////////////////////////////////
// creating a directory incase there is non
const dir = './data';
if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir);
}
///////////////////////////////////////////////
//get all the links of the products(shirts) and store it on arr
function grabingURLsShirtAsync() {
    // variable  for the target website. 
    const rootURL = 'http://www.shirts4mike.com/';
    const productShirtsURL = rootURL + 'shirts.php';

    return new Promise(function (resolve, reject) {
        request(productShirtsURL, function (error, response, html) {

            if (!error && response.statusCode === 200) { //making sure all is good and OK

                //Load the entire html code with cheerio library
                const $ = cheerio.load(html);

                let arrShirtsEndPoints = []; //to store shirts endPoints"shirt.php?id=108" 
                $('.products li').each(function () {
                    let shirt = $(this).find('a').attr('href');
                    arrShirtsEndPoints.push(shirt);
                }); // at this stage we grabed all the end points for all the 8 shirts

                let arrShirtsFullURL = arrShirtsEndPoints.map(function (endpoint) {
                    return rootURL + endpoint;
                }); //making the target urls.

                resolve(arrShirtsFullURL);
            } else {
                reject('Something went wrong, Can not connect to the URL. 404 Error');
            }
        });
    });
}
///////////////////////////////////////////////
//very similar to the function above grabingURLsShirtAsync
function shirtsDetailsAsync() { //to access detail on each shirt page.
    return grabingURLsShirtAsync().then(function (arrOfURLShirt) {

            //will grabe and store the details; title  price url and urlimage
            const promises = arrOfURLShirt.map(function (tshirtURL) {

                return new Promise(function (resolve, reject) {

                    request(tshirtURL, function (error, response, html) {
                        if (!error && response.statusCode === 200) {
                            let fullDateItem = new Date().toISOString();
                            let $ = cheerio.load(html); //cheerio load the html code 
                            //grabing the details; title , price, URL, imageURL
                            let productDetails = {
                                Title: $('.shirt-details h1').text().slice(4),
                                Price: $('.shirt-details h1 span').text(),
                                imageURL: $('.shirt-picture span img').attr('src'),
                                URL: tshirtURL,
                                Time: fullDateItem
                            };
                            resolve(productDetails)
                        } else {
                            reject(`Sorry, Not able to grabe none or all shirt's details `);
                        }
                    });
                });
            });
            return Promise.all(promises); // delivering all promises at one
        })
        .then(function (data) {
            const fields = ["Title", "Price", "imageURL", "URL", "Time"];
            const json2csvParser = new Json2csvParser({
                fields
            });

            const csv = json2csvParser.parse(data);
            console.log(csv)
            return csv;
        })
        .catch(function (err) {
            return Promise.reject(err);
        });
}
////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////
// 
function scraperFunction() {
    let fullDate = new Date().toISOString();
    let shortDate = fullDate.slice(0, 10);
    shirtsDetailsAsync()
        .then(data => {
            // writing error csv file to data folder
            fs.writeFile(`./data/${shortDate}.csv`, data, 'utf-8', err => {
                if (err) {
                    console.log(err.message);
                } else {
                    console.log('The file has been successfully saved!');
                }
            });
        })
        .catch(err => {
            let errData = `${fullDate} WE HAVE AN ERROR ${err} \r\n`;
            console.log(errData);
            //writing the error to log file, 
            fs.appendFile('scraper-error.log', errData, 'utf8', (err) => {
                if (err) throw err;
                console.log('Error Logged!');
            });
        })
}
// //////////////////////////////////////////////////////////////////////
//  Immediate invoking the function 
setImmediate(() => {
    scraperFunction();
})
///////////////////////////////////////////////
// one a day incoking the function
setInterval(() => {
    scraperFunction();
}, 20000) //one day;
// }, 86400000) //one day;
///////////////////////////////////////////////