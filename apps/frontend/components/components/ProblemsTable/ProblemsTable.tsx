'use client';

import Link from "next/link";
import React, { useEffect, useState } from "react";
import { BsCheckCircle } from "react-icons/bs";
import { DBProblem } from "@/utils/utils/types/problem";
import { StorageService } from "@/utils/storage";
import { getAllQuestions } from "@/hooks/hooks/getProblemData";

type ProblemsTableProps = {};

const ProblemsTable: React.FC<ProblemsTableProps> = () => {
	const { problemsList, loading } = useGetProblems();
	const solvedProblems = useGetSolvedProblems();

	return (
		<>
			<tbody className='text-white'>
				{problemsList.map((problem, idx) => {
					const difficulyColor =
						problem.difficulty === "Easy"
							? "text-dark-green-s"
							: problem.difficulty === "Medium"
							? "text-dark-yellow"
							: "text-dark-pink";
					return (
						<tr className={`${idx % 2 == 1 ? "bg-dark-layer-1" : ""}`} key={problem.id}>
							<th className='px-2 py-4 font-medium whitespace-nowrap text-dark-green-s'>
								{solvedProblems.includes(problem.id) && <BsCheckCircle fontSize={"18"} width='18' />}
							</th>
							<td className='px-6 py-4'>
								{problem.link ? (
									<Link
										href={problem.link}
										className='hover:text-blue-600 cursor-pointer'
										target='_blank'
									>
										{problem.title}
									</Link>
								) : (
									<Link
										className='hover:text-blue-600 cursor-pointer'
										href={`/problems/${problem.id}`}
									>
										{problem.title}
									</Link>
								)}
							</td>
							<td className={`px-6 py-4 ${difficulyColor}`}>{problem.difficulty}</td>
							<td className={"px-6 py-4"}>{problem.category}</td>
						</tr>
					);
				})}
			</tbody>
		</>
	);
};
export default ProblemsTable;

function useGetProblems() {
	const [problemsList, setProblemsList] = useState<DBProblem[]>([]);
	const [loading, setLoading] = useState<boolean>(true);

	useEffect(() => {
		const getProblems = async () => {
			setLoading(true);
			try {
				// Fetch problems from database
				const questions = await getAllQuestions();
				
				if (questions) {
					// Convert database questions to DBProblem format
					const problemsArray: DBProblem[] = questions.map((question, index) => ({
						id: question.id,
						title: question.title,
						category: "Array", // Mock category - you can enhance this later
						difficulty: ["Easy", "Medium", "Hard"][index % 3] as "Easy" | "Medium" | "Hard", // Mock difficulty
						likes: 0,
						dislikes: 0,
						order: index + 1,
						videoId: undefined,
						link: undefined,
					}));
					setProblemsList(problemsArray);
				} else {
					console.error('Failed to fetch problems from database');
					setProblemsList([]);
				}
			} catch (error) {
				console.error('Error fetching problems:', error);
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
