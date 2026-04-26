"use client";
import { useState, useEffect } from "react";
import Image from "next/image";
import billyImg from "./Billy_Thinking.png";

type RunStatus = "running" | "awaiting_user" | "complete" | "failed" | "open" | undefined;
type AgentPhase = "intake" | "diagnosis" | "economics" | "action_plan" | "helper_routing" | "orchestrator" | string;

const GENERIC_PHRASES = [
  "pondering...",
  "thinking...",
  "let me see here...",
  "tough case...",
  "running diagnostics...",
  "hmm...",
  "on it...",
  "deep in thought...",
  "connecting the dots...",
  "cross-referencing...",
  "interesting...",
  "give me a moment...",
];

const PHASE_PHRASES: Record<string, string[]> = {
  intake: [
    "logging the evidence...",
    "gathering your details...",
    "taking case notes...",
    "filing the report...",
  ],
  diagnosis: [
    "diagnosing the issue...",
    "checking known faults...",
    "reviewing the symptoms...",
    "running the analysis...",
  ],
  economics: [
    "crunching the numbers...",
    "checking part availability...",
    "running repair estimates...",
    "weighing your options...",
  ],
  action_plan: [
    "drafting your action plan...",
    "finalizing the advice...",
    "almost there...",
    "putting it all together...",
  ],
  helper_routing: [
    "finding a specialist...",
    "matching your case...",
    "scouting repair partners...",
  ],
  orchestrator: [
    "coordinating the council...",
    "assembling the agents...",
    "orchestrating analysis...",
  ],
};

const AWAITING_PHRASES = [
  "got a question for you...",
  "need a bit more info...",
  "help me help you...",
  "one quick thing...",
];

interface BroncoAssistantProps {
  runStatus?: RunStatus;
  currentPhase?: AgentPhase;
  className?: string;
}

export function BroncoAssistant({ runStatus, currentPhase, className = "" }: BroncoAssistantProps) {
  const [phraseIdx, setPhraseIdx] = useState(0);
  const [visible, setVisible] = useState(true);

  const isRunning = runStatus === "running";
  const isAwaiting = runStatus === "awaiting_user";

  const activePhrases = isRunning
    ? [...(PHASE_PHRASES[currentPhase ?? ""] ?? []), ...GENERIC_PHRASES]
    : isAwaiting
      ? AWAITING_PHRASES
      : GENERIC_PHRASES;

  useEffect(() => {
    if (!isRunning && !isAwaiting) return;
    const timer = setInterval(() => {
      setVisible(false);
      setTimeout(() => {
        setPhraseIdx((i) => (i + 1) % activePhrases.length);
        setVisible(true);
      }, 300);
    }, 2600);
    return () => clearInterval(timer);
  }, [isRunning, isAwaiting, activePhrases.length]);

  let bubbleText: string;
  if (isRunning || isAwaiting) {
    bubbleText = activePhrases[phraseIdx] ?? "thinking...";
  } else if (runStatus === "complete") {
    bubbleText = "verdict reached!";
  } else if (runStatus === "failed") {
    bubbleText = "hmm, hit a snag...";
  } else {
    bubbleText = "ready to dig in...";
  }

  return (
    <div className={`flex items-end gap-2 select-none ${className}`}>
      {/* Billy character */}
      <div className="shrink-0 w-[108px] h-[128px] relative">
        <Image
          src={billyImg}
          alt="Billy Bronco, your repair advisor"
          fill
          className="object-contain object-bottom drop-shadow-sm"
          priority
        />
      </div>

      {/* Thought bubble connector + bubble */}
      <div className="flex flex-col items-start mb-10 -ml-1">
        {/* Connecting dots rising from Billy's head */}
        <div className="flex items-end gap-1.5 ml-2 mb-0.5">
          <div className="w-2 h-2 rounded-full bg-[#f8f3e2] border-2 border-[#2d5a3d]" />
          <div className="w-3 h-3 rounded-full bg-[#f8f3e2] border-2 border-[#2d5a3d]" />
        </div>

        {/* Main cloud bubble */}
        <div
          className="bg-[#f8f3e2] border-2 border-[#2d5a3d] rounded-[2rem] px-6 py-4 min-w-[172px] max-w-[252px] shadow-[0px_3px_12px_rgba(45,90,61,0.12)]"
          style={{ borderRadius: "2rem 2rem 2rem 0.5rem" }}
        >
          <p
            key={visible ? bubbleText : `__fade_${bubbleText}`}
            className={`text-[#1a1c18] text-base italic leading-snug ${visible ? "billy-text-enter" : "opacity-0"}`}
            style={{ fontFamily: "'Work Sans', sans-serif" }}
          >
            {bubbleText}
          </p>
        </div>
      </div>
    </div>
  );
}
