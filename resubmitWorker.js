const {parentPort, workerData} = require('worker_threads')
const { Configuration, OpenAIApi} = require("openai");
require("dotenv").config();

const openAi = new OpenAIApi(new Configuration({
    apiKey: process.env.API_KEY,
  })
)

let max_response_length = 200

let promptGPT = workerData.final + ' Your output string must strictly have only this JSON format - "Week x Day x": {"title": "..", "objective": "..", "activity": "1. .. (xx mins) \\n", "material list": "1. .. \\n"}. You must only use UTF-8 charset to encode the JSON output and the JSON output must be able to be parsed in express js. You must not add new line after every key value pair in the JSON output. You must not add any comments or additional notes.'

let promptObj = {"prompt": workerData.initial, "response":{}}  //to be sent back to frontend
chatGPTResponse = openAi.createChatCompletion({
    model: "gpt-3.5-turbo",
    messages: [{ role: "user", content: promptGPT}],
    max_tokens: max_response_length,
    temperature:0,
    stream:true,
  }).then((response)=>{
    console.log(typeof response.data.choices[0].message.content);
    promptObj["response"] = response.data.choices[0].message.content;
    parentPort.postMessage(promptObj)
  })