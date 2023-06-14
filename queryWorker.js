const {parentPort, workerData} = require('worker_threads')
const { Configuration, OpenAIApi} = require("openai");
require("dotenv").config();

const openAi = new OpenAIApi(new Configuration({
    apiKey: process.env.API_KEY,
  })
)

// let max_response_length = 200

let promptGPT = workerData + ' Your output string must strictly have only this JSON format - "Week x Day x": {"title": "..", "objective": "..", "activity": "1. .. (xx mins) \\n", "material list": "1. .. \\n"}. You must only use UTF-8 charset to encode the JSON output and the JSON output must be able to be parsed in express js. You must not add new line after every key value pair in the JSON output. You must not add any comments or additional notes.'

let responseObj = {"prompt": workerData, "response":{}}  //to be sent back to frontend

// async function devGPTResponseHere(prompt) {
//   let promptProcessed = await evGPTProcess(prompt)
//   await fetch("https://api.openai.com/v1/chat/completions", {
//     method: "POST",
//     headers: {
//       "Content-Type": "application/json",
//       Authorization: `Bearer ${process.env.API_KEY}`
//     },
//     body: JSON.stringify({
//       model:"gpt-3.5-turbo",
//       messages: [{role:"user", content: prompt["prompt"]}]
//     })
//   })
// }

// let chatGPTResponse = fetch("https://api.openai.com/v1/chat/completions", {
//   method: "POST",
//     headers: {
//       "Content-Type": "application/json",
//       Authorization: `Bearer ${process.env.API_KEY}`
//     },
//     body: JSON.stringify({
//       model:"gpt-3.5-turbo",
//       messages: [{role:"user", content: promptGPT}],
//       max_tokens: max_response_length,
//       temperature:0,
//       stream:true,
//     })
// }).then(GPTResponse=>{
//   const reader = GPTResponse.body.getReader();
//   const read = ()=>{
//     reader.read().then(({done, value})=>{
//       if(done) {
//         return
//       }
//       const data = new TextDecoder("utf-8").decode(value);
//       res.write(data.choices[0])
//       read()
//     })
//   }
//   read();
// })


chatGPTResponse = openAi.createChatCompletion({
    model: "gpt-3.5-turbo",
    messages: [{ role: "user", content: promptGPT}],
    // max_tokens: max_response_length,
    temperature:0,
    // stream:true,
  }).then((response)=>{
    console.log(typeof response.data.choices[0].message.content)
    // console.log(response.data.choices[0].message.content);
    // promptObj["response"] = JSON.parse(response.data.choices[0].message.content);
    responseObj["response"] = response.data.choices[0].message.content;
    parentPort.postMessage(responseObj)
  })