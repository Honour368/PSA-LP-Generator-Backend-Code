require("dotenv").config();

// var cors = require('cors');
var express = require('express');
var path = require('path');
var app = express();

app.use((req, res, next)=>{
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "POST, GET, PUT");
    res.setHeader("Access-Control-Allow-Headers", "*");
    next();
});
// app.use(express.bodyParser());

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(express.json({ strict: false }));
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req,res)=>{
  console.log("Hello World!")
  res.json({
    'hello':'hi!'
  });
})

app.post('/query', async function (req, res) {
  console.log(req.body["prompt"])
    
  fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.API_KEY}`
      },
      body: JSON.stringify({
        model: req.body["model"],
        messages: [{role:"user", content: req.body["prompt"]}],
        temperature:0,
        stream:true,
      })
  }).then(GPTResponse=>{
    const reader = GPTResponse.body.getReader();
    const read = ()=>{
      reader.read().then(async ({done, value})=> {
        if(done) {
          res.end()
          console.log("Complete Response sent!")
          return
        }

        const data = new TextDecoder().decode(value)
        let lines = (data.split("\n"))
        .map(line=>line.replace(/^data: /,"").trim())
        .filter(line=>line!==""&&line!=="[DONE]")
        .map(line=>JSON.parse(line))

        for (const line of lines) {
          const {choices} = line
          const {delta} = choices[0]
          const {content} = delta
          
          if (content) {
            // console.log(content)
            res.write(content) 
          }
        }       
        read()
      })
    }
    read();
  })
})

// app.use('/.netlify/functions/app', router);
const port = process.env.PORT || 8081;
var server = app.listen(port, function () {
var host = server.address().address;
var port = server.address().port;
console.log("Example app listening at http://%s:%s", host, port);
  })  


// module.exports.handler = serverless(app);




