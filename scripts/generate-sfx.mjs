import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';

const SAMPLE_RATE = 48_000;
const TWO_PI = Math.PI * 2;
const outputDirectory = path.resolve('public/assets/sfx');

const hashSeed = (value) => {
  let hash = 2166136261;
  for (const character of value) {
    hash ^= character.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
};

const randomSource = (seed) => {
  let state = hashSeed(seed);
  return () => {
    state += 0x6d2b79f5;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
};

const createBuffer = (duration) => new Float64Array(Math.ceil(duration * SAMPLE_RATE));

const addResonance = (
  samples,
  {
    start = 0,
    duration,
    frequency,
    endFrequency = frequency,
    amplitude,
    attack = 0.006,
    decay = duration / 4,
    modes = [
      [1, 1],
      [2.01, 0.18],
      [3.93, 0.07],
    ],
  },
) => {
  const startFrame = Math.max(0, Math.floor(start * SAMPLE_RATE));
  const frameCount = Math.min(samples.length - startFrame, Math.ceil(duration * SAMPLE_RATE));
  for (let frame = 0; frame < frameCount; frame += 1) {
    const time = frame / SAMPLE_RATE;
    const attackEnvelope = Math.sin(Math.min(1, time / Math.max(attack, 0.0001)) * (Math.PI / 2));
    const endEnvelope = Math.min(1, (duration - time) / 0.018);
    const envelope = attackEnvelope * Math.exp(-time / decay) * Math.max(0, endEnvelope);
    const phase =
      TWO_PI * (frequency * time + ((endFrequency - frequency) * time * time) / (2 * duration));
    let value = 0;
    for (const [ratio, level] of modes) value += Math.sin(phase * ratio) * level;
    samples[startFrame + frame] += value * amplitude * envelope;
  }
};

const addFilteredNoise = (
  samples,
  random,
  {
    start = 0,
    duration,
    amplitude,
    lowpass = 3500,
    highpass = 120,
    attack = 0.008,
    decay = duration / 3,
    shape = 'decay',
    flutter = 0,
  },
) => {
  const startFrame = Math.max(0, Math.floor(start * SAMPLE_RATE));
  const frameCount = Math.min(samples.length - startFrame, Math.ceil(duration * SAMPLE_RATE));
  const lowpassAlpha = 1 - Math.exp((-TWO_PI * lowpass) / SAMPLE_RATE);
  const highpassAlpha = Math.exp((-TWO_PI * highpass) / SAMPLE_RATE);
  let lowpassed = 0;
  let previousInput = 0;
  let highpassed = 0;

  for (let frame = 0; frame < frameCount; frame += 1) {
    const time = frame / SAMPLE_RATE;
    const progress = time / duration;
    const noise = random() * 2 - 1;
    highpassed = highpassAlpha * (highpassed + noise - previousInput);
    previousInput = noise;
    lowpassed += lowpassAlpha * (highpassed - lowpassed);
    const onset = Math.sin(Math.min(1, time / Math.max(attack, 0.0001)) * (Math.PI / 2));
    const ending = Math.sin(Math.min(1, (duration - time) / 0.025) * (Math.PI / 2));
    const body = shape === 'brush' ? Math.sin(Math.PI * progress) ** 0.65 : Math.exp(-time / decay);
    const texture = 1 + flutter * Math.sin(TWO_PI * (17 + 5 * progress) * time);
    samples[startFrame + frame] +=
      lowpassed * amplitude * onset * Math.max(0, ending) * body * texture;
  }
};

const addWoodTap = (samples, random, start, frequency, amplitude, duration = 0.2) => {
  addFilteredNoise(samples, random, {
    start,
    duration: Math.min(0.075, duration),
    amplitude: amplitude * 0.65,
    lowpass: 1800,
    highpass: 180,
    attack: 0.012,
    decay: 0.025,
  });
  addResonance(samples, {
    start,
    duration,
    frequency,
    endFrequency: frequency * 0.97,
    amplitude,
    attack: 0.012,
    decay: Math.min(0.05, duration / 4),
    modes: [
      [1, 1],
      [2, 0.035],
    ],
  });
};

const addCushionedImpact = (samples, random, start, amplitude, pitch = 145) => {
  addFilteredNoise(samples, random, {
    start,
    duration: 0.2,
    amplitude: amplitude * 0.9,
    lowpass: 650,
    highpass: 75,
    attack: 0.016,
    decay: 0.06,
  });
  addResonance(samples, {
    start: start + 0.008,
    duration: 0.24,
    frequency: pitch,
    endFrequency: pitch * 0.72,
    amplitude: amplitude * 0.45,
    attack: 0.018,
    decay: 0.07,
    modes: [
      [1, 1],
      [1.98, 0.12],
    ],
  });
};

const addKalimba = (samples, random, start, frequency, amplitude, duration = 0.42) => {
  addFilteredNoise(samples, random, {
    start,
    duration: 0.05,
    amplitude: amplitude * 0.12,
    lowpass: 2400,
    highpass: 250,
    attack: 0.012,
    decay: 0.016,
  });
  addResonance(samples, {
    start,
    duration,
    frequency,
    endFrequency: frequency * 0.997,
    amplitude,
    attack: 0.012,
    decay: duration / 5.5,
    modes: [
      [1, 1],
      [2, 0.06],
      [3, 0.018],
    ],
  });
};

const highpass = (samples, cutoff = 80) => {
  const alpha = Math.exp((-TWO_PI * cutoff) / SAMPLE_RATE);
  let previousInput = 0;
  let previousOutput = 0;
  for (let index = 0; index < samples.length; index += 1) {
    const input = samples[index];
    const output = alpha * (previousOutput + input - previousInput);
    samples[index] = output;
    previousInput = input;
    previousOutput = output;
  }
};

const lowpass = (samples, cutoff = 3200) => {
  const alpha = 1 - Math.exp((-TWO_PI * cutoff) / SAMPLE_RATE);
  let value = 0;
  for (let index = 0; index < samples.length; index += 1) {
    value += alpha * (samples[index] - value);
    samples[index] = value;
  }
};

const finalize = (samples, peakDb) => {
  highpass(samples);
  lowpass(samples);
  const fadeInFrames = Math.floor(0.01 * SAMPLE_RATE);
  const fadeOutFrames = Math.floor(0.025 * SAMPLE_RATE);
  for (let index = 0; index < fadeInFrames; index += 1) {
    samples[index] *= Math.sin((index / fadeInFrames) * (Math.PI / 2));
  }
  for (let index = 0; index < fadeOutFrames; index += 1) {
    const frame = samples.length - 1 - index;
    samples[frame] *= Math.sin((index / fadeOutFrames) * (Math.PI / 2));
  }
  let peak = 0;
  for (const sample of samples) peak = Math.max(peak, Math.abs(sample));
  const target = 10 ** (peakDb / 20);
  const initialScale = peak > 0 ? target / peak : 1;
  for (let index = 0; index < samples.length; index += 1) {
    samples[index] = Math.tanh(samples[index] * initialScale * 1.02) / 1.02;
  }
  peak = 0;
  for (const sample of samples) peak = Math.max(peak, Math.abs(sample));
  const finalScale = peak > 0 ? target / peak : 1;
  for (let index = 0; index < samples.length; index += 1) samples[index] *= finalScale;
};

const encodeWav = (samples) => {
  const bytesPerSample = 2;
  const dataSize = samples.length * bytesPerSample;
  const wav = Buffer.alloc(44 + dataSize);
  wav.write('RIFF', 0);
  wav.writeUInt32LE(36 + dataSize, 4);
  wav.write('WAVE', 8);
  wav.write('fmt ', 12);
  wav.writeUInt32LE(16, 16);
  wav.writeUInt16LE(1, 20);
  wav.writeUInt16LE(1, 22);
  wav.writeUInt32LE(SAMPLE_RATE, 24);
  wav.writeUInt32LE(SAMPLE_RATE * bytesPerSample, 28);
  wav.writeUInt16LE(bytesPerSample, 32);
  wav.writeUInt16LE(16, 34);
  wav.write('data', 36);
  wav.writeUInt32LE(dataSize, 40);
  for (let index = 0; index < samples.length; index += 1) {
    const sample = Math.max(-1, Math.min(1, samples[index]));
    wav.writeInt16LE(Math.round(sample * (sample < 0 ? 32768 : 32767)), 44 + index * 2);
  }
  return wav;
};

const effects = [
  {
    name: 'piece_pick',
    duration: 0.28,
    peakDb: -20,
    render(samples, random) {
      addFilteredNoise(samples, random, {
        duration: 0.11,
        amplitude: 0.18,
        lowpass: 1800,
        highpass: 280,
        attack: 0.012,
        decay: 0.04,
      });
      addResonance(samples, {
        start: 0.018,
        duration: 0.14,
        frequency: 160,
        endFrequency: 210,
        amplitude: 0.08,
        attack: 0.014,
        decay: 0.045,
        modes: [[1, 1]],
      });
      addWoodTap(samples, random, 0.105, 460, 0.09, 0.13);
    },
  },
  {
    name: 'piece_drop',
    duration: 0.42,
    peakDb: -17,
    render(samples, random) {
      addCushionedImpact(samples, random, 0.012, 0.32, 120);
      addWoodTap(samples, random, 0.075, 285, 0.04, 0.16);
    },
  },
  {
    name: 'piece_swap',
    duration: 0.62,
    peakDb: -17.5,
    render(samples, random) {
      addCushionedImpact(samples, random, 0.012, 0.25, 125);
      addWoodTap(samples, random, 0.215, 400, 0.04, 0.13);
      addCushionedImpact(samples, random, 0.305, 0.27, 110);
    },
  },
  {
    name: 'piece_return',
    duration: 0.56,
    peakDb: -18,
    render(samples, random) {
      addFilteredNoise(samples, random, {
        start: 0.008,
        duration: 0.34,
        amplitude: 0.16,
        lowpass: 2200,
        highpass: 240,
        attack: 0.018,
        decay: 0.2,
        shape: 'brush',
        flutter: 0.16,
      });
      addCushionedImpact(samples, random, 0.315, 0.2, 105);
    },
  },
  {
    name: 'note_open',
    duration: 0.68,
    peakDb: -18,
    render(samples, random) {
      for (const [start, level, cutoff] of [
        [0.008, 0.12, 2800],
        [0.095, 0.08, 2500],
        [0.19, 0.06, 2200],
        [0.29, 0.04, 2000],
      ]) {
        addFilteredNoise(samples, random, {
          start,
          duration: 0.19,
          amplitude: level,
          lowpass: cutoff,
          highpass: 300,
          attack: 0.014,
          decay: 0.065,
          flutter: 0.22,
        });
      }
      addCushionedImpact(samples, random, 0.37, 0.08, 135);
    },
  },
  {
    name: 'board_incorrect',
    duration: 0.82,
    peakDb: -15.5,
    render(samples, random) {
      addWoodTap(samples, random, 0.012, 310, 0.16, 0.22);
      addWoodTap(samples, random, 0.31, 255, 0.17, 0.25);
      addCushionedImpact(samples, random, 0.555, 0.1, 98);
    },
  },
  {
    name: 'hint_reveal',
    duration: 0.82,
    peakDb: -18,
    render(samples, random) {
      addKalimba(samples, random, 0.012, 440, 0.14, 0.34);
      addKalimba(samples, random, 0.235, 523.25, 0.06, 0.25);
      addKalimba(samples, random, 0.405, 659.25, 0.04, 0.22);
    },
  },
  {
    name: 'success',
    duration: 1.42,
    peakDb: -13,
    render(samples, random) {
      addKalimba(samples, random, 0.012, 392, 0.15, 0.48);
      addKalimba(samples, random, 0.245, 493.88, 0.17, 0.48);
      addKalimba(samples, random, 0.485, 587.33, 0.18, 0.55);
      addFilteredNoise(samples, random, {
        start: 0.75,
        duration: 0.26,
        amplitude: 0.12,
        lowpass: 1800,
        highpass: 130,
        attack: 0.009,
        decay: 0.065,
      });
      addCushionedImpact(samples, random, 0.775, 0.25, 105);
      addWoodTap(samples, random, 0.815, 240, 0.04, 0.22);
    },
  },
  {
    name: 'ui_tap',
    duration: 0.18,
    peakDb: -22,
    render(samples, random) {
      addCushionedImpact(samples, random, 0.006, 0.07, 140);
      addWoodTap(samples, random, 0.018, 420, 0.06, 0.1);
    },
  },
];

mkdirSync(outputDirectory, { recursive: true });
for (const effect of effects) {
  const samples = createBuffer(effect.duration);
  effect.render(samples, randomSource(effect.name));
  finalize(samples, effect.peakDb);
  const outputPath = path.join(outputDirectory, `${effect.name}.wav`);
  writeFileSync(outputPath, encodeWav(samples));
  const size = Math.round((44 + samples.length * 2) / 1024);
  process.stdout.write(
    `${effect.name.padEnd(16)} ${effect.duration.toFixed(2)} s  ${effect.peakDb.toFixed(1)} dBFS  ${size} KiB\n`,
  );
}
