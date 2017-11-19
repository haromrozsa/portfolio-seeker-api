var https = require('https');
var htmlparser = require('htmlparser2');
var cheerio = require('cheerio');
//var http = require('http');
var express = require('express');
var cors = require('cors');
var app = express();
var scheduler = require('node-schedule');
const mongoose = require('mongoose');
var Forum = require('./models/forum');

//DB Setup
const connectURL = process.env.MONGODB_URI || 'mongodb://localhost:auth/auth';
mongoose.connect(connectURL);

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

var getYesterdayString = function(dateString) {
	//console.log("yesterday");
	switch (new Date().getDay()) {
	 case 0:
			 return "szombat";
	 case 1:
			 return "vas";
	 case 2:
			 return "tf";
	 case 3:
			 return "kedd";
	 case 4:
			 return "szerda";
	 case 5:
			 return "cs";
	 case 6:
			 return "ntek";
	 }
};

var parseToDate = function(dateString, isInit) {
	//var dateString = dateString.replace("é", "e");
	//console.log(dateString);
		//if (dateString == "pentek") {
		//	console.log("nana");
		//	}
		 //var yesterday = getYesterdayString();
		 //console.log(yesterday);

		 if (!isInit && dateString.indexOf(getYesterdayString())!= -1) {
			 //tegnapi nap: feldolgozas
			  //console.log("mivan");
		 		return "tegnap";
		 }
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
 		 	 //return d.getFullYear() + "." + d.getMonth() + "." + d.getDate();
				return "ma";
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

var parseResponse = function(response, isInit, callback) {
  var data = "";
	var isToday;
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
				dateTextSplitted = parseToDate(dateText.split(",")[0].trim(), isInit);
			} else {
				dateTextSplitted = parseMonthToDate(dateText.split("|")[0].trim());
			}
			isToday = dateTextSplitted.indexOf("ma") != -1;
			isYesterday = dateTextSplitted.indexOf("tegnap") != -1;
			//if (isToday && exclusiveToday) {
			//console.log(dateTextSplitted + " " + isYesterday);
			//}	else
			if(tags.indexOf(dateTextSplitted) === -1) {
				//if (isToday && isInit) {
				if (isToday) {
					//refactor: 1 else if
				} else {
					tags.push(dateTextSplitted);
					tagsCount[dateTextSplitted] = 1;
				}
			} else {
				tagsCount[dateTextSplitted]++;
			}
		});
//console.log(siteNumber > 555);
//console.log((isInit || isYesterday));
		if (siteNumber > 0 && (isInit || isYesterday)) {
			var newUrl = url + "&oldal=" + siteNumber;
			console.log(newUrl);
			https.get(newUrl, function(response) {
				parseResponse(response, isInit, callback);
			})
		} else {
			if (!isInit) {
				//tagsWithCount.push({date:tags[0], count:tagsCount[tags[0]]});

			} else {
				for(var i = 0; i < tags.length;i++) {
					tagsWithCount.push({date:tags[i], count:tagsCount[tags[i]]});
				}
				console.log(JSON.stringify(tagsWithCount));
			}
			//var result = JSON.stringify(tagsWithCount);
			//console.log(result);
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
	Forum.find({ name: url }).exec(function(err, dbForum) {
			if (err) {
				res.json(JSON.stringify("Error by read from DB"));
			}
			//console.log(dbForum);
			if (dbForum && dbForum[0]) {
				console.log("Already initalized " + url);
				res.json(dbForum[0].data);
			} else {
				tags = [];
				tagsCount = {};
				tagsWithCount = [];
				siteNumber = undefined;
				https.get(url, function(response) {
					console.log("Test page loaded " + url);
					parseResponse(response, true, function() {
						var forum = new Forum();
						forum.name = url;
						forum.data = JSON.stringify(tagsWithCount);
						forum.date = new Date();
						forum.updated = false;
						forum.save(function (err) {
						  if (err) return handleError(err);
						  // saved!
						});
						res.json(JSON.stringify(tagsWithCount));
					});
				});
			}
		});
});

app.get('/data', cors(), function (req, res, next) {
  console.log("Start sending data back");
	Forum.findOne({ name: url }).exec(function(err, dbForum) {
			if (err) {
				res.json(JSON.stringify("Error by read data from DB"));
			}
			//console.log(dbForum);
			if (!dbForum) {
				res.json(JSON.stringify(new Array()));
			} else {
				res.json(dbForum.data);
			}
		});
});

app.get('/', cors(), function (req, res, next) {
  console.log("Wake up request arrived");
  res.json('Wake up request arrived and returned');
});

app.get('/email', cors(), function (req, res, next) {
  console.log("Start sending email");
	Forum.findOne({ name: url }).exec(function(err, dbForum) {
			if (err) {
				res.json(JSON.stringify("Error by read email from DB"));
			}
			//console.log(dbForum);
			if (!dbForum) {
				sendEmail(JSON.stringify("Forum not initalized yet"));
			  res.json('Email with null data sent');
			} else {
				sendEmail(dbForum.data);
			  res.json('Email with processed data sent');
			}
		});
});

app.get('/batch', cors(), function (req, res, next) {
  console.log("Start processing new data");
	tags = [];
	tagsCount = {};
	siteNumber = undefined;
	var tagsWithCountAndToday = [];
	Forum.findOne({ name: url }).exec(function(err, dbForum) {
			if (err) {
				res.json(JSON.stringify("Error by read batch from DB"));
			}
			//console.log(dbForum);
			if (!dbForum) {
				console.log("Not initalized yet " + url);
				res.json(JSON.stringify("Please initalize forum first"));
			} else if (dbForum.updated) {
				console.log("Already updated " + url);
				res.json(dbForum.data);
			} else {
				https.get(url, function(response) {
					console.log("Test page for batch loaded " + url);
					parseResponse(response, false, function() {
						//tagsWithCountAndToday.push({date:tags[0], count:tagsCount[tags[0]]});
						var tagsWithCountAndToday = JSON.parse(dbForum.data);
						//tagsWithCountAndToday.unshift({date:tags[0], count:tagsCount[tags[0]]});
						tagsWithCountAndToday.unshift({date:date.getFullYear() + "." + date.getMonth() + "." + (date.getDate()-1), count:tagsCount[tags[0]]});
						//tagsWithCountAndToday.push(JSON.parse(dbForum[0].data));
						//res.json(JSON.stringify(tagsWithCountAndToday));
						dbForum.data = JSON.stringify(tagsWithCountAndToday);
						dbForum.date = new Date();
						dbForum.updated = true;
						//dbForum.save();
						dbForum.save(function (err) {
						  if (err) return handleError(err);
						  // saved!
							console.log("Data updated " + url);
							sendEmail(JSON.stringify(tagsWithCountAndToday));
							res.json(JSON.stringify(tagsWithCountAndToday));
						});
					});
				});
			}
	});
});

const port = process.env.PORT || 8081;
app.listen(port, function () {
  console.log('CORS-enabled web server listening, date: ' + dateFormated);
});
