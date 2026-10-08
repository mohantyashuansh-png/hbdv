// ============================================================
//  audio.js — Happy Birthday Melody Synthesizer & Mic Input
// ============================================================

(function() {
  let audioCtx;

  // Simple synthesizer for Happy Birthday
  function playNote(freq, startTime, duration) {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    
    osc.type = 'sine'; // soft tone
    osc.frequency.setValueAtTime(freq, startTime);
    
    // Envelope
    gain.gain.setValueAtTime(0, startTime);
    gain.gain.linearRampToValueAtTime(0.3, startTime + 0.1);
    gain.gain.setValueAtTime(0.3, startTime + duration - 0.1);
    gain.gain.linearRampToValueAtTime(0, startTime + duration);
    
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    
    osc.start(startTime);
    osc.stop(startTime + duration);
  }

  window.playHBDSong = function() {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const now = audioCtx.currentTime;
    
    // Happy Birthday notes (C major: C4=261.63, D4=293.66, E4=329.63, F4=349.23, G4=392.00, A4=440.00, B4=493.88, C5=523.25)
    // Hap-py Birth-day to You
    // G4 G4 A4 G4 C5 B4
    const notes = [
      { f: 392.00, d: 0.3, t: 0.0 }, // Hap
      { f: 392.00, d: 0.1, t: 0.4 }, // py
      { f: 440.00, d: 0.4, t: 0.6 }, // Birth
      { f: 392.00, d: 0.4, t: 1.1 }, // day
      { f: 523.25, d: 0.4, t: 1.6 }, // to
      { f: 493.88, d: 0.8, t: 2.1 }, // you
      
      // Hap-py Birth-day to You
      // G4 G4 A4 G4 D5 C5
      { f: 392.00, d: 0.3, t: 3.1 },
      { f: 392.00, d: 0.1, t: 3.5 },
      { f: 440.00, d: 0.4, t: 3.7 },
      { f: 392.00, d: 0.4, t: 4.2 },
      { f: 587.33, d: 0.4, t: 4.7 }, // D5
      { f: 523.25, d: 0.8, t: 5.2 },
      
      // Hap-py Birth-day dear [Name]
      // G4 G4 G5 E5 C5 B4 A4
      { f: 392.00, d: 0.3, t: 6.2 },
      { f: 392.00, d: 0.1, t: 6.6 },
      { f: 783.99, d: 0.4, t: 6.8 }, // G5
      { f: 659.25, d: 0.4, t: 7.3 }, // E5
      { f: 523.25, d: 0.4, t: 7.8 }, // C5
      { f: 493.88, d: 0.4, t: 8.3 }, // B4
      { f: 440.00, d: 0.6, t: 8.8 }, // A4

      // Hap-py Birth-day to You!
      // F5 F5 E5 C5 D5 C5
      { f: 698.46, d: 0.3, t: 9.6 }, // F5
      { f: 698.46, d: 0.1, t: 10.0 },
      { f: 659.25, d: 0.4, t: 10.2 },
      { f: 523.25, d: 0.4, t: 10.7 },
      { f: 587.33, d: 0.4, t: 11.2 },
      { f: 523.25, d: 1.0, t: 11.7 },
    ];

    notes.forEach(n => {
      playNote(n.f, now + n.t, n.d);
    });
  };

  // Mic Listener for blowing candles
  let micStream = null;
  let analyser = null;
  let micDataArray = null;

  window.startMicListener = async function(onBlow) {
    try {
      micStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      
      const source = audioCtx.createMediaStreamSource(micStream);
      analyser = audioCtx.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
      
      micDataArray = new Uint8Array(analyser.frequencyBinCount);
      
      checkMicLoop(onBlow);
    } catch(err) {
      console.warn("Mic access denied or unavailable. Fallback to click to blow.", err);
      // Fallback: If they click anywhere, blow the candles
      window.addEventListener('click', function fallback() {
         onBlow(100);
         window.removeEventListener('click', fallback);
      });
    }
  };

  window.stopMicListener = function() {
    if (micStream) {
      micStream.getTracks().forEach(t => t.stop());
      micStream = null;
    }
  };

  let blowAccumulator = 0;
  function checkMicLoop(onBlow) {
    if (!micStream) return;
    
    analyser.getByteFrequencyData(micDataArray);
    let sum = 0;
    for(let i=0; i<micDataArray.length; i++) {
      sum += micDataArray[i];
    }
    let avg = sum / micDataArray.length;
    
    // If blowing into mic (loud, low-frequency rumble typically)
    if (avg > 60) {
      blowAccumulator += 5;
    } else {
      blowAccumulator = Math.max(0, blowAccumulator - 2);
    }

    onBlow(blowAccumulator);

    if (blowAccumulator < 100) {
      requestAnimationFrame(() => checkMicLoop(onBlow));
    } else {
      stopMicListener();
    }
  }

})();
