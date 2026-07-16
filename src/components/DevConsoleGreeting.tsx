"use client";

import { useEffect } from "react";

export default function DevConsoleGreeting() {
  useEffect(() => {
    console.log(
      "%cHey, fellow builder. 👋",
      "font-size: 16px; font-weight: bold; color: #ff5a36;"
    );
    console.log(
      "%cLooking at the source instead of the site? Respect. Try the Konami code somewhere on the page.",
      "font-size: 12px; color: #8a8a86;"
    );
    console.log(
      "%cWant to talk delivery or CMS work? Scroll down to the contact form.",
      "font-size: 12px; color: #f5f3ee;"
    );
  }, []);

  return null;
}
