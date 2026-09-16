export type Finger =
  | "left-pinky"
  | "left-ring"
  | "left-middle"
  | "left-index"
  | "thumb"
  | "right-index"
  | "right-middle"
  | "right-ring"
  | "right-pinky";

export type FingerInfo = {
  finger: Finger;
  nameKm: string;
  handKm: string;
  code: string;
};

const FINGER_MAP: Record<string, { finger: Finger; nameKm: string; handKm: string }> = {
  // Left Pinky
  "`": { finger: "left-pinky", nameKm: "ម្រាមកូនដៃ", handKm: "ដៃឆ្វេង" },
  "~": { finger: "left-pinky", nameKm: "ម្រាមកូនដៃ", handKm: "ដៃឆ្វេង" },
  "1": { finger: "left-pinky", nameKm: "ម្រាមកូនដៃ", handKm: "ដៃឆ្វេង" },
  q: { finger: "left-pinky", nameKm: "ម្រាមកូនដៃ", handKm: "ដៃឆ្វេង" },
  a: { finger: "left-pinky", nameKm: "ម្រាមកូនដៃ", handKm: "ដៃឆ្វេង" },
  z: { finger: "left-pinky", nameKm: "ម្រាមកូនដៃ", handKm: "ដៃឆ្វេង" },

  // Left Ring
  "2": { finger: "left-ring", nameKm: "ម្រាមនាងដៃ", handKm: "ដៃឆ្វេង" },
  w: { finger: "left-ring", nameKm: "ម្រាមនាងដៃ", handKm: "ដៃឆ្វេង" },
  s: { finger: "left-ring", nameKm: "ម្រាមនាងដៃ", handKm: "ដៃឆ្វេង" },
  x: { finger: "left-ring", nameKm: "ម្រាមនាងដៃ", handKm: "ដៃឆ្វេង" },

  // Left Middle
  "3": { finger: "left-middle", nameKm: "ម្រាមកណ្តាល", handKm: "ដៃឆ្វេង" },
  e: { finger: "left-middle", nameKm: "ម្រាមកណ្តាល", handKm: "ដៃឆ្វេង" },
  d: { finger: "left-middle", nameKm: "ម្រាមកណ្តាល", handKm: "ដៃឆ្វេង" },
  c: { finger: "left-middle", nameKm: "ម្រាមកណ្តាល", handKm: "ដៃឆ្វេង" },

  // Left Index
  "4": { finger: "left-index", nameKm: "ម្រាមចង្អុលដៃ", handKm: "ដៃឆ្វេង" },
  "5": { finger: "left-index", nameKm: "ម្រាមចង្អុលដៃ", handKm: "ដៃឆ្វេង" },
  r: { finger: "left-index", nameKm: "ម្រាមចង្អុលដៃ", handKm: "ដៃឆ្វេង" },
  t: { finger: "left-index", nameKm: "ម្រាមចង្អុលដៃ", handKm: "ដៃឆ្វេង" },
  f: { finger: "left-index", nameKm: "ម្រាមចង្អុលដៃ", handKm: "ដៃឆ្វេង" },
  g: { finger: "left-index", nameKm: "ម្រាមចង្អុលដៃ", handKm: "ដៃឆ្វេង" },
  v: { finger: "left-index", nameKm: "ម្រាមចង្អុលដៃ", handKm: "ដៃឆ្វេង" },
  b: { finger: "left-index", nameKm: "ម្រាមចង្អុលដៃ", handKm: "ដៃឆ្វេង" },

  // Thumbs
  space: { finger: "thumb", nameKm: "មេដៃ", handKm: "ដៃឆ្វេង ឬស្តាំ" },

  // Right Index
  "6": { finger: "right-index", nameKm: "ម្រាមចង្អុលដៃ", handKm: "ដៃស្តាំ" },
  "7": { finger: "right-index", nameKm: "ម្រាមចង្អុលដៃ", handKm: "ដៃស្តាំ" },
  y: { finger: "right-index", nameKm: "ម្រាមចង្អុលដៃ", handKm: "ដៃស្តាំ" },
  u: { finger: "right-index", nameKm: "ម្រាមចង្អុលដៃ", handKm: "ដៃស្តាំ" },
  h: { finger: "right-index", nameKm: "ម្រាមចង្អុលដៃ", handKm: "ដៃស្តាំ" },
  j: { finger: "right-index", nameKm: "ម្រាមចង្អុលដៃ", handKm: "ដៃស្តាំ" },
  n: { finger: "right-index", nameKm: "ម្រាមចង្អុលដៃ", handKm: "ដៃស្តាំ" },
  m: { finger: "right-index", nameKm: "ម្រាមចង្អុលដៃ", handKm: "ដៃស្តាំ" },

  // Right Middle
  "8": { finger: "right-middle", nameKm: "ម្រាមកណ្តាល", handKm: "ដៃស្តាំ" },
  i: { finger: "right-middle", nameKm: "ម្រាមកណ្តាល", handKm: "ដៃស្តាំ" },
  k: { finger: "right-middle", nameKm: "ម្រាមកណ្តាល", handKm: "ដៃស្តាំ" },
  ",": { finger: "right-middle", nameKm: "ម្រាមកណ្តាល", handKm: "ដៃស្តាំ" },

  // Right Ring
  "9": { finger: "right-ring", nameKm: "ម្រាមនាងដៃ", handKm: "ដៃស្តាំ" },
  o: { finger: "right-ring", nameKm: "ម្រាមនាងដៃ", handKm: "ដៃស្តាំ" },
  l: { finger: "right-ring", nameKm: "ម្រាមនាងដៃ", handKm: "ដៃស្តាំ" },
  ".": { finger: "right-ring", nameKm: "ម្រាមនាងដៃ", handKm: "ដៃស្តាំ" },

  // Right Pinky
  "0": { finger: "right-pinky", nameKm: "ម្រាមកូនដៃ", handKm: "ដៃស្តាំ" },
  "-": { finger: "right-pinky", nameKm: "ម្រាមកូនដៃ", handKm: "ដៃស្តាំ" },
  "=": { finger: "right-pinky", nameKm: "ម្រាមកូនដៃ", handKm: "ដៃស្តាំ" },
  p: { finger: "right-pinky", nameKm: "ម្រាមកូនដៃ", handKm: "ដៃស្តាំ" },
  "[": { finger: "right-pinky", nameKm: "ម្រាមកូនដៃ", handKm: "ដៃស្តាំ" },
  "]": { finger: "right-pinky", nameKm: "ម្រាមកូនដៃ", handKm: "ដៃស្តាំ" },
  "\\": { finger: "right-pinky", nameKm: "ម្រាមកូនដៃ", handKm: "ដៃស្តាំ" },
  ";": { finger: "right-pinky", nameKm: "ម្រាមកូនដៃ", handKm: "ដៃស្តាំ" },
  "'": { finger: "right-pinky", nameKm: "ម្រាមកូនដៃ", handKm: "ដៃស្តាំ" },
  "/": { finger: "right-pinky", nameKm: "ម្រាមកូនដៃ", handKm: "ដៃស្តាំ" },
};

export function getFingerGuide(code: string | undefined): FingerInfo | null {
  if (!code) return null;
  const match = FINGER_MAP[code.toLowerCase()];
  if (!match) return null;
  return {
    ...match,
    code,
  };
}

/**
 * Mapping helper: Given key code and whether Shift is needed,
 * returns which fingers on left and right hands should highlight.
 * 1: Thumb, 2: Index, 3: Middle, 4: Ring, 5: Pinky
 */
export function getKeyHandFingers(
  code: string | undefined,
  requiresShift = false,
): { leftFingers: number[]; rightFingers: number[] } {
  if (!code) {
    return { leftFingers: [], rightFingers: [] };
  }

  const norm = code.toLowerCase();
  const leftFingers: number[] = [];
  const rightFingers: number[] = [];

  // 1. Target Key Finger
  if (norm === " " || norm === "space") {
    // Space uses thumb
    rightFingers.push(1);
  } else if (["`", "~", "1", "q", "a", "z", "tab", "capslock", "shiftleft"].includes(norm)) {
    leftFingers.push(5);
  } else if (["2", "@", "w", "s", "x"].includes(norm)) {
    leftFingers.push(4);
  } else if (["3", "#", "e", "d", "c"].includes(norm)) {
    leftFingers.push(3);
  } else if (["4", "$", "5", "%", "r", "t", "f", "g", "v", "b"].includes(norm)) {
    leftFingers.push(2);
  } else if (["6", "^", "7", "&", "y", "u", "h", "j", "n", "m"].includes(norm)) {
    rightFingers.push(2);
  } else if (["8", "*", "i", "k", ","].includes(norm)) {
    rightFingers.push(3);
  } else if (["9", "(", "o", "l", "."].includes(norm)) {
    rightFingers.push(4);
  } else if (
    [
      "0",
      ")",
      "-",
      "_",
      "=",
      "+",
      "p",
      "[",
      "]",
      "{",
      "}",
      "\\",
      "|",
      ";",
      ":",
      "'",
      '"',
      "/",
      "?",
      "enter",
      "backspace",
      "shiftright",
    ].includes(norm)
  ) {
    rightFingers.push(5);
  }

  // 2. Shift Key Pinky Coordination:
  // If target key is on left hand -> Right pinky holds ShiftRight
  // If target key is on right hand -> Left pinky holds ShiftLeft
  if (requiresShift) {
    const isLeftHandKey = [
      "`",
      "~",
      "1",
      "2",
      "3",
      "4",
      "5",
      "q",
      "w",
      "e",
      "r",
      "t",
      "a",
      "s",
      "d",
      "f",
      "g",
      "z",
      "x",
      "c",
      "v",
      "b",
    ].includes(norm);

    if (isLeftHandKey) {
      if (!rightFingers.includes(5)) rightFingers.push(5);
    } else {
      if (!leftFingers.includes(5)) leftFingers.push(5);
    }
  }

  return { leftFingers, rightFingers };
}
