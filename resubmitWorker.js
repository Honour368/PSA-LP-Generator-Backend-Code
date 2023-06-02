// const {parentPort, workerData} = require('worker_threads')
const { Configuration, OpenAIApi} = require("openai");
require("dotenv").config();
const Redis = require('ioredis');
const redis = new Redis(process.env.REDIS_URL);


const openAi = new OpenAIApi(new Configuration({
    apiKey: process.env.API_KEY,
  })
)

// console.log(workerData.initial);
// console.log(workerData.final);

// let promptObj = {"prompt": workerData.initial, "response":{}}  //to be sent back to frontend
// chatGPTResponse = openAi.createChatCompletion({
//     model: "gpt-3.5-turbo",
//     messages: [{ role: "user", content: workerData.final }],
//   }).then((response)=>{
//     console.log(typeof response.data.choices[0].message.content);
//     promptObj["response"] = JSON.parse(response.data.choices[0].message.content);
//     parentPort.postMessage(promptObj)
//   })



async function processJob(job) {
  let promptObj = {"prompt": job.data.initial, "response":{}}  //to be sent back to frontend
  // Implement your job processing logic here
  console.log('Processing job:', job.data.final);
  // Example: Simulate async processing
  chatGPTResponse = openAi.createChatCompletion({
    model: "gpt-3.5-turbo",
    messages: [{ role: "user", content: job.data.final }],
  }).then((response)=>{
    console.log(typeof response.data.choices[0].message.content);
    promptObj["response"] = JSON.parse(response.data.choices[0].message.content);
  })

  console.log('Job processed:', job);
  redis.publish('processedResubmitDataChannel', promptObj);
}
  
async function startWorker() {
  while (true) {
    const [queue, job] = await redis.brpop('jobQueue', 0);
    try {
      await processJob(JSON.parse(job));
    } catch (error) {
      console.error('Error processing job:', error);
    }
  }
}

console.log("Resubmit Worker Called")
startWorker();