import React, { createContext, useContext, useState } from "react";

interface LearnerContextValue {
  learnerId: string;
  setLearnerId: (id: string) => void;
}

const LearnerContext = createContext<LearnerContextValue | null>(null);

export function LearnerProvider({ children }: { children: React.ReactNode }) {
  const [learnerId, setLearnerId] = useState(localStorage.getItem("mentra_learner_id") ?? "u_amy");

  const update = (id: string) => {
    localStorage.setItem("mentra_learner_id", id);
    setLearnerId(id);
  };

  return <LearnerContext.Provider value={{ learnerId, setLearnerId: update }}>{children}</LearnerContext.Provider>;
}

export function useLearner() {
  const ctx = useContext(LearnerContext);
  if (!ctx) throw new Error("useLearner must be used within LearnerProvider");
  return ctx;
}
