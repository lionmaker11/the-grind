// MediaRecorder wrapper. Phase 3.
//
// startRecording() returns a handle with:
//   .stop()   -> Promise<Blob> (the recorded audio as a single Blob)
//   .cancel() -> void (terminate recording and release the mic stream)
//
// Mime-type selection is defensive: Chrome/Firefox prefer webm/opus,
// Safari only supports mp4/aac. Fall through in that order. If the
// browser rejects all explicit mime types, let MediaRecorder pick.

const MIME_CANDIDATES = [
  'audio/webm;codecs=opus',
  'audio/webm',
  'audio/mp4;codecs=mp4a',
  'audio/mp4',
  ''
];

export function pickMimeType() {
  if (typeof MediaRecorder === 'undefined') return '';
  for (const mt of MIME_CANDIDATES) {
    if (mt === '') return '';
    try {
      if (MediaRecorder.isTypeSupported(mt)) return mt;
    } catch {
      // older browsers throw on isTypeSupported — skip candidate
    }
  }
  return '';
}

export async function startRecording() {
  if (!navigator?.mediaDevices?.getUserMedia) {
    throw new Error('microphone unavailable');
  }
  if (typeof MediaRecorder === 'undefined') {
    throw new Error('recording unsupported');
  }

  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  const mimeType = pickMimeType();
  const options = mimeType ? { mimeType } : {};

  let rec;
  try {
    rec = new MediaRecorder(stream, options);
  } catch (err) {
    stream.getTracks().forEach((t) => { try { t.stop(); } catch (_e) { /* track already stopped */ } });
    throw err;
  }

  // Phase 3 iOS diagnostic — logs the mime we asked for vs. what the
  // browser actually produced. Keep until Groq Whisper path is confirmed
  // stable on Safari.
  // eslint-disable-next-line no-console
  console.log('[voice] recorder started', {
    requestedMime: mimeType || '(browser default)',
    actualMime: rec.mimeType || '(unknown until stop)'
  });

  const chunks = [];
  rec.ondataavailable = (e) => {
    if (e && e.data && e.data.size > 0) chunks.push(e.data);
  };

  let resolveStop;
  let rejectStop;
  const stopped = new Promise((resolve, reject) => {
    resolveStop = resolve;
    rejectStop = reject;
  });

  rec.onstop = () => {
    stream.getTracks().forEach((t) => { try { t.stop(); } catch (_e) { /* track already stopped */ } });
    // Prefer the recorder's own mimeType — on Safari this is the canonical
    // string (may include codec params) that actually reflects the bytes.
    const blobType = rec.mimeType || mimeType || 'audio/webm';
    const blob = new Blob(chunks, { type: blobType });
    // eslint-disable-next-line no-console
    console.log('[voice] recorder stopped', {
      blobType: blob.type,
      blobSize: blob.size,
      chunkCount: chunks.length
    });
    resolveStop(blob);
  };
  rec.onerror = (e) => {
    stream.getTracks().forEach((t) => { try { t.stop(); } catch (_e) { /* track already stopped */ } });
    rejectStop(e?.error || new Error('recorder error'));
  };

  rec.start();

  return {
    stop: () => {
      if (rec.state !== 'inactive') {
        try { rec.stop(); } catch (e) { rejectStop(e); }
      }
      return stopped;
    },
    cancel: () => {
      if (rec.state !== 'inactive') {
        try { rec.stop(); } catch (_e) { /* inactive */ }
      }
      stream.getTracks().forEach((t) => { try { t.stop(); } catch (_e) { /* track already stopped */ } });
    }
  };
}
