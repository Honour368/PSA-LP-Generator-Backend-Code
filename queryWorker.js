const {parentPort, workerData} = require('worker_threads')
const { Configuration, OpenAIApi} = require("openai");
require("dotenv").config();

const openAi = new OpenAIApi(new Configuration({
    apiKey: process.env.API_KEY,
  })
)

console.log(workerData);

let promptObj = {"prompt": workerData, "response":{}}  //to be sent back to frontend
chatGPTResponse = openAi.createChatCompletion({
    model: "gpt-3.5-turbo",
    messages: [{ role: "user", content: workerData }],
  }).then((response)=>{
    console.log(typeof response.data.choices[0].message.content);
    promptObj["response"] = JSON.parse(response.data.choices[0].message.content);
    parentPort.postMessage(promptObj)
  })

