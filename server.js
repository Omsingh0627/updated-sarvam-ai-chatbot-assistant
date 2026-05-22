require("dotenv").config();

const express = require("express");
const http = require("http");
const WebSocket = require("ws");
const cors = require("cors");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const pdfParse = require("pdf-parse");
const mammoth = require("mammoth");

const app = express();

app.use(cors());
app.use(express.json());

/* =========================
   UPLOADS
========================= */

const uploadDir =
path.join(__dirname, "uploads");

if(!fs.existsSync(uploadDir)){

fs.mkdirSync(uploadDir);

}

app.use(
"/uploads",
express.static(uploadDir)
);

/* =========================
   MULTER
========================= */

const storage =
multer.diskStorage({

destination:(req,file,cb)=>{

cb(null, uploadDir);

},

filename:(req,file,cb)=>{

const unique =
Date.now() +
"-" +
file.originalname;

cb(null, unique);

}

});

const upload =
multer({ storage });

/* =========================
   FILE EXTRACTION
========================= */

async function extractFileText(filePath){

try{

const ext =
path.extname(filePath)
.toLowerCase();

console.log("FILE EXT:", ext);

/* PDF */

if(ext === ".pdf"){

const dataBuffer =
fs.readFileSync(filePath);

const pdfData =
await pdfParse(dataBuffer);

return pdfData.text;

}

/* DOCX */

if(ext === ".docx"){

const result =
await mammoth.extractRawText({
path:filePath
});

return result.value;

}

/* TXT */

if(ext === ".txt"){

const text =
fs.readFileSync(
filePath,
"utf8"
);

return text;

}

return null;

}catch(err){

console.log("EXTRACTION ERROR:");
console.log(err);

return null;

}

}

/* =========================
   FILE UPLOAD ROUTE
========================= */

app.post(
"/upload",
upload.single("file"),
async(req,res)=>{

try{

if(!req.file){

return res.status(400).json({
error:"No file uploaded"
});

}

const filePath =
req.file.path;

const extractedText =
await extractFileText(filePath);

res.json({

success:true,

filename:
req.file.originalname,

text:
extractedText || null

});

}catch(err){

console.log(err);

res.status(500).json({
error:"Upload failed"
});

}

}
);

/* =========================
   SERVER
========================= */

const server =
http.createServer(app);

const wss =
new WebSocket.Server({
server
});

/* =========================
   CLEAN REASONING
========================= */

function cleanReasoning(text){

if(!text) return "";

const reasoningPatterns = [

/Okay,.*?\./gis,
/Let me.*?\./gis,
/First,.*?\./gis,
/I need to.*?\./gis,
/The user.*?\./gis,
/I should.*?\./gis,
/Wait,.*?\./gis,
/Alright,.*?\./gis,
/Hmm,.*?\./gis,
/But wait,.*?\./gis,
/Since the user.*?\./gis,
/The task is.*?\./gis,
/Need to make sure.*?\./gis

];

reasoningPatterns.forEach(pattern=>{

text =
text.replace(pattern, "");

});

text =
text
.replace(/\n{2,}/g,"\n")
.trim();

return text;

}

/* =========================
   WS CONNECTION
========================= */

wss.on(
"connection",
(ws)=>{

console.log("Client connected");

/* =========================
   RECEIVE MESSAGE
========================= */

ws.on(
"message",
async(message)=>{

try{

const data =
JSON.parse(message);

if(
data.type ===
"user_message"
){

const response =
await fetch(
"https://api.sarvam.ai/v1/chat/completions",
{

method:"POST",

headers:{

"Authorization":
`Bearer ${process.env.SARVAM_API_KEY}`,

"Content-Type":
"application/json"

},

body:JSON.stringify({

model:"sarvam-m",

max_tokens:300,

temperature:0.2,

messages:[

{
role:"system",

content:
`
You are Sarvam AI.

STRICT RULES:

- Never reveal internal reasoning.
- Never explain thoughts.
- Never think step-by-step.
- Never say:
  "Okay..."
  "Let me..."
  "I need to..."
  "The user..."
- Only provide final answers.
- Be concise and direct.
- Behave like ChatGPT final responses.
`

},

{
role:"user",
content:data.message
}

]

})

}
);

const result =
await response.json();

console.log(result);

let text =
result?.choices?.[0]
?.message?.content
||
"Sorry, something went wrong.";

/* CLEAN REASONING */

text =
cleanReasoning(text);

if(text.length < 2){

text =
"Sorry, I couldn't generate a proper response.";

}

/* STREAMING */

let index = 0;

const interval =
setInterval(()=>{

if(index < text.length){

ws.send(
JSON.stringify({

type:"stream",

chunk:text[index]

})
);

index++;

}else{

clearInterval(interval);

ws.send(
JSON.stringify({

type:"stream_end"

})
);

}

},10);

}

}catch(err){

console.log("WS ERROR:");
console.log(err);

ws.send(
JSON.stringify({

type:"stream",

chunk:"Error occurred."

})
);

ws.send(
JSON.stringify({

type:"stream_end"

})
);

}

});

/* =========================
   DISCONNECT
========================= */

ws.on(
"close",
()=>{

console.log(
"Client disconnected"
);

}
);

}
);

/* =========================
   START SERVER
========================= */

server.listen(
3000,
()=>{

console.log(
"Server running on port 3000"
);

}
);