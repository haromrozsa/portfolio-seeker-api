var https = require('https');
var htmlparser = require('htmlparser2');
var cheerio = require('cheerio');
var express = require('express');
var cors = require('cors');
var app = express();
const mongoose = require('mongoose');
var Forum = require('./models/forum');

//DB Setup
const connectURL = process.env.MONGODB_URI || 'mongodb://localhost:auth/auth';
mongoose.connect(connectURL);

//MAIL
var api_key = process.env.MAILGUN_API_KEY || "local_email_key";
var domain = 'sandbox21dd732e255747b48e88245c204feda6.mailgun.org';
var mailgun = require('mailgun-js')({apiKey: api_key, domain: domain});

var siteNumber;
var tags = [];
var tagsCount = {};
var tagsWithCount = [];
var url;

var emaildata = {
  from: 'Portfolio Analyzer <portfolio@analyzer.mailgun.org>',
  to: 'haromrozsa@gmail.com',
  //subject: 'Daily portfolio data',
  //text: 'The following data is updated:'
};

var getYesterdayString = function() {
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
		 if (!isInit && dateString.indexOf(getYesterdayString())!= -1) {
			 //process Yesterday
		 		return "tegnap";
		 }

		 var currentDayInt;
		 if (dateString.indexOf("tf")!= -1) { //Monday
			 	currentDayInt = 1;
		 } else if (dateString.indexOf("kedd")!= -1) { //Tuesday
		 	  currentDayInt = 2;
  	 } else if (dateString.indexOf("szerda")!= -1) { //Wednesday
  		 	currentDayInt = 3;
  	 } else if (dateString.indexOf("cs")!= -1) { //Thursday
  		 	currentDayInt = 4;
  	 } else if (dateString.indexOf('ntek')!= -1) { //Friday
  		 	currentDayInt = 5;
  	 } else if (dateString.indexOf("szombat")!= -1) { //Saturday
  		 	currentDayInt = 6;
  	 } else if (dateString.indexOf("vas")!= -1) { //Sunday
  		 	currentDayInt = 0;
  	 } else if (dateString.indexOf("ma")!= -1) { //Today
  			return "ma";
		 } else  {
		 		return dateString;
		 }

		 var d = new Date();
		 var dateDay = (currentDayInt - d.getDay()) < 0 ? (d.getDay() - currentDayInt) : (d.getDay() - currentDayInt + 7);
		 d.setDate(d.getDate() - dateDay);
		 return d.getFullYear() + "." + (d.getMonth() + 1) + "." + d.getDate();
};

var parseMonthToDate = function(dateString) {
		var splitted = dateString.split(" ");
    var splitterCounter = 0;
    if (splitted.length == 3) {
        splitterCounter = 1;
    }
		var monthInt;
		if (splitted[splitterCounter].trim().indexOf("jan")!= -1) {
			 	monthInt = 1;
			} else if (splitted[splitterCounter].trim().indexOf("feb")!= -1) {
 			  monthInt = 2;
			} else if (splitted[splitterCounter].trim().indexOf("rciu")!= -1) {
			 	monthInt = 3;
			} else if (splitted[splitterCounter].trim().indexOf("prilis")!= -1) {
			 	monthInt = 4;
			} else if (splitted[splitterCounter].trim().indexOf('jus')!= -1) {
			 	monthInt = 5;
			} else if (splitted[splitterCounter].trim().indexOf("nius")!= -1) {
			 	monthInt = 6;
			} else if (splitted[splitterCounter].trim().indexOf("lius")!= -1) {
			 	monthInt = 7;
			} else if (splitted[splitterCounter].trim().indexOf("augusz")!= -1) {
	 		 	monthInt = 8;
  		} else if (splitted[splitterCounter].trim().indexOf("szept")!= -1) {
  	 		 monthInt = 9;
    	} else if (splitted[splitterCounter].trim().indexOf("okt")!= -1) {
   		 	 monthInt = 10;
  		} else if (splitted[splitterCounter].trim().indexOf("novem")!= -1) {
  	 		 monthInt = 11;
  	 	} else if (splitted[splitterCounter].trim().indexOf("decem")!= -1) {
    	 	 monthInt = 12;
  	  } else  {
		 		return dateString;
		  }
      if (splitted.length == 3) {
          return splitted[0].trim() + monthInt + "." + splitted[2].trim();
      }
	    return new Date().getFullYear() + "." + monthInt + "." + splitted[1].trim();
};

var sendEmail = function(result) {
	var dateNew = new Date();
	emaildata.subject = 'Daily portfolio data on ' + dateNew.getFullYear() + "." + (dateNew.getMonth() + 1 ) + "." + dateNew.getDate() + " " + dateNew.getHours() + ":" + dateNew.getMinutes();
	emaildata.text = result;
	mailgun.messages().send(emaildata, function (error, body) {
		console.log(body);
	});
};

var logToday = [];
var logElseDay =  [];
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
		//$('div .upRow').children('div .date').each(function(i, elem) {

    $('div .upRow').each(function(i, elem) {
			var dateText = $(this).children('div .date').text();
      var sequence = $(this).children('div .postNumber').text();
			var dateTextSplitted;
			if (dateText.indexOf(",") != -1) {
				dateTextSplitted = parseToDate(dateText.split(",")[0].trim(), isInit);
			} else {
				dateTextSplitted = parseMonthToDate(dateText.split("|")[0].trim());
			}
			isToday = dateTextSplitted.indexOf("ma") != -1;
			isYesterday = dateTextSplitted.indexOf("tegnap") != -1;

			if(tags.indexOf(dateTextSplitted) === -1) {
				if (!isToday) {
          logToday.push(sequence);
          tags.push(dateTextSplitted);
					tagsCount[dateTextSplitted] = 1;
				}
			} else {
        logElseDay.push(sequence);
				tagsCount[dateTextSplitted]++;
			}
		});
    console.log("Not today on page: " + logToday + " " + siteNumber + " " + url);
    console.log("Existed on page: " + logElseDay + " " + siteNumber + " " + url);
		if (siteNumber > 0 && (isInit || isYesterday)) {
			var newUrl = url + "&oldal=" + siteNumber;
			console.log(newUrl);
			https.get(newUrl, function(response) {
				parseResponse(response, isInit, callback);
			})
		} else {
			if (!isInit) {
			} else {
				for(var i = 0; i < tags.length;i++) {
					tagsWithCount.push({date:tags[i], count:tagsCount[tags[i]]});
				}
				console.log(JSON.stringify(tagsWithCount));
			}
			callback();
		}
  });
}

var updateForum = function(urlItem) {
    return new Promise((resolve, reject) => {
        process.nextTick(() => {
            console.log(urlItem);
            Forum.findOne({ url: urlItem }).exec(function(err, dbForum) {
                if (err) {
                  res.json(JSON.stringify("Error by read batch from DB"));
                }
                if (!dbForum) {
                  console.log("Not initalized yet " + urlItem);
                } else if (dbForum.updated) {
                  console.log("Already updated " + urlItem);
                } else {
                  url = urlItem;
                  logToday = [];
                  logElseDay =  [];
                  tags = [];
                  tagsCount = {};
                  siteNumber = undefined;
                  var tagsWithCountAndToday = [];
                  https.get(url, function(response) {
                    console.log("Test page for batch loaded " + url);
                    parseResponse(response, false, function() {
                      var tagsWithCountAndToday = JSON.parse(dbForum.data);
                      var date = new Date();
                      date.setDate(date.getDate()-1);
                      console.log("----tagsWithCountAndToday----");
                      console.log(tagsCount);
                      //console.log(tags[0]);
                      if (tags[0].indexOf("tegnap") != -1) {
                        tagsWithCountAndToday.unshift({date:date.getFullYear() + "." + (date.getMonth() + 1) + "." + (date.getDate()), count:tagsCount[tags[0]]});
                      } else {
                        console.log("No new forum entry on yesterday: " + url);
                        tagsWithCountAndToday.unshift({date:date.getFullYear() + "." + (date.getMonth() + 1) + "." + (date.getDate()), count:0});
                      }
                      dbForum.data = JSON.stringify(tagsWithCountAndToday);
                      dbForum.updatedate = date;
                      //dbForum.updated = true;
                      dbForum.save(function (err) {
                        if (err) return handleError(err);
                        console.log("Data updated " + url);
                        resolve();
                      });
                    });
                  });
                }
            });
        })
    });
}

app.get('/init/:forumname/:forumUrl', cors(), function (req, res, next) {
  //http://localhost:8081/init/TWDINVEST/https:%2F%2Fforum.portfolio.hu%2Ftopics%2Ftwdinvest%2F20191%3Flimit=100
  //http://localhost:8081/init/APPENINN/https:%2F%2Fforum.portfolio.hu%2Ftopics%2Fappeninn%2F13459%3Flimit=100
  console.log("Request arrived with name and url " + req.params.forumname + " " + req.params.forumUrl);
  url = req.params.forumUrl;
  if (!req.params.forumname || !url) {
    res.json("Forum name and url are required");
  } else {
  	Forum.find({ name: req.params.forumname }).exec(function(err, dbForum) {
        if (err) {
  				res.json(JSON.stringify("Error by read from DB"));
  			}
  			if (dbForum && dbForum[0]) {
  				console.log("Already initalized " + url);
  				res.json("Already initalized " + req.params.forumname);
  			} else {
  				tags = [];
  				tagsCount = {};
  				tagsWithCount = [];
  				siteNumber = undefined;
  				https.get(url, function(response) {
  					console.log("Test page loaded " + url);
  					parseResponse(response, true, function() {
  						var forum = new Forum();
  						forum.name = req.params.forumname;
              forum.url = url;
  						forum.data = JSON.stringify(tagsWithCount);
  						forum.createdate = new Date();
              forum.updatedate = new Date();
  						forum.updated = false;
  						forum.save(function (err) {
  						  if (err) return handleError(err);
  						});
  					});
  				});
  				res.json(JSON.stringify("Started forum initalization"));
  			}
  		});
    }
});

app.get('/data/:forumname', cors(), function (req, res, next) {
  console.log("Start sending data back");
  Forum.findOne({ name: req.params.forumname }).exec(function(err, dbForum) {
  		if (err) {
  			res.json(JSON.stringify("Error by read data from DB"));
  		}
  		if (!dbForum) {
  			res.json(JSON.stringify(new Array()));
  		} else {
  			res.json(dbForum.data);
  		}
  	});
});

app.get('/', cors(), function (req, res, next) {
  console.log("Wake up request arrived");
  Forum.find({}).select({ name: 1 }).exec(function(err, dbForum) {
    var forumNames = dbForum.map(a => a.name);
    console.log("DB Forum names: " + forumNames);
    res.json(forumNames);
  });
});

app.get('/email/:forumname', cors(), function (req, res, next) {
  console.log("Start sending email");
	Forum.findOne({ name: req.params.forumname }).exec(function(err, dbForum) {
			if (err) {
				res.json(JSON.stringify("Error by read email from DB"));
			}
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
  Forum.find({}).select({ url: 1 }).exec(function(err, dbForum) {
    console.log(dbForum);
    var forumUrls = dbForum.map(a => a.url);
    console.log(forumUrls);
    forumUrls.reduce(function (promise, forumUrl) {
        return promise.then(function () {
            return updateForum(forumUrl);
        });
    }, Promise.resolve()).then(() => {
        console.log(forumUrls + ' updated');
        sendEmail("The following urls are updated: " + forumUrls);
    });
  });
  res.json(JSON.stringify("Started forum update"));
});

app.get('/chart', cors(), function(req, res, next){
    res.sendFile(__dirname + '/chart.html');
});

const port = process.env.PORT || 8081;
app.listen(port, function () {
  console.log('CORS-enabled web server listening: ' + new Date());
});
