/* =========================
   SARVAM AI FULL SCRIPT.JS
========================= */

marked.setOptions({
    breaks: true
});

/* =========================
   WEBSOCKET
========================= */

const ws = new WebSocket("ws://localhost:3000");

/* =========================
   ELEMENTS
========================= */

const chatContainer = document.getElementById("chat-container");
const messageInput = document.getElementById("message-input");
const sendBtn = document.getElementById("send-btn");
const voiceBtn = document.getElementById("voice-btn");
const newChatBtn = document.getElementById("new-chat-btn");
const historyDiv = document.getElementById("history");
const pinnedContainer = document.getElementById("pinned-container");
const welcomeScreen = document.getElementById("welcome-screen");
const searchInput = document.getElementById("search-input");

const plusBtn = document.getElementById("plus-btn");
const plusMenu = document.getElementById("plus-menu");

const uploadImageBtn =
document.getElementById("upload-image-btn");

const uploadFileBtn =
document.getElementById("upload-file-btn");

const generateImageBtn =
document.getElementById("generate-image-btn");

const pasteBtn =
document.getElementById("paste-btn");

const imageInput =
document.getElementById("image-input");

const fileInput =
document.getElementById("file-input");

const deleteModal =
document.getElementById("delete-modal");

const cancelDelete =
document.getElementById("cancel-delete");

const confirmDelete =
document.getElementById("confirm-delete");

const deleteChatText =
document.getElementById("delete-chat-text");

/* =========================
   DATA
========================= */

let chats =
JSON.parse(
localStorage.getItem("chat_history")
) || [];

let pinnedChats =
JSON.parse(
localStorage.getItem("pinned_chats")
) || [];

let currentChatId = null;

let activeBotBubble = null;

let activeStreamText = "";

let chatToDelete = null;

/* DOCUMENT MEMORY */

let uploadedDocumentText = "";

/* =========================
   SAVE
========================= */

function saveChats(){

localStorage.setItem(
"chat_history",
JSON.stringify(chats)
);

localStorage.setItem(
"pinned_chats",
JSON.stringify(pinnedChats)
);

}

/* =========================
   CREATE CHAT
========================= */

function createChat(){

const newChat = {

id: Date.now(),

title: "New Chat",

messages: []

};

chats.unshift(newChat);

currentChatId = newChat.id;

saveChats();

renderHistory();

renderChat();

}

/* =========================
   RENDER HISTORY
========================= */

function renderHistory(){

historyDiv.innerHTML = "";
pinnedContainer.innerHTML = "";

const search =
searchInput.value.toLowerCase();

chats.forEach(chat=>{

if(
!chat.title
.toLowerCase()
.includes(search)
){
return;
}

const div =
document.createElement("div");

div.classList.add("chat-item");

/* TITLE */

const title =
document.createElement("div");

title.classList.add("chat-title");

title.textContent = chat.title;

/* MENU BUTTON */

const menuBtn =
document.createElement("button");

menuBtn.innerHTML = "⋮";

menuBtn.classList.add(
"chat-menu-btn"
);

/* DROPDOWN */

const dropdown =
document.createElement("div");

dropdown.classList.add(
"chat-dropdown"
);

/* RENAME */

const renameBtn =
document.createElement("button");

renameBtn.innerHTML =
"✏️ Rename";

renameBtn.onclick = (e)=>{

e.stopPropagation();

const newName =
prompt(
"Rename chat",
chat.title
);

if(newName){

chat.title = newName;

saveChats();

renderHistory();

}

};

/* PIN */

const pinBtn =
document.createElement("button");

pinBtn.innerHTML =
pinnedChats.includes(chat.id)
? "📌 Unpin"
: "📌 Pin";

pinBtn.onclick = (e)=>{

e.stopPropagation();

if(
!pinnedChats.includes(chat.id)
){

pinnedChats.push(chat.id);

}else{

pinnedChats =
pinnedChats.filter(
id => id !== chat.id
);

}

saveChats();

renderHistory();

};

/* DELETE */

const deleteBtn =
document.createElement("button");

deleteBtn.innerHTML =
"🗑 Delete";

deleteBtn.onclick = (e)=>{

e.stopPropagation();

chatToDelete = chat.id;

deleteChatText.innerHTML =
`This will delete <b>${chat.title}</b>.`;

deleteModal.style.display = "flex";

};

/* APPEND */

dropdown.appendChild(renameBtn);
dropdown.appendChild(pinBtn);
dropdown.appendChild(deleteBtn);

menuBtn.onclick = (e)=>{

e.stopPropagation();

document
.querySelectorAll(".chat-dropdown")
.forEach(menu=>{

if(menu !== dropdown){

menu.style.display = "none";

}

});

dropdown.style.display =
dropdown.style.display === "flex"
? "none"
: "flex";

};

div.onclick = ()=>{

currentChatId = chat.id;

renderChat();

};

div.appendChild(title);
div.appendChild(menuBtn);
div.appendChild(dropdown);

if(
pinnedChats.includes(chat.id)
){

pinnedContainer.appendChild(div);

}else{

historyDiv.appendChild(div);

}

});

}

/* =========================
   DELETE CONFIRM
========================= */

confirmDelete.onclick = ()=>{

if(!chatToDelete) return;

chats =
chats.filter(
chat => chat.id !== chatToDelete
);

pinnedChats =
pinnedChats.filter(
id => id !== chatToDelete
);

if(chats.length){

currentChatId = chats[0].id;

}else{

createChat();

}

saveChats();

renderHistory();

renderChat();

deleteModal.style.display = "none";

};

cancelDelete.onclick = ()=>{

deleteModal.style.display = "none";

};

/* =========================
   DISPLAY MESSAGE
========================= */

function displayMessage(text, sender){

const row =
document.createElement("div");

row.classList.add("message-row");

if(sender === "user"){

row.classList.add("user-row");

}

const avatar =
document.createElement("div");

avatar.classList.add("avatar");

avatar.innerHTML =
sender === "user"
? "👤"
: "🧠";

const bubble =
document.createElement("div");

bubble.classList.add(
"message",
sender
);

if(sender === "bot"){

bubble.innerHTML =
marked.parse(text);

}else{

bubble.textContent = text;

}

if(sender === "user"){

row.appendChild(bubble);
row.appendChild(avatar);

}else{

row.appendChild(avatar);
row.appendChild(bubble);

}

chatContainer.appendChild(row);

chatContainer.scrollTop =
chatContainer.scrollHeight;

return bubble;

}

/* =========================
   FILE PREVIEW
========================= */

function showFilePreview(fileName){

const row =
document.createElement("div");

row.classList.add(
"message-row",
"user-row"
);

const preview =
document.createElement("div");

preview.classList.add(
"file-preview"
);

preview.innerHTML =
`📎 ${fileName}`;

row.appendChild(preview);

chatContainer.appendChild(row);

chatContainer.scrollTop =
chatContainer.scrollHeight;

}

/* =========================
   RENDER CHAT
========================= */

function renderChat(){

chatContainer.innerHTML = "";

const currentChat =
chats.find(
chat => chat.id === currentChatId
);

if(
!currentChat ||
currentChat.messages.length === 0
){

welcomeScreen.style.display = "flex";

return;

}

welcomeScreen.style.display = "none";

currentChat.messages.forEach(msg=>{

displayMessage(
msg.text,
msg.sender
);

});

}

/* =========================
   ADD MESSAGE
========================= */

function addMessage(text, sender){

const currentChat =
chats.find(
chat => chat.id === currentChatId
);

if(!currentChat) return;

currentChat.messages.push({

text,
sender

});

if(
currentChat.title === "New Chat"
&&
sender === "user"
){

currentChat.title =
text.substring(0,30);

}

saveChats();

renderHistory();

return displayMessage(
text,
sender
);

}

/* =========================
   SEND MESSAGE
========================= */

function sendMessage(){

const text =
messageInput.value.trim();

if(!text) return;

welcomeScreen.style.display = "none";

addMessage(text, "user");

activeBotBubble =
displayMessage("", "bot");

activeBotBubble.innerHTML =
"Thinking...";

activeStreamText = "";

/* DOCUMENT CONTEXT */

const finalMessage =
uploadedDocumentText
?

`
DOCUMENT CONTENT:

${uploadedDocumentText}

USER QUESTION:
${text}
`

:

text;

ws.send(
JSON.stringify({

type:"user_message",

message: finalMessage

})
);

messageInput.value = "";

}

/* =========================
   EVENTS
========================= */

sendBtn.onclick =
sendMessage;

messageInput.addEventListener(
"keypress",
e=>{

if(e.key === "Enter"){

sendMessage();

}

}
);

newChatBtn.onclick = ()=>{

uploadedDocumentText = "";

createChat();

chatContainer.innerHTML = "";

welcomeScreen.style.display =
"flex";

messageInput.value = "";

};

searchInput.addEventListener(
"input",
renderHistory
);

/* =========================
   PLUS MENU
========================= */

plusBtn.onclick = (e)=>{

e.stopPropagation();

plusMenu.style.display =
plusMenu.style.display === "flex"
? "none"
: "flex";

};

window.addEventListener(
"click",
e=>{

if(
!plusMenu.contains(e.target)
&&
e.target !== plusBtn
){

plusMenu.style.display = "none";

}

});

/* =========================
   IMAGE UPLOAD
========================= */

uploadImageBtn.onclick = ()=>{

imageInput.click();

};

imageInput.onchange = async()=>{

const file =
imageInput.files[0];

if(!file) return;

showFilePreview(file.name);

messageInput.value =
`Analyze this image: ${file.name}`;

plusMenu.style.display = "none";

};

/* =========================
   FILE UPLOAD
========================= */

uploadFileBtn.onclick = ()=>{

fileInput.click();

};

fileInput.onchange = async()=>{

const file =
fileInput.files[0];

if(!file) return;

showFilePreview(file.name);

const formData =
new FormData();

formData.append(
"file",
file
);

try{

const response =
await fetch(
"http://localhost:3000/upload",
{
method:"POST",
body: formData
}
);

const data =
await response.json();

console.log(data);

if(
data.text &&
data.text.trim() !== ""
){

uploadedDocumentText =
data.text;

messageInput.value =
`
Document uploaded successfully.

Now ask:
- summarize it
- explain it
- key points
- important topics
`;

}else{

messageInput.value =
"Document text extraction failed.";

}

}catch(err){

console.log(err);

messageInput.value =
"Upload failed.";

}

plusMenu.style.display = "none";

};

/* =========================
   GENERATE IMAGE
========================= */

generateImageBtn.onclick = ()=>{

messageInput.value =
"Generate an image of ";

messageInput.focus();

plusMenu.style.display = "none";

};

/* =========================
   CLIPBOARD
========================= */

pasteBtn.onclick = async()=>{

try{

const text =
await navigator
.clipboard
.readText();

messageInput.value += text;

}catch(err){

console.log(err);

}

plusMenu.style.display = "none";

};

/* =========================
   SOCKET STREAM
========================= */

ws.onmessage = event=>{

const data =
JSON.parse(event.data);

if(data.type === "stream"){

activeStreamText +=
data.chunk;

if(activeBotBubble){

activeBotBubble.innerHTML =
marked.parse(activeStreamText);

chatContainer.scrollTop =
chatContainer.scrollHeight;

}

}

if(data.type === "stream_end"){

const currentChat =
chats.find(
chat => chat.id === currentChatId
);

if(currentChat){

currentChat.messages.push({

text: activeStreamText,

sender:"bot"

});

saveChats();

}

activeBotBubble = null;

activeStreamText = "";

}

};

/* =========================
   INIT
========================= */

if(chats.length === 0){

createChat();

}else{

currentChatId = chats[0].id;

renderHistory();

renderChat();

}