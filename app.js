const { Configuration, OpenAIApi} = require("openai");
// const {config} = require("dotenv")
require("dotenv").config();

const openAi = new OpenAIApi(new Configuration({
  // apiKey: "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",
  apiKey: process.env.API_KEY,
})
)

var cors = require('cors');
var express = require('express');
var path = require('path');
const serverless = require('serverless-http');
var app = express();

const router = express.Router();

// const corsOptions = {
//   origin: ['http://localhost:5173', "https://statuesque-khapse-3ac33c.netlify.app"]
// }

// app.use(cors(corsOptions))

app.use(cors());
// app.use(express.bodyParser());

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(express.json({ strict: false }));
app.use(express.static(path.join(__dirname, 'public')));

// app.options('*', cors(corsOptions));
app.options('*', cors());

app.get('/', (req,res)=>{
  console.log("Hello World!")
  res.json({
    'hello':'hi!'
  });
})

app.put('/query', async function (req, res) {
  var subject = req.body["prompt[subject]"]
  var grade = req.body["prompt[grade]"]
  var topic = req.body["prompt[topic]"]
  var subtopic = req.body["prompt[subtopic]"]
  var weeks = req.body["prompt[weeks]"]
  var lesson_no = req.body["prompt[lesson_no]"]
  var lesson_mins = req.body["prompt[lesson_mins]"]
  // var min_student_no = req.body["prompt[min_student_no]"]
  // var max_student_no = req.body["prompt[max_student_no]"]
  var learning_objectives = req.body["prompt[learning_objectives]"].split("\n").join(", and ")
  if (req.body["prompt[additional_notes]"]!=''){
    var additional_notes = ", Consider the following as well: " + req.body["prompt[additional_notes]"].split("\n").join(", and ") + "."
  }
  else{
    var additional_notes = ''
  }

  var activities=""
  if (lesson_mins<30){
    // activities="Activities must include an icebreaker or recap, an intro or lecture on today's topic, one activity only and a wrap up."
    activities = "Activites must have the following format 1. Icebreaker/Recap: .. (xx mins) \\n 2. Intro: .. (xx mins) \\n 3. Activity 1: .. (xx mins) \\n 4. Wrap up: .. (xx mins)"
  }
  else if (lesson_mins<45){
    // activities="Activities must only include an icebreaker or recap, an intro on today's topic, 2 extra activities and a wrap up."
    activities = "Activites must have the following format 1. Icebreaker/Recap: .. (xx mins) \\n 2. Intro: .. (xx mins) \\n 3. Activity 1: .. (xx mins) \\n 4. Activity 2: .. (xx mins) \\n 5. Wrap up\: .. (xx mins)"
  }
  else if (lesson_mins<60){
    // activities="Activities must include first lecture on the present topic, first activity on the topic, second lecture on the present topic and second activity on the topic."
    activities = "Activites must have the following format 1. Lecture 1 - .. (xx mins) \\n 2. Activity 1 - .. (xx mins) \\n 3. Lecture 2 - .. (xx mins) \\n 4. Activity 2 - .. (xx mins) \\n"
  }
  else{
    // activities="Activities must include first lecture on the present topic, first activity on the topic, second lecture on the present topic, second activity on the topic, third lecture on the present topic and third activity on the topic."
    activities = "Activites must have the following format 1. Lecture 1 - .. (xx mins) \\n 2. Activity 1 - .. (xx mins) \\n 3. Lecture 2 - .. (xx mins) \\n 4. Activity 2 - .. (xx mins) \\n 5. Lecture 3 - .. (xx mins) \\n 6. Activity 3 - .. (xx mins) \\n"
  }

  let promptFill = `You are a school teacher who wants to design a lesson plan. Design a sample ${subject} lesson plan for grade ${grade} students focusing on ${topic} as the topic and ${subtopic} as the subtopic. The module is ${weeks} weeks long and must meet ${lesson_no} days per week and must have a total of exactly ${lesson_mins} minutes per lesson. The module's learning objectives are ${learning_objectives}. The generated lesson plan must include a rundown of the lesson, lesson objectives, activities and material lists. ${activities}. ${additional_notes}`;
  let promptFillOutput = `You are a school teacher who wants to design a lesson plan. Design a sample \${${subject}} lesson plan for grade \${${grade}} students focusing on \${${topic}} as the topic and \${${subtopic}} as the subtopic. The module is \${${weeks}} weeks long and must meet \${${lesson_no}} days per week and must have a total of exactly \${${lesson_mins}} minutes per lesson. The module's learning objectives are \${${learning_objectives}}. The generated lesson plan must include a rundown of the lesson, lesson objectives, activities and material lists. ${activities}. ${additional_notes}`;
  let prompt = promptFill + ' Your output string must strictly have this JSON format: {"Week x Day x": {"title": "..", "objective": "..", "activity": "1. .. (xx mins) \\n", "material list": "1. .. \\n"}}. The JSON output must be able to be parsed in express js.'
  let promptOutput = promptFillOutput + ' Your output string must strictly have this unparsed JSON format: {"Week x Day x": {"title": "..","objective": "..","activity": "1. .. (xx mins) \\n", "material list": "1. .. \\n"}}. The JSON output must be able to be parsed in express js.'

  let promptObj = {"prompt": prompt, "response":{}}  //to be sent back to frontend
  console.log(promptOutput)
  chatGPTResponse = await openAi.createChatCompletion({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: prompt }],
    }).then((response)=>{
      console.log(typeof response.data.choices[0].message.content);
      promptObj["response"] = JSON.parse(response.data.choices[0].message.content);
      res.header('Access-Control-Allow-Origin', '*');
      res.send(promptObj);
      console.log("Response sent!")
    })
  })

app.post('/resubmit', async function (req, res) {
  var prompt=" You must keep";
  var keys = Object.keys(req.body)
  var initialPrompt = req.body[keys[keys.length-1]]
  for (i=0; i<keys.length-1; i++){
    prompt += " ("+keys[i] + ") as (" + req.body[keys[i]] + ") and"
  }
  prompt = prompt.substring(0, prompt.lastIndexOf(" "))
  var completePrompt = initialPrompt + prompt
  console.log(completePrompt);

  let promptObj = {"prompt": initialPrompt, "response":{}}  //to be sent back to frontend
  chatGPTResponse = await openAi.createChatCompletion({
    model: "gpt-3.5-turbo",
    messages: [{ role: "user", content: completePrompt }],
  }).then((response)=>{
    console.log(typeof response.data.choices[0].message.content);
    promptObj["response"] = JSON.parse(response.data.choices[0].message.content);
    res.header('Access-Control-Allow-Origin', '*');
    res.send(promptObj);
    console.log("Response sent!")
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