export interface CFProblem {
  contestId?: number;
  problemsetName?: string;
  index: string; // e.g. "A", "B", "C1"
  name: string;
  type: string; // e.g. "PROGRAMMING"
  points?: number;
  rating?: number; // e.g. 1200, 1600
  tags: string[]; // e.g. ["greedy", "dp", "math"]
}

export interface CFProblemStatistics {
  contestId?: number;
  index: string;
  solvedCount: number;
}

export interface CFUser {
  handle: string;
  email?: string;
  vkId?: string;
  openId?: string;
  firstName?: string;
  lastName?: string;
  country?: string;
  city?: string;
  organization?: string;
  contribution: number;
  rank: string; // e.g. "candidate master"
  maxRank: string;
  rating: number;
  maxRating: number;
  lastOnlineTimeSeconds: number;
  registrationTimeSeconds: number;
  friendOfCount: number;
  avatar: string;
  titlePhoto: string;
}

export interface CFRatingChange {
  contestId: number;
  contestName: string;
  handle: string;
  rank: number;
  ratingUpdateTimeSeconds: number;
  oldRating: number;
  newRating: number;
}

export interface CFSubmission {
  id: number;
  contestId?: number;
  creationTimeSeconds: number;
  relativeTimeSeconds: number;
  problem: CFProblem;
  author: {
    contestId?: number;
    members: { handle: string }[];
    participantType: string;
    ghost: boolean;
    startTimeSeconds?: number;
  };
  programmingLanguage: string;
  verdict: string; // e.g. "OK", "WRONG_ANSWER", "TIME_LIMIT_EXCEEDED"
  passTestCount: number;
  timeConsumedMillis: number;
  memoryConsumedBytes: number;
}

export interface SavedProblem {
  id: string; // e.g. "1923-C" (contestId-index) or index if no contest
  contestId?: number;
  index: string;
  name: string;
  rating?: number;
  tags: string[];
  savedAt: number;
  status: "todo" | "attempting" | "solved";
  notes?: string;
  difficulty?: string;
}

export interface TrainingPlan {
  id: string;
  title: string;
  targetRating: number;
  tags: string[];
  createdAt: number;
  deadline?: string;
  completed: boolean;
}
