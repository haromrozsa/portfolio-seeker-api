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

var parseResponse = function(response, callback) {
  var data = "";
  response.on('data', function(chunk) {
    data += chunk;
  });
  response.on('end', function(chunk) {
		$ = cheerio.load(data);
		if (!siteNumber) {
			var siteHref = $('ul li[class=""] a').first().attr('href');
			siteNumber = siteHref.split('?').pop().split('&').shift().split('=').pop();
		} else  {
			siteNumber--;
		}

		$('div .upRow').children('div .date').each(function(i, elem) {
			var dateText = $(this).text();
			var dateTextSplitted;
			if (dateText.indexOf(",") != -1) {
				dateTextSplitted = (parseToDate(dateText.split(",")[0].trim()));
			} else {
				dateTextSplitted = parseMonthToDate(dateText.split("|")[0].trim());
			}
			if(tags.indexOf(dateTextSplitted) === -1) {
				tags.push(dateTextSplitted);
				tagsCount[dateTextSplitted] = 1;
			} else {
				tagsCount[dateTextSplitted]++;
			}
		});

		if (siteNumber > 557) {
			var newUrl = url + "&oldal=" + siteNumber;
			console.log(newUrl);
			https.get(newUrl, function(response) {
				parseResponse(response, callback);
			})
		} else {
			for(var i = 0; i < tags.length;i++) {
				tagsWithCount.push({date:tags[i], count:tagsCount[tags[i]]});
			}
			var result = JSON.stringify(tagsWithCount);
			console.log(result);
			callback();
			//sendEmail(result);
		}
  });
}

//https.get(url, function(response) {
	//console.log("Test loaded " + url);
	//parseResponse(response);
//});

app.get('/init', cors(), function (req, res, next) {
  console.log("Request arrived");
	https.get(url, function(response) {
		console.log("Test page loaded " + url);
		parseResponse(response, function() {
			res.json(JSON.stringify(tagsWithCount));
		});
	});
});

app.get('/data', cors(), function (req, res, next) {
  console.log("Start sending data back");
  res.json(JSON.stringify(tagsWithCount));
});

app.get('/', cors(), function (req, res, next) {
  console.log("Wake up request arrived");
  res.json('Wake up request arrived and returned');
});

app.get('/email', cors(), function (req, res, next) {
  console.log("Start sending email");
	sendEmail(JSON.stringify(tagsWithCount));
  res.json('Email with processed data sent');
});

const port = process.env.PORT || 8081;
app.listen(port, function () {
  console.log('CORS-enabled web server listening, date: ' + dateFormated);
});
