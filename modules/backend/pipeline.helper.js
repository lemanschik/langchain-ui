/* #region rag.js */

import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { OllamaEmbeddings, ChatOllama } from "@langchain/ollama";
import { MemoryVectorStore } from "langchain/vectorstores/memory";
import { PromptTemplate } from "@langchain/core/prompts";

export const loadAndSplitTheDocs = async (file_path) => {
  // load the uploaded file data
  const loader = new PDFLoader(file_path);
  const docs = await loader.load();

  const textSplitter = new RecursiveCharacterTextSplitter({
    chunkSize: 500,
    chunkOverlap: 0,
  });
  const allSplits = await textSplitter.splitDocuments(docs);
  return allSplits;
};

export const vectorSaveAndSearch = async (splits,question) => {
    const embeddings = new OllamaEmbeddings();
    const vectorStore = await MemoryVectorStore.fromDocuments(
        splits,
        embeddings
    );

    const searches = await vectorStore.similaritySearch(question);
    return searches;
};

export const generatePrompt = async (searches,question) =>
{
    let context = "";
    searches.forEach((search) => {
        context = context + "\n\n" + search.pageContent;
    });

    const prompt = PromptTemplate.fromTemplate(`
Answer the question based only on the following context:

{context}

---

Answer the question based on the above context: {question}
`);

    const formattedPrompt = await prompt.format({
        context: context,
        question: question,
    });
    return formattedPrompt;
}


export const generateOutput = async (prompt) =>
{
    const ollamaLlm = new ChatOllama({
        baseUrl: "http://localhost:11434", // Default value
        model: "llama3.2", // Default value
    });

    const response = await ollamaLlm.invoke(prompt);
    return response;
}

/* #endregion */

/* #region API */
import express from "express";
import multer from "multer";
import fs from "fs";
// rag.js region
// import {
//   generateOutput,
//   generatePrompt,
//   loadAndSplitTheDocs,
//   vectorSaveAndSearch,
// } from "./rag.js";

const PORT = 3005;

const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, "data"); // Specify the directory to store uploaded files
    },
    filename: (req, file, cb) => {
      const splittedFileName = file.originalname.split(".");
      const fileExtension = splittedFileName[splittedFileName.length-1];
      const fileName = "sample." + fileExtension;
      cb(null, fileName);
    },
  }),
});

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.post("/upload", upload.single("file"), async (req, res) => {
  const file = req.file;
  const question = req.body.question;
  if (!file) {
    return res.status(400).send("No file uploaded.");
  }
  const splits = await loadAndSplitTheDocs("./data/sample.pdf");
  const searches = await vectorSaveAndSearch(splits, question);
  const prompt = await generatePrompt(searches, question);
  const result = await generateOutput(prompt);
  res.json({
    message: "Content has been generated successfully.",
    data: {
      content: result.content,
    },
  });
  // just not to duplicate
  // this is only for my personal use
  // you can modify this according to your requirements.
  fs.unlink("data/sample.pdf", (err) => {
    if (err) {
      console.error("Error deleting file:", err);
    } else {
      console.log("File deleted successfully.");
    }
  });
});

app.listen(PORT, () => {
  console.log(`API is running on \nhttp//localhost:${PORT}`);
});

/* #endregion */
