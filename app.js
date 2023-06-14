// const {Worker, workerData} = require("worker_threads");
// const {config} = require("dotenv")
require("dotenv").config();

var cors = require('cors');
var express = require('express');
var path = require('path');
var app = express();

// var max_response_length = 200;

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

app.put('/devQuery', function (req, res) {
  let prompt = req.body["Prompt"]
  let promptGPT = prompt + ' Your output string must strictly have only this JSON format - "Week x Day x": {"title": "..", "objective": "..", "activity": "1. .. (xx mins) \\n", "material list": "1. .. \\n"}. You must only use UTF-8 charset to encode the JSON output and the JSON output must be able to be parsed in express js. You must not add new line after every key value pair in the JSON output. You must not add any comments or additional notes.'
  console.log(prompt)

  res.writeHead(200, {
    'Content-Type': 'application/octet-stream',
    'Access-Control-Allow-Origin': '*',
    'Transfer-Encoding': 'chunked'
  })

  fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.API_KEY}`
      },
      body: JSON.stringify({
        model:"gpt-3.5-turbo",
        messages: [{role:"user", content: promptGPT}],
        // max_tokens: max_response_length,
        temperature:0,
        stream:true,
      })
  }).then(GPTResponse=>{
    const reader = GPTResponse.body.getReader();
    const read = ()=>{
      reader.read().then(async ({done, value})=> {
        let data = new TextDecoder().decode(value)
        if(done) {
          res.end()
          console.log("Complete response sent!")
          return
        }
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

app.put('/query', async function (req, res) {
  var subject = req.body["subject"]
  var grade = req.body["grade"]
  var topic = req.body["topic"]
  var weeks = req.body["weeks"]
  var lesson_no = req.body["lesson_no"]
  var lesson_mins = req.body["lesson_mins"]
  // var min_student_no = req.body["prompt[min_student_no]"]
  // var max_student_no = req.body["prompt[max_student_no]"]

  var subtopics = req.body['subtopics'].reduce((word, item)=>{return word +" "+ item['subtopic']+" and"}, '')
  subtopics = subtopics.substring(0, subtopics.lastIndexOf("and"))
  // console.log(subtopics)

  var learning_objectives = req.body['objectives'].reduce((word, item)=>{return word +" "+ item['objective']+" and"}, '')
  learning_objectives = learning_objectives.substring(0, learning_objectives.lastIndexOf("and"))
  // console.log(learning_objectives)

  if (req.body["additional_notes"]!=''){
    var additional_notes = ", Consider the following as well: " + req.body["additional_notes"].split("\n").join(", and ") + "."
  }
  else{
    var additional_notes = ''
  }

  var activities=""
  if (lesson_mins<=30){
    // activities="Activities must include an icebreaker or recap, an intro or lecture on today's topic, one activity only and a wrap up."
    activities = "Activities must have the following format 1. Icebreaker/Recap - .. (xx mins) \\n 2. Intro - .. (xx mins) \\n 3. Activity 1 - .. (xx mins) \\n 4. Wrap up - .. (xx mins)"
  }
  else if (lesson_mins<=45){
    // activities="Activities must only include an icebreaker or recap, an intro on today's topic, 2 extra activities and a wrap up."
    activities = "Activities must have the following format 1. Icebreaker/Recap: .. (xx mins) \\n 2. Intro: .. (xx mins) \\n 3. Activity 1: .. (xx mins) \\n 4. Activity 2: .. (xx mins) \\n 5. Wrap up\: .. (xx mins)"
  }
  else if (lesson_mins<=60){
    // activities="Activities must include first lecture on the present topic, first activity on the topic, second lecture on the present topic and second activity on the topic."
    activities = "Activities must have the following format 1. Lecture 1 - .. (xx mins) \\n 2. Activity 1 - .. (xx mins) \\n 3. Lecture 2 - .. (xx mins) \\n 4. Activity 2 - .. (xx mins) \\n"
  }
  else{
    // activities="Activities must include first lecture on the present topic, first activity on the topic, second lecture on the present topic, second activity on the topic, third lecture on the present topic and third activity on the topic."
    activities = "Activites must have the following format 1. Lecture 1 - .. (xx mins) \\n 2. Activity 1 - .. (xx mins) \\n 3. Lecture 2 - .. (xx mins) \\n 4. Activity 2 - .. (xx mins) \\n 5. Lecture 3 - .. (xx mins) \\n 6. Activity 3 - .. (xx mins) \\n"
  }

  let prompt = `You are a school teacher who wants to design a lesson plan. Design a sample ${subject} lesson plan for grade ${grade} students focusing on ${topic} as the topic and the following subtopics: ${subtopics}. The module is ${weeks} weeks long and must meet ${lesson_no} days per week and must have a total of exactly ${lesson_mins} minutes per lesson. The module's learning objectives are ${learning_objectives}. The generated lesson plan must include a rundown of the lesson, lesson objectives, activities and material lists. ${activities}. ${additional_notes}`;
  // let promptFillOutput = `You are a school teacher who wants to design a lesson plan. Design a sample \${${subject}} lesson plan for grade \${${grade}} students focusing on \${${topic}} as the topic and the following subtopics: ${subtopics}. The module is \${${weeks}} weeks long and must meet \${${lesson_no}} days per week and must have a total of exactly \${${lesson_mins}} minutes per lesson. The module's learning objectives are \${${learning_objectives}}. The generated lesson plan must include a rundown of the lesson, lesson objectives, activities and material lists. ${activities}. ${additional_notes}`;
  // let promptOutput = promptFillOutput + ' Your output string must strictly have this unparsed JSON format: {"Week x Day x": {"title": "..","objective": "..","activity": "1. .. (xx mins) \\n", "material list": "1. .. \\n"}}. You must not add any comments. The JSON output must be able to be parsed in express js.'
//   console.log(promptOutput)
  // let promptObj = {"prompt": prompt}  //to be sent back to frontend

  let promptGPT = prompt + ' Your output string must strictly have only this JSON format - "Week x Day x": {"title": "..", "objective": "..", "activity": "1. .. (xx mins) \\n", "material list": "1. .. \\n"}. You must only use UTF-8 charset to encode the JSON output and the JSON output must be able to be parsed in express js. You must not add new line after every key value pair in the JSON output. You must not add any comments or additional notes.'
  console.log(prompt)

  res.writeHead(200, {
    'Content-Type': 'application/octet-stream',
    'Access-Control-Allow-Origin': '*',
    'Transfer-Encoding': 'chunked'
  })
  // res.write("Hello World")
  // res.write(prompt)
    
  fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.API_KEY}`
      },
      body: JSON.stringify({
        model:"gpt-3.5-turbo",
        messages: [{role:"user", content: promptGPT}],
        // max_tokens: max_response_length,
        temperature:0,
        stream:true,
      })
  }).then(GPTResponse=>{
    const reader = GPTResponse.body.getReader();
    const read = ()=>{
      reader.read().then(async ({done, value})=> {
        let data = new TextDecoder().decode(value)
        if(done) {
          res.end()
          console.log("Complete Response sent!")
          return
        }
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

app.post('/resubmit', async function (req, res) {
  console.log(req.body)

  var keys = Object.keys(req.body)
  var initialPrompt = req.body[keys[keys.length-1]]

  var promptEnd=" You must keep";
  
  for (i=0; i<keys.length-1; i++){
    promptEnd += " ("+keys[i] + ") as (" + req.body[keys[i]] + ") and"
  }
  promptEnd = promptEnd.substring(0, promptEnd.lastIndexOf(" "))
  var completePrompt = initialPrompt + promptEnd
  // console.log(initialPrompt);
  // console.log(completePrompt);

  var promptGPT = completePrompt + ' Your output string must strictly have only this JSON format - "Week x Day x": {"title": "..", "objective": "..", "activity": "1. .. (xx mins) \\n", "material list": "1. .. \\n"}. You must only use UTF-8 charset to encode the JSON output and the JSON output must be able to be parsed in express js. You must not add new line after every key value pair in the JSON output. You must not add any comments or additional notes.'

  res.writeHead(200, {
    'Content-Type': 'application/octet-stream',
    'Access-Control-Allow-Origin': '*',
    'Transfer-Encoding': 'chunked'
  })

  fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.API_KEY}`
      },
      body: JSON.stringify({
        model:"gpt-3.5-turbo",
        messages: [{role:"user", content: promptGPT}],
        // max_tokens: max_response_length,
        temperature:0,
        stream:true,
      })
  }).then(GPTResponse=>{
    const reader = GPTResponse.body.getReader();
    const read = ()=>{
      reader.read().then(async ({done, value})=> {
        let data = new TextDecoder().decode(value)
        if(done) {
          res.end()
          console.log("Complete Response sent!")
          return
        }
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




