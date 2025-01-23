const localVideo = document.getElementById("localVideo");
const remoteVideo = document.getElementById("remoteVideo");
const offerTextarea = document.getElementById("offer");
const errorLog = document.getElementById("errorLog");
const offerBtn = document.getElementById("offerBtn");
const copyButton = document.getElementById("copyButton");
let localStream;
let peerConnection;
let videoEnabled = true;
let micEnabled = true;

const configuration = {
  iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
};

async function getLocalStream() {
  try {
    localStream = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: true,
    });
    localVideo.srcObject = localStream;
  } catch (error) {
    handleError(
      "Unable to access camera/microphone. Please check your permissions."
    );
    console.error(error);
  }
}

function initializePeerConnection() {
  peerConnection = new RTCPeerConnection(configuration);
  peerConnection.onicecandidate = (event) => {
    if (event.candidate) {
      offerTextarea.value = JSON.stringify(peerConnection.localDescription);
    }
  };

  peerConnection.ontrack = (event) => {
    remoteVideo.srcObject = event.streams[0];
    checkConnectionEstablished();
  };

  if (localStream) {
    localStream.getTracks().forEach((track) => {
      peerConnection.addTrack(track, localStream);
    });
  }
}

function checkConnectionEstablished() {
  if (remoteVideo.srcObject && peerConnection) {
    offerBtn.classList.add("hidden");
    // copyButton.classList.add("hidden");
  }
}

async function createOffer() {
  try {
    if (!peerConnection) initializePeerConnection();
    const offer = await peerConnection.createOffer();
    await peerConnection.setLocalDescription(offer);
    offerTextarea.value = JSON.stringify(peerConnection.localDescription);
  } catch (error) {
    handleError("Failed to create an offer.");
    console.error(error);
  }
}

async function setRemoteDescription() {
  try {
    if (!peerConnection) initializePeerConnection();
    const remoteDescription = JSON.parse(offerTextarea.value);
    await peerConnection.setRemoteDescription(
      new RTCSessionDescription(remoteDescription)
    );

    if (remoteDescription.type === "offer") {
      const answer = await peerConnection.createAnswer();
      await peerConnection.setLocalDescription(answer);
      offerTextarea.value = JSON.stringify(peerConnection.localDescription);
    }
  } catch (error) {
    handleError(
      "Failed to set remote description. Please check the SDP provided."
    );
    console.error(error);
  }
}

function handleOfferAction() {
  const offerText = offerTextarea.value.trim(); // Check if textarea is empty

  if (offerText === "") {
    createOffer(); // Create Offer if textarea is empty
  } else {
    setRemoteDescription(); // Set Remote Description if textarea contains SDP
  }
}

function copyOffer() {
  offerTextarea.select();
  document.execCommand("copy");
}

function toggleVideo() {
  videoEnabled = !videoEnabled;
  localStream
    .getVideoTracks()
    .forEach((track) => (track.enabled = videoEnabled));
  document.getElementById("toggleVideo").textContent = videoEnabled
    ? "Video: On"
    : "Video: Off";
}

function toggleMic() {
  micEnabled = !micEnabled;
  localStream.getAudioTracks().forEach((track) => (track.enabled = micEnabled));
  document.getElementById("toggleMic").textContent = micEnabled
    ? "Mic: On"
    : "Mic: Off";
}

function handleError(message) {
  errorLog.textContent = message;
  setTimeout(() => {
    errorLog.textContent = "";
  }, 5000);
}

getLocalStream();
