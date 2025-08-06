'use client';

import Link from "next/link";
import React, { useEffect, useState } from "react";
import { BsCheckCircle } from "react-icons/bs";
import { problems } from "@/utils/utils/problems";
import { DBProblem } from "@/utils/utils/types/problem";

type ProblemsTableProps = {
	setLoadingProblems: React.Dispatch<React.SetStateAction<boolean>>;
};

const ProblemsTable: React.FC<ProblemsTableProps> = ({ setLoadingProblems }) => {
	const problemsList = useGetProblems(setLoadingProblems);
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

function useGetProblems(setLoadingProblems: React.Dispatch<React.SetStateAction<boolean>>) {
	const [problemsList, setProblemsList] = useState<DBProblem[]>([]);

	useEffect(() => {
		const getProblems = async () => {
			setLoadingProblems(true);
			// Convert problems object to DBProblem array and sort by order
			const problemsArray: DBProblem[] = Object.keys(problems).map((key) => ({
				id: key,
				title: problems[key].title,
				category: "Array", // Mock category
				difficulty: "Medium", // Mock difficulty
				likes: 0,
				dislikes: 0,
				order: problems[key].order,
				videoId: undefined,
				link: undefined,
			}));
			problemsArray.sort((a, b) => a.order - b.order);
			setProblemsList(problemsArray);
			setLoadingProblems(false);
		};

		getProblems();
	}, [setLoadingProblems]);
	return problemsList;
}

function useGetSolvedProblems() {
	// Mock solved problems - replace with your preferred storage solution
	const [solvedProblems, setSolvedProblems] = useState<string[]>([]);

	useEffect(() => {
		// Mock: load solved problems from localStorage
		const savedSolvedProblems = localStorage.getItem('solvedProblems');
		if (savedSolvedProblems) {
			setSolvedProblems(JSON.parse(savedSolvedProblems));
		}
	}, []);

	return solvedProblems;
}
