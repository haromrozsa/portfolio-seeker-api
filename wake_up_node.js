var http = require('http');

var options = {
    host: 'portfolio-seeker-api.herokuapp.com',
    path: '/batch'
};
console.log("Start wake up dyno and process new forum entries");
http.get(options, function(res) {
    res.on('data', function(chunk) {
        try {
            console.log("Wake up endpoint returned: " + chunk);
        } catch (err) {
            console.log(err.message);
        }
    });
}).on('error', function(err) {
    console.log("Error: " + err.message);
});
