const {parentPort, workerData} = require('worker_threads')
const { Configuration, OpenAIApi} = require("openai");
require("dotenv").config();

const openAi = new OpenAIApi(new Configuration({
    apiKey: process.env.API_KEY,
  })
)

console.log(workerData.initial);
console.log(workerData.final);

let promptObj = {"prompt": workerData.initial, "response":{}}  //to be sent back to frontend
chatGPTResponse = openAi.createChatCompletion({
    model: "gpt-3.5-turbo",
    messages: [{ role: "user", content: workerData.final }],
  }).then((response)=>{
    console.log(typeof response.data.choices[0].message.content);
    promptObj["response"] = JSON.parse(response.data.choices[0].message.content);
    parentPort.postMessage(promptObj)
  })

