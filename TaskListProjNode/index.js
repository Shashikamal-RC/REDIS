const express = require('express')
const bodyParser = require('body-parser')
const path = require('path')
const logger = require('morgan')
const redis = require('redis')

//initialize app
var app = express();

// create redis client
var client = redis.createClient();
client.on('connect' , () => {
    console.log("Redis server connected")
})

//view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

//Middlewares
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));
app.use(express.static(path.join(__dirname, '/public')));


//router 
app.get("/" , (req, res) => {
    var title = "Task List"

    client.LRANGE('tasks', 0 , -1, (err, reply) => {
        client.HGETALL('call', (err, call) => {
            res.render('index', {
                title: title,
                tasks: reply,
                call: call
            })
        })
    })
})

app.post("/task/add", (req,res) => {
    var task = req.body.task;
    client.RPUSH('tasks', task, (err,reply) => {
        if(err){
            console.log(err)
        }
        console.log("Task Added....");
        res.redirect("/");
    })
})

app.post("/task/delete" , (req, res) => {
    var tasksToDel = req.body.tasks;
    client.LRANGE("tasks", 0 ,-1, (err, tasks) => {
        for(var i=0;i<tasks.length;i++){
            if(tasksToDel.indexOf(tasks[i]) > -1){
                client.LREM('tasks', 0, tasks[i], (err, reply) =>{
                    if(err){
                        console.log(err)
                    }
                })
            }
        }
        res.redirect("/");
    })
})

app.post("/call/add", (req, res) => {
    var newCall = {};
    newCall.name =  req.body.name;
    newCall.company =  req.body.company;
    newCall.phone =  req.body.phone;
    newCall.time =  req.body.time;

    client.HMSET('call', ['name', newCall.name, "company", newCall.company,
                     "phone", newCall.phone, "time", newCall.time], (err, reply) =>  {
                        if(err){
                            console.log(err)
                        }
                        console.log(reply)
                        res.redirect("/");
                     })
})

app.listen(3000 , () => {
    console.log("server started on 3000")
});

module.exports = app;