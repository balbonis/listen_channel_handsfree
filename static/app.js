let mediaRecorder = null;
let chunks = [];

let handsFree = false;
let isProcessing = false;
let isSpeaking = false;

const recordBtn = document.getElementById("recordBtn");
const statusEl = document.getElementById("status");
const userTextEl = document.getElementById("userText");
const replyTextEl = document.getElementById("replyText");
const replyAudioEl = document.getElementById("replyAudio");
const aiStatusEl = document.getElementById("aiStatus");
const handsFreeToggle = document.getElementById("handsFreeToggle");

// ---- AI status helpers ----
function setAIStatus(mode, label) {
  aiStatusEl.className = `status status-${mode}`;
  aiStatusEl.querySelector(".label").textContent = label;
}

// ---- Typewriter for reply text ----
function typewriter(element, text, speed = 20) {
  element.textContent = "";
  let i = 0;
  function tick() {
    if (i < text.length) {
      element.textContent += text[i];
      i += 1;
      setTimeout(tick, speed);
    }
  }
  tick();
}

// ---- Recording helpers ----
function isRecording() {
  return mediaRecorder && mediaRecorder.state === "recording";
}

async function startRecording() {
  if (isProcessing || isSpeaking) return;

  chunks = [];
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  mediaRecorder = new MediaRecorder(stream);

  mediaRecorder.ondataavailable = (e) => {
    if (e.data && e.data.size > 0) {
      chunks.push(e.data);
    }
  };

  mediaRecorder.onstop = async () => {
    recordBtn.classList.remove("recording");
    recordBtn.textContent = "🎙 Start Recording";

    isProcessing = true;
    setAIStatus("thinking", "Thinking…");
    statusEl.textContent = "Uploading audio and waiting for AI reply...";

    const blob = new Blob(chunks, { type: "audio/webm" });
    const formData = new FormData();
    formData.append("audio", blob, "recording.webm");

    try {
      const res = await fetch("/api/voice", {
        method: "POST",
        body: formData,
      });

      let data;
      try {
        data = await res.json();
      } catch (e) {
        console.error("Failed to parse JSON:", e);
        statusEl.textContent = "Backend returned non-JSON error.";
        setAIStatus("idle", "Idle");
        isProcessing = false;
        return;
      }

      if (!res.ok || data.error) {
        console.error("API error:", data);
        statusEl.textContent = "Error: " + (data.error || res.status);
        setAIStatus("idle", "Idle");
        isProcessing = false;
        return;
      }

      userTextEl.textContent = data.user_text || "";
      const reply = data.reply_text || "";
      typewriter(replyTextEl, reply);

      if (data.audio_base64 && data.audio_mime) {
        const src = `data:${data.audio_mime};base64,${data.audio_base64}`;
        replyAudioEl.src = src;
        isSpeaking = true;
        setAIStatus("speaking", "Speaking…");
        replyAudioEl.play();
      } else {
        setAIStatus("idle", "Idle");
      }

      statusEl.textContent = "Done.";
    } catch (err) {
      console.error("Fetch error:", err);
      statusEl.textContent = "Network/Fetch error. See console.";
      setAIStatus("idle", "Idle");
    } finally {
      isProcessing = false;
    }
  };

  // Start recording & update UI
  mediaRecorder.start();
  recordBtn.classList.add("recording");
  recordBtn.textContent = "⏹ Stop Recording";
  statusEl.textContent = "Listening… speak now.";
  setAIStatus("listening", "Listening…");
}

function stopRecording() {
  if (mediaRecorder && mediaRecorder.state !== "inactive") {
    mediaRecorder.stop();
  }
}

// Hands-Free toggle
handsFreeToggle.addEventListener("change", () => {
  handsFree = handsFreeToggle.checked;
});

// After AI finishes speaking, optionally auto-listen again
replyAudioEl.addEventListener("ended", () => {
  isSpeaking = false;
  setAIStatus("idle", "Idle");

  if (handsFree && !isProcessing) {
    setTimeout(() => {
      startRecording().catch((err) => {
        console.error("Error starting recording:", err);
      });
    }, 400);
  }
});

// Button click
recordBtn.addEventListener("click", () => {
  if (!isRecording()) {
    startRecording().catch((err) => {
      console.error("Error starting recording:", err);
      statusEl.textContent = "Cannot access microphone.";
      recordBtn.classList.remove("recording");
      recordBtn.textContent = "🎙 Start Recording";
      setAIStatus("idle", "Idle");
    });
  } else {
    stopRecording();
  }
});

// initial state
setAIStatus("idle", "Idle");
statusEl.textContent = "Click the mic to start talking to your AI.";
