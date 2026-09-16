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
