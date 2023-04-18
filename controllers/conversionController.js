const fs = require('fs');
const ytdl = require("ytdl-core");
const { Configuration, OpenAIApi } = require("openai");
const Text = require('../models/textModel');
const { RecursiveCharacterTextSplitter } = require('langchain/text_splitter');
const { HNSWLib } = require("langchain/vectorstores/hnswlib")
const { OpenAIEmbeddings } = require("langchain/embeddings/openai")
const { RetrievalQAChain } = require("langchain/chains");
const { OpenAI } = require("langchain/llms/openai");
const sendEmail = require('../utils/sendMail');


// configuring openai api key
const configuration = new Configuration({
    apiKey: process.env.OPENAI_API_KEY,
});

// creating splitter to create docs for vectorstore
const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: 1000,
    chunkOverlap: 0,
});

// creating openai llm model
const model = new OpenAI()

// function to create vectorstore 
const downloadAudio = async (url, email) => {

    // creating unique name from url of youtube video
    const name = url.split("=")[1]
    // creating path to save vectorstore
    const filePath = `./local/stores/${name}`

    // if store already exists then this function is not executed
    if (!fs.existsSync(filePath)) {

        // downloading audio of specified youtube video
        ytdl(url, {
            quality: "lowestaudio",
            filter: "audioonly",
        })
            // saving it
            .pipe(fs.createWriteStream(`./local/audio/${name}.mp3`))
            .on("finish", async () => {

                // trying to create vectorstore after download is completed
                try {

                    // getting transcription from openai
                    const openai = new OpenAIApi(configuration);
                    const resp = await openai.createTranscription(
                        fs.createReadStream(`./local/audio/${name}.mp3`),
                        "whisper-1"
                    );

                    // saving the transcription on local database with
                    await Text.create({
                        text: resp.data.text,
                        name
                    })

                    // creating small documents from big text files
                    const output = await splitter.createDocuments([resp.data.text]);

                    //  creating vectorstore
                    const vectorStore = await HNSWLib.fromDocuments(output, new OpenAIEmbeddings())

                    //  saving vectorstore
                    await vectorStore.save(filePath)

                    // // sending mail to user for successfull creation of qna system
                    // const mailOptions = {
                    //     email: email,
                    //     subject: "Question answer system ready",
                    //     text: `Question Answer system for your requested url ${url} is ready. Please paste this link in QnA section of website. Have great experience`
                    // }
                    // await sendEmail(mailOptions)

                    // deleting audio file after creating vectorstore
                    fs.unlink(`./local/audio/${name}.mp3`, () => { })

                } catch (error) {
                    // logging error
                    console.log(error)

                    // sending mail to user for failed creation of qna system
                    // const mailOptions = {
                    //     email: email,
                    //     subject: "Error in creating Question answer system",
                    //     text: `We are sorry for the inconvinience. Your Question answer system creation was unsuccessful. This may have occured because of video length longer expected. please try again with small video size.`
                    // }
                    // await sendEmail(mailOptions)

                    // deleting audio file after fail request
                    fs.unlink(`./local/audio/${name}.mp3`, () => { })
                }
            })
    }
    // else {
    //     // sending mail to user for successfull creation of qna system
    //     const mailOptions = {
    //         email: email,
    //         subject: "Question answer system ready",
    //         text: `Question Answer system for your requested url ${url} is ready. Please paste this link in QnA section of website. Have great experience`
    //     }
    //     await sendEmail(mailOptions)
    // }
}

exports.convertVideo = (req, res, next) => {

    const url = req.body.url;
    const email = req.body.email

    downloadAudio(url, email)

    // sending succesfull response
    res.status(200).json({
        status: "success"
    })

}

exports.qnaHandler = async (req, res, next) => {

    // creating name to load vectorstore
    const name = req.body.url.split("=")[1]
    const filePath = `./local/stores/${name}`

    // if store doesn't exist sending error
    if (!fs.existsSync(filePath)) {
        res.status(404).json({
            status: "fail",
            message: "please upload video first"
        })
        return
    }

    // loading vectorstore
    const vectorStore = await HNSWLib.load(filePath, new OpenAIEmbeddings())

    // getting chains ready for qna
    const chain = RetrievalQAChain.fromLLM(model, vectorStore.asRetriever())


    // getting answer from chain
    const answer = await chain.call({
        query: req.body.question
    })
    // sending back answer
    res.status(200).json({
        status: "success",
        answer: answer.text
    })




}