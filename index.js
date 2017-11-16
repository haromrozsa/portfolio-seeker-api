var https = require('https');
var htmlparser = require('htmlparser2');
var cheerio = require('cheerio');
//var http = require('http');
var express = require('express');
var cors = require('cors');
var app = express();

var url = 'https://forum.portfolio.hu/topics/opus-global-nyrt/25754?limit=100'
//var url = 'https://forum.portfolio.hu/topics/opus-global-nyrt/25754?oldal=453&limit=100'


https.get(url, function(response) {
  console.log("Loaded " + url);
  //parseResponse(response);
})
var siteNumber;
var tags = [];
var tagsCount = {};
var tagsWithCount = [];
var parseResponse = function(response) {
  var data = "";
  response.on('data', function(chunk) {
    data += chunk;
  });

  response.on('end', function(chunk) {
	//console.log(data);
	$ = cheerio.load(data);
	if (!siteNumber) {
		var siteHref = $('ul li[class=""] a').first().attr('href');
		//console.log(siteHref); //eq(3).children().text());

		siteNumber = siteHref.split('?').pop().split('&').shift().split('=').pop();
		//console.log(siteNumber);	
	} else  {
		siteNumber--;
	}
	
	//$('div .date').each(function(i, elem) {
	$('div .upRow').children('div .date').each(function(i, elem) {
		var dateText = $(this).text();
		var dateTextSplitted;// = dateText.split(",");
		if (dateText.indexOf(",") != -1) { 
			dateTextSplitted = dateText.split(",");
		} else {
			dateTextSplitted = dateText.split("|");
		}
		//console.log(dateTextSplitted[0]);
		if(tags.indexOf(dateTextSplitted[0].trim()) === -1) {
			tags.push(dateTextSplitted[0].trim());
			tagsCount[dateTextSplitted[0].trim()] = 1;
		} else {
			tagsCount[dateTextSplitted[0].trim()]++;
		}
	  //fruits[i] = $(this).text();
	});
	
	if (siteNumber > 0) {
		//console.log(siteNumber);
		var newUrl = url + "&oldal=" + siteNumber;
		console.log(newUrl);
		https.get(newUrl, function(response) {
			parseResponse(response);
		})
	} else {
		//var myJsonString = JSON.stringify(yourArray);
		//console.log($('div .date').length); 
		for(var i = 0; i < tags.length;i++) {
			tagsWithCount.push({date:tags[i], count:tagsCount[tags[i]]});
		}
		//var result = tagsWithCount;
		var result = JSON.stringify(tagsWithCount);
	    //console.log(tagsWithCount[0].count);
		console.log(result); 
		
		/*var obj = JSON.parse(result);
		var objdates = [];
		var objcounter = [];
		for(var i = 0; i < obj.length;i++) {
			objcounter.push(obj[i].count);
			objdates.push(obj[i].date);
		}
		console.log(objdates);
		console.log(objcounter);*/
	}

		//console.log($('div .date').length);   
		//console.log(tagsCount); 
  });
}

 
app.get('/opus', cors(), function (req, res, next) {
  console.log("Request arrived");
  res.json(JSON.stringify(tagsWithCount));
  //res.json({msg: 'This is CORS-enabled for a Single Route'})
});
 
app.listen(8081, function () {
  console.log('CORS-enabled web server listening on port 8081')
});
/*http.createServer(function (request, response) {
   // Send the HTTP header 
   // HTTP Status: 200 : OK
   // Content Type: text/plain
   console.log("Request arrived");
   response.writeHead(200, {'Content-Type': 'application/json'});
   
   // Send the response body as "Hello World"
   response.end(JSON.stringify(tagsWithCount));
}).listen(8081);*/

// Console will print the message
//console.log('Server running at http://127.0.0.1:8081/');

