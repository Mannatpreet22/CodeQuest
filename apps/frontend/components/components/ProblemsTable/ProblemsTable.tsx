
'use client';

import Link from "next/link";
import React, { useEffect, useMemo, useState } from "react";
import { BsCheckCircle } from "react-icons/bs";
import { DBProblem } from "@/utils/utils/types/problem";
import { StorageService } from "@/utils/storage";
import { getAllQuestions } from "@/hooks/hooks/getProblemData";

// -----------------------------
// Helpers
// -----------------------------
function hashString(str: string) {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = (h << 5) - h + str.charCodeAt(i);
    h |= 0; // Convert to 32bit int
  }
  return Math.abs(h);
}

function getAcceptanceNumber(id: string) {
  // Stable pseudo-random 34.0% – 69.9%
  const h = hashString(id);
  return 34 + (h % 360) / 10;
}

function getDifficultyStyles(diff: "Easy" | "Medium" | "Hard") {
  return diff === "Easy"
    ? "text-dark-green-s bg-dark-green-s/10 border-dark-green-s/20"
    : diff === "Medium"
    ? "text-dark-yellow bg-dark-yellow/10 border-dark-yellow/20"
    : "text-dark-pink bg-dark-pink/10 border-dark-pink/20";
}

// -----------------------------
// Component
// -----------------------------

type ProblemsTableProps = { query?: string };

const ProblemsTable: React.FC<ProblemsTableProps> = ({ query: externalQuery }) => {
  const { problemsList, loading } = useGetProblems();
  const solvedProblems = useGetSolvedProblems();

  // UI state (search + difficulty filter + sort)
  const [query, setQuery] = useState(externalQuery ?? "");
  const [difficulty, setDifficulty] = useState<"All" | "Easy" | "Medium" | "Hard">("All");
  const [sort, setSort] = useState<"Default">("Default");

  // Sync with parent-provided search query if present
  useEffect(() => {
    if (typeof externalQuery === "string") setQuery(externalQuery);
  }, [externalQuery]);
  const controlledByParent = typeof externalQuery === "string";

  const prepared = useMemo(() => {
    let list = problemsList.map((p) => ({
      ...p,
      acceptance: getAcceptanceNumber(p.id),
      freqBars: (hashString(p.id) % 9) as number, // 0..8
    }));

    if (difficulty !== "All") list = list.filter((p) => p.difficulty === difficulty);
    if (query.trim())
      list = list.filter((p) =>
        `${p.order}. ${p.title}`.toLowerCase().includes(query.trim().toLowerCase())
      );

    // Default sort is fine

    return list;
  }, [problemsList, query, difficulty, sort]);

  if (loading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 8 }).map((_, idx) => (
          <div
            key={idx}
            className="bg-dark-fill-3 rounded-lg p-4 animate-pulse border border-dark-divider-border-2"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-5 h-5 bg-dark-fill-2 rounded-full" />
                <div className="h-5 bg-dark-fill-2 rounded w-72" />
              </div>
              <div className="flex items-center space-x-6">
                <div className="h-4 bg-dark-fill-2 rounded w-16" />
                <div className="h-4 bg-dark-fill-2 rounded w-12" />
                <div className="flex space-x-1">
                  {Array.from({ length: 8 }).map((_, i) => (
                    <div key={i} className="w-1 h-4 bg-dark-fill-2 rounded-sm" />
                  ))}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-2">
          {(["All", "Easy", "Medium", "Hard"] as const).map((d) => (
            <button
              key={d}
              onClick={() => setDifficulty(d)}
              className={`px-3 py-1 rounded-full border text-sm transition-colors ${
                difficulty === d
                  ? "border-brand-orange/40 bg-dark-fill-3 text-brand-orange"
                  : "border-dark-divider-border-2 text-dark-label-2 hover:border-brand-orange/30"
              }`}
            >
              {d === "Medium" ? "Med." : d}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          {!controlledByParent && (
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search questions"
              className="w-full md:w-80 px-3 py-2 rounded-lg bg-dark-fill-3 border border-dark-divider-border-2 text-dark-label-2 placeholder:text-dark-label-2/60 focus:outline-none focus:border-brand-orange/50"
            />
          )}
        </div>
      </div>

      {/* Header row */}
      <div className="hidden md:flex items-center justify-between px-4 py-2 text-[11px] uppercase tracking-wide text-dark-label-2 bg-dark-fill-3 border border-dark-divider-border-2 rounded-lg sticky top-0 z-10">
        <div className="w-6" />
        <div className="flex-1">Title</div>
        <div className="w-28 flex justify-center items-center">Difficulty</div>
        <div className="w-32 text-right">Frequency</div>
      </div>

      {/* Rows */}
      {prepared.map((problem, idx) => {
        const isSolved = solvedProblems.includes(problem.id);
        const difficultyColor = getDifficultyStyles(problem.difficulty as "Easy" | "Medium" | "Hard");

        return (
          <div
            key={problem.id}
            className="group bg-dark-fill-3 hover:bg-dark-fill-2 rounded-lg p-4 transition-all duration-200 cursor-pointer border border-dark-divider-border-2 hover:border-brand-orange/50"
          >
            <div className="flex items-center justify-between">
              {/* Left: status + title */}
              <div className="flex items-center space-x-4 flex-1 min-w-0">
                <div className="flex-shrink-0">
                  {isSolved ? (
                    <div className='w-6 h-6 bg-dark-green-s/20 rounded-full flex items-center justify-center'>
                      <BsCheckCircle className='text-dark-green-s text-lg' />
                    </div>
                  ) : (
                    <div className='w-6 h-6' />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  {problem.link ? (
                    <Link
                      href={problem.link}
                      className="text-dark-label-2 hover:text-brand-orange transition-colors font-medium truncate block group-hover:scale-[1.01] transform duration-200"
                      target="_blank"
                    >
                      {problem.order}. {problem.title}
                    </Link>
                  ) : (
                    <Link
                      className="text-dark-label-2 hover:text-brand-orange transition-colors font-medium truncate block group-hover:scale-[1.01] transform duration-200"
                      href={`/problems/${problem.id}`}
                    >
                      {problem.order}. {problem.title}
                    </Link>
                  )}
                </div>
              </div>

              {/* Right: difficulty + frequency */}
              <div className="flex items-center space-x-6">
                <div className={`text-sm font-medium px-3 py-1 rounded-lg border ${difficultyColor} w-28 flex justify-center items-center`}>
                  {problem.difficulty === "Medium" ? "Med." : problem.difficulty}
                </div>

                <div className="flex items-center space-x-1 w-32 justify-end">
                  {Array.from({ length: 8 }).map((_, i) => (
                    <div
                      key={i}
                      className={`w-1 h-4 rounded-sm transition-colors duration-200 ${
                        i < problem.freqBars ? "bg-brand-orange/60" : "bg-dark-fill-2 group-hover:bg-dark-fill-3"
                      }`}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        );
      })}

      {/* Empty state */}
      {!prepared.length && (
        <div className="px-4 py-10 text-center border border-dark-divider-border-2 rounded-lg bg-dark-fill-3 text-dark-label-2">
          No problems found. Try a different search or filter.
        </div>
      )}
    </div>
  );
};

export default ProblemsTable;

// -----------------------------
// Hooks
// -----------------------------
function useGetProblems() {
  const [problemsList, setProblemsList] = useState<DBProblem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const getProblems = async () => {
      setLoading(true);
      try {
        const questions = await getAllQuestions();
        if (questions) {
          const problemsArray: DBProblem[] = questions.map((question, index) => ({
            id: question.id,
            title: question.title,
            category: "Array",
            difficulty: (["Easy", "Medium", "Hard"] as const)[index % 3],
            likes: 0,
            dislikes: 0,
            order: index + 1,
            videoId: undefined,
            link: undefined,
          }));
          setProblemsList(problemsArray);
        } else {
          console.error("Failed to fetch problems from database");
          setProblemsList([]);
        }
      } catch (error) {
        console.error("Error fetching problems:", error);
        setProblemsList([]);
      } finally {
        setLoading(false);
      }
    };

    getProblems();
  }, []);
  return { problemsList, loading };
}

function useGetSolvedProblems() {
  const [solvedProblems, setSolvedProblems] = useState<string[]>([]);

  useEffect(() => {
    const savedSolvedProblems = StorageService.getSolvedProblems();
    setSolvedProblems(savedSolvedProblems);
  }, []);

  return solvedProblems;
}
