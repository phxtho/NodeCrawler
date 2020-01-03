let request = require('request');
let cheerio = require('cheerio');
let URL = require('url-parse');

const START_URL = "https://news.ycombinator.com/";
const SEARCH_WORD = "AI";
const MAX_PAGES_TO_VISIT = 10;

let pagesVisited = new Set();
let numPagesVisited = 0;
let pagesToVisit = [];

// Parse the starting url
let url = new URL(START_URL);
let baseUrl = url.protocol + "//" + url.hostname;


pagesToVisit.push(START_URL);

crawl();

function crawl(){
    if(numPagesVisited >= MAX_PAGES_TO_VISIT) {
        console.log("Reached max limit of number of pages to visit.");
        return;
    }

    let nextPage = pagesToVisit.pop();
    if(nextPage in pagesVisited) {
        // Already visitied the page, crawl again
        crawl();
    } else {
        // New page
        visitPage(nextPage, crawl);
    }
}

function visitPage (url, callback){
    // Add page to our set
    pagesVisited[url] = true;
    numPagesVisited++;

    // Make the request
    console.log("Visiting page " + url);
    request(url, (err, resp, body) => {
        
        // Check status code (200 is HTTP OK)
        console.log("Status code: " + resp.statusCode);
        if(resp.statusCode !== 200) {
          callback();
          return;
        }
        
        // Parse the document body
        var $ = cheerio.load(body);
        var isWordFound = searchForWord($, SEARCH_WORD);
        if(isWordFound) {
          console.log('Word ' + SEARCH_WORD + ' found at page ' + url);
        } else {
          collectInternalLinks($);
          
          callback();
        }
    });
}

function searchForWord($, word){
    var bodyText = $('html > body').text();
    if(bodyText.toLowerCase().indexOf(word.toLowerCase()) !== -1) {
      return true;
    }
    return false;
}

function collectInternalLinks($){
    let relativeLinks = $("a[href^='/']");
    console.log("Found " + relativeLinks.length + " relative links on page");
    relativeLinks.each(function(){
        pagesToVisit.push(baseUrl + $(this).attr('href'));
    })
}
