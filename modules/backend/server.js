await import('node:sqlite').catch(()=>{console.log('upgrade to node>22.3 and use --experimental-sqlite');process.exit(1)})
// npm install @langchain/ollama @langchain/core ollama
/**
import { ChatOllama } from "@langchain/ollama";

const model = new ChatOllama({
  model: "llama3",  // Default value.
});

const result = await model.invoke(["human", "Hello, how are you?"]);
*/

// TODO interface like https://docs.smith.langchain.com/observability/concepts 
import { DatabaseSync } from 'node:sqlite';

const database = new DatabaseSync(':memory:');
// Use :memory: to specify the database will be in memory or

// const database = new DatabaseSync('path/to/file');
// Specify the path of the SQLite database file
