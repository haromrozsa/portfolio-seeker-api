var https = require('https');
var htmlparser = require('htmlparser2');
var cheerio = require('cheerio');
//var http = require('http');
var express = require('express');
var cors = require('cors');
var app = express();
var scheduler = require('node-schedule');
var api_key = process.env.MAILGUN_API_KEY;
var domain = 'sandbox21dd732e255747b48e88245c204feda6.mailgun.org';
var mailgun = require('mailgun-js')({apiKey: api_key, domain: domain});

var url = 'https://forum.portfolio.hu/topics/opus-global-nyrt/25754?limit=100'
//var url = 'https://forum.portfolio.hu/topics/opus-global-nyrt/25754?oldal=453&limit=100'


var date = new Date();
var dateFormated = date.getFullYear() + "." + date.getMonth() + "." + date.getDate() + " " + date.getHours() + ":" + date.getMinutes();
var montlyJob = scheduler.scheduleJob('48 20 * * *', function() { //*/1 * * * *
 console.log('I am going to send an email on ' + dateFormated);

  https.get(url, function(response) {
	console.log("Loaded " + url);
	parseResponse(response, function(result) {
	    var dateNew = new Date();
	    emaildata.subject = 'Hello ' + dateNew.getFullYear() + "." + dateNew.getMonth() + "." + dateNew.getDate() + " " + dateNew.getHours() + ":" + dateNew.getMinutes();
		emaildata.text = result;
		mailgun.messages().send(emaildata, function (error, body) {
			console.log(body);
		});
	});

  });

});


var siteNumber;
var tags = [];
var tagsCount = {};
var tagsWithCount = [];
var parseResponse = function(response, callback) {
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
		callback(result);
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

app.get('/', cors(), function (req, res, next) {
  console.log("Request arrived OK");
  //var dateNew = new Date();
  //emaildata.subject = 'Hello ' + dateNew.getFullYear() + "." + dateNew.getMonth() + "." + dateNew.getDate() + " " + dateNew.getHours() + ":" + dateNew.getMinutes();
  //mailgun.messages().send(emaildata, function (error, body) {
  //	  console.log(body);
  //});  
  res.json('Request arrived OK');
});

var emaildata = {
  from: 'Excited User <me@samples.mailgun.org>',
  to: 'haromrozsa@gmail.com',
  subject: 'Hello',
  text: 'Testing some Mailgun awesomness!'
};

app.get('/email', cors(), function (req, res, next) {
  console.log("Start sending email");
	mailgun.messages().send(emaildata, function (error, body) {
	  console.log(body);
	});
  res.json('Email sent');
});
 
const port = process.env.PORT || 8081; 
app.listen(port, function () {
  console.log('CORS-enabled web server listening, date: ' + dateFormated);
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

