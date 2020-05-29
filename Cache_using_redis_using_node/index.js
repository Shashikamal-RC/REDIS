const express = require('express')
const fetch = require('node-fetch')
const redis = require('redis')

const PORT = process.env.port || 5000
const REDIS_PORT = process.env.port || 6379

//create redis client
const client = redis.createClient(REDIS_PORT);

const app = express();

//response 
const setResponse = (username, repos) => {
    return `<h2>${username} has ${repos} GiiHub Repos</h2>`
}

// Cache middleware
const cache = (req, res, next) => {
    const {username} =  req.params;

    client.get(username, (err, data) =>{
        if(err) throw err;

        if(data !== null) {
            res.send(setResponse(username, data));
        }else{
            next(); 
        }
    } )
} 

//Middleware to send request to GitHUb
const getRepos = async (req, res, next) => {
    try{
        console.log("Fetching Data....")

        const {username} = req.params;

        const response = await fetch(`https://api.github.com/users/${username}`)

        const data = await response.json();

        const repos = data.public_repos;

        //set data to redis
        client.setex(username, 3600, repos) // 3600 : expairy time

        res.send(setResponse(username, repos));

    }catch(err){
        console.log(err)
    }
}

//router
app.get('/repos/:username', cache,  getRepos)

//start server
app.listen(PORT, () => {
    console.log(`App is running at PORT : ${PORT}`)
})