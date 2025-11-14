    // =======================================================
// LaunchControl XL Web MIDI receiver
// Prints incoming CC + Note messages
// =======================================================

const statusEl = document.getElementById("status");
const logEl = document.getElementById("log");

function log(msg) {
  console.log(msg);
  logEl.textContent += msg + "\n";
  logEl.scrollTop = logEl.scrollHeight;
}

async function initMIDI() {
  try {
    const access = await navigator.requestMIDIAccess({ sysex: false });
    statusEl.textContent = "MIDI Ready — select your device and move a knob";

    // Listen for new devices
    access.onstatechange = evt => {
      log(`Device ${evt.port.name} — ${evt.port.state}`);
    };

    // Loop through all available inputs
    access.inputs.forEach(input => {
      log(`Connected to: ${input.name}`);
      input.onmidimessage = handleMIDI;
    });

  } catch (err) {
    statusEl.textContent = "MIDI NOT supported or blocked by browser.";
    console.error(err);
  }
}

function handleMIDI(message) {
  const [status, data1, data2] = message.data;

  // ---------------------------------------------------
  // Launchcontrol XL sends:
  // - CC (knobs, sliders): status = 176
  // - Note On/Off (buttons): status = 144 or 128
  // ---------------------------------------------------

  if (status === 176) {
    // CC message (knobs, sliders)
    log(`CC ${data1} = ${data2}`);
  }

  if (status === 144 && data2 > 0) {
    log(`Button Press — Note ${data1}`);
  }

  if (status === 128 || (status === 144 && data2 === 0)) {
    log(`Button Release — Note ${data1}`);
  }
}

initMIDI();
