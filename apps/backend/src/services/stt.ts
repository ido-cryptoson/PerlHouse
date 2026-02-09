import speech from '@google-cloud/speech';

const client = new speech.SpeechClient();

export async function transcribeVoiceNote(audioBuffer: Buffer): Promise<string> {
  const audioBytes = audioBuffer.toString('base64');

  const [response] = await client.recognize({
    audio: { content: audioBytes },
    config: {
      encoding: 'OGG_OPUS' as const,
      sampleRateHertz: 16000,
      languageCode: 'he-IL',
      enableAutomaticPunctuation: true,
    },
  });

  const transcription = response.results
    ?.map((result) => result.alternatives?.[0]?.transcript ?? '')
    .join(' ')
    .trim() ?? '';

  if (!transcription) console.warn('[STT] Empty transcription');
  return transcription;
}
