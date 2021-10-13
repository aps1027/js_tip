const chatForm = document.getElementById("chat-form");
const chatMessages = document.querySelector(".chat-messages");
const roomName = document.getElementById("room-name");
const userList = document.getElementById("users");
const mediaConnection = null;
// Get username and room from URL
const { username, room } = Qs.parse(location.search, {
  ignoreQueryPrefix: true,
});

console.log({ username, room });

const socket = io();

// Join chatroom
socket.emit("joinRoom", { username, room });

// Get room and users
socket.on("roomUsers", ({ room, users }) => {
  outputRoomName(room);
  outputUsers(users);
});

// Message from server
socket.on("message", (message) => {
  console.log(message);
  outputMessage(message);

  // Scroll down
  chatMessages.scrollTop = chatMessages.scrollHeight;
});

socket.on("vCall", (call) => {
  console.log(call);

  let localStream;
  // camera image acquisition
  navigator.mediaDevices
    .getUserMedia({ video: true, audio: true })
    .then((stream) => {
      // On success, the video element is set to a camera image and played back.
      const videoElm = document.getElementById("my-video");
      videoElm.srcObject = stream;
      videoElm.play();
      // Save the camera image to a global variable so that it can be returned to the other party when a call comes in.
      localStream = stream;
    })
    .catch((error) => {
      // Outputs error log in case of failure.
      console.error("mediaDevice.getUserMedia() error:", error);
      return;
    });

  mediaConnection = peer.call(call.id, localStream);
  setEventListener(mediaConnection);

  // Function to set an event listener
  const setEventListener = (mediaConnection) => {
    mediaConnection.on("stream", (stream) => {
      // Set a camera image to the video element and play it
      const videoElm = document.getElementById("their-video");
      videoElm.srcObject = stream;
      videoElm.play();
    });
  };
});

// Message submit
chatForm.addEventListener("submit", (e) => {
  e.preventDefault();

  // Get message text
  let msg = e.target.elements.msg.value;

  msg = msg.trim();

  if (!msg) {
    return false;
  }

  // Emit message to server
  socket.emit("chatMessage", msg);

  // Clear input
  e.target.elements.msg.value = "";
  e.target.elements.msg.focus();
});

// Output message to DOM
function outputMessage(message) {
  const div = document.createElement("div");
  div.classList.add("message");
  const p = document.createElement("p");
  p.classList.add("meta");
  p.innerText = message.username;
  p.innerHTML += `<span>${message.time}</span>`;
  div.appendChild(p);
  const para = document.createElement("p");
  para.classList.add("text");
  para.innerText = message.text;
  div.appendChild(para);
  document.querySelector(".chat-messages").appendChild(div);
}

// Add room name to DOM
function outputRoomName(room) {
  roomName.innerText = room;
}

// Add users to DOM
function outputUsers(users) {
  console.log({ users });
  userList.innerHTML = "";
  users.forEach((user) => {
    const li = document.createElement("li");
    li.innerText = user.username;
    userList.appendChild(li);
  });
}

//Prompt the user before leave chat room
document.getElementById("leave-btn").addEventListener("click", () => {
  const leaveRoom = confirm("Are you sure you want to leave the chatroom?");
  if (leaveRoom) {
    window.location = "../index.html";
  } else {
  }
});

let peerId = "";
//Peer作成
const peer = new Peer({
  key: "8a40fcfb-b80e-468e-9c56-34f381c056ae",
  debug: 3,
});

//PeerID取得
peer.on("open", () => {
  peerId = peer.id;
});

// Inbound processing
peer.on("call", (mediaConnection) => {
  mediaConnection.answer(localStream);
  setEventListener(mediaConnection);
});

peer.on("error", (err) => {
  alert(err.message);
});

peer.on("close", () => {
  alert("We have lost communication.");
});

var VCall = document.getElementById("v_call");
VCall.addEventListener("click", function (e) {
  socket.emit("callVideo", peerId);
});
