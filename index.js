var https = require('https');
var htmlparser = require('htmlparser2');
var cheerio = require('cheerio');
//var http = require('http');
var express = require('express');
var cors = require('cors');
var app = express();
var scheduler = require('node-schedule');

var api_key = "gfdgf";//process.env.MAILGUN_API_KEY;
var domain = 'sandbox21dd732e255747b48e88245c204feda6.mailgun.org';
var mailgun = require('mailgun-js')({apiKey: api_key, domain: domain});

var siteNumber;
var tags = [];
var tagsCount = {};
var tagsWithCount = [];
var date = new Date();
var dateFormated = date.getFullYear() + "." + date.getMonth() + "." + date.getDate() + " " + date.getHours() + ":" + date.getMinutes();
var url = 'https://forum.portfolio.hu/topics/opus-global-nyrt/25754?limit=100';
var emaildata = {
  from: 'Excited User <me@samples.mailgun.org>',
  to: 'haromrozsa@gmail.com',
  subject: 'Hello',
  text: 'Testing some Mailgun awesomness!'
};

var parseToDate = function(dateString) {
	//var dateString = dateString.replace("é", "e");
	//console.log(dateString);
		//if (dateString == "pentek") {
		//	console.log("nana");
		//	}
		 var d = new Date(); // today!

		 var currentDayInt;
		 if (dateString.indexOf("tf")!= -1) { //hétfõ
			 	currentDayInt = 1;
		 } else if (dateString.indexOf("kedd")!= -1) { //
		 	currentDayInt = 2;
		} else if (dateString.indexOf("szerda")!= -1) { //szerda
		 	currentDayInt = 3;
		} else if (dateString.indexOf("cs")!= -1) { //csütörtök
		 	currentDayInt = 4;
		} else if (dateString.indexOf('ntek')!= -1) { //péntek
			 //console.log("nana");
		 	currentDayInt = 5;
		} else if (dateString.indexOf("szombat")!= -1) { //szombat
		 	currentDayInt = 6;
		} else if (dateString.indexOf("vas")!= -1) { //vasárnap
		 	currentDayInt = 0;
		} else if (dateString.indexOf("ma")!= -1) { //ma
 		 	return d.getFullYear() + "." + d.getMonth() + "." + d.getDate()
 		 } else  {
		 		return dateString;
		 }

		 //console.log(currentDayInt);
		 /*switch (dateString.trim()) {
	    case "hétfõ":
	        currentDayInt = 1;
	        break;
	    case "kedd":
	        currentDayInt = 2;
	        break;
	    case "szerda":
	        currentDayInt = 3;
	        break;
	    case "csütörtök":
	        currentDayInt = 4;
	        break;
	    case "péntek":
	//				console.log("hello");
	        currentDayInt = 5;
	        break;
	    case "szombat":
	        currentDayInt = 6;
	        break;
	    case "vasárnap":
	        currentDayInt = 0;
					break;
			default:
					return dateString;
			}*/

		 var dateDay = (currentDayInt - new Date().getDay()) < 0 ? (new Date().getDay() - currentDayInt) : (new Date().getDay() - currentDayInt + 7);
		 d.setDate(d.getDate() - dateDay);
		 //console.log(d.getFullYear() + "." + d.getMonth() + "." + d.getDate());
		 return d.getFullYear() + "." + d.getMonth() + "." + d.getDate();
};

var parseMonthToDate = function(dateString) {
		var splitted = dateString.split(" ");
		if (splitted.length == 2) {

				var monthInt;
				if (splitted[0].trim().indexOf("jan")!= -1) { //hétfõ
 				 	monthInt = 1;
 			 } else if (splitted[0].trim().indexOf("feb")!= -1) { //
 			 	monthInt = 2;
 			} else if (splitted[0].trim().indexOf("rciu")!= -1) { //szerda
 			 	monthInt = 3;
 			} else if (splitted[0].trim().indexOf("prilis")!= -1) { //csütörtök
 			 	monthInt = 4;
 			} else if (splitted[0].trim().indexOf('jus')!= -1) { //péntek
 				 //console.log("nana");
 			 	monthInt = 5;
 			} else if (splitted[0].trim().indexOf("nius")!= -1) { //szombat
 			 	monthInt = 6;
 			} else if (splitted[0].trim().indexOf("lius")!= -1) { //vasárnap
 			 	monthInt = 7;
 			} else if (splitted[0].trim().indexOf("augusz")!= -1) { //ma
 	 		 	monthInt = 8;
			} else if (splitted[0].trim().indexOf("szept")!= -1) { //ma
  	 		 	monthInt = 9;
  	  	} else if (splitted[0].trim().indexOf("okt")!= -1) { //ma
 	 		 	monthInt = 10;
			} else if (splitted[0].trim().indexOf("novem")!= -1) { //ma
  	 		 	monthInt = 11;
  	 	} else if (splitted[0].trim().indexOf("decem")!= -1) { //ma
	  	 		 	monthInt = 12;
	  	 } else  {
 			 		return dateString;
 			 }
				return new Date().getFullYear() + "." + monthInt + "." + splitted[1].trim();

		}
		return dateString;
};

var sendEmail = function(result) {
	    var dateNew = new Date();
	    emaildata.subject = 'Hello ' + dateNew.getFullYear() + "." + dateNew.getMonth() + "." + dateNew.getDate() + " " + dateNew.getHours() + ":" + dateNew.getMinutes();
		emaildata.text = result;
		mailgun.messages().send(emaildata, function (error, body) {
			console.log(body);
		});
};

var montlyJob = scheduler.scheduleJob('10 01 * * *', function() { //*/1 * * * *
 console.log('I am going to send an email on ' + dateFormated);

  https.get(url, function(response) {
	console.log("Loaded " + url);
	parseResponse(response);

  });

});

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
			//dateTextSplitted = dateText.split(",")[0].trim();
			//parseToDate(dateTextSplitted[0].trim());
			//console.log(dateText.split(",")[0].trim());
			//dateTextSplitted = parseToDate("péntek");
			dateTextSplitted = (parseToDate(dateText.split(",")[0].trim()));
		} else {
			dateTextSplitted = parseMonthToDate(dateText.split("|")[0].trim());
		}
		//console.log(dateTextSplitted[0]);
		if(tags.indexOf(dateTextSplitted) === -1) {
			tags.push(dateTextSplitted);
			tagsCount[dateTextSplitted] = 1;
		} else {
			tagsCount[dateTextSplitted]++;
		}
	  //fruits[i] = $(this).text();
	});

	if (siteNumber > 520) {
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
		sendEmail(result);
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

https.get(url, function(response) {
	console.log("Test loaded " + url);
	parseResponse(response);
});

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
