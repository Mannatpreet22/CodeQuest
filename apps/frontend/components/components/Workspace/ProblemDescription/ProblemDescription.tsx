'use client';

import CircleSkeleton from "@/components/components/Skeletons/CircleSkeleton";
import RectangleSkeleton from "@/components/components/Skeletons/RectangleSkeleton";
import { Problem } from "@/utils/utils/types/problem";
import { SerializableProblem } from "@/utils/utils/types/serializable";
import { useEffect, useState } from "react";
import { AiFillLike, AiFillDislike, AiOutlineLoading3Quarters, AiFillStar } from "react-icons/ai";
import { BsCheck2Circle } from "react-icons/bs";
import { TiStarOutline } from "react-icons/ti";
import { toast } from "react-toastify";
import { SubmissionRow, SubmissionsTable } from "./SubmissionTab";
import { 
    getProblemWithTestCases, 
    getUserProblemSubmissions,
    getUserInteraction,
    getQuestionStats,
    toggleLike,
    toggleDislike,
    toggleStar
} from "@/hooks/hooks/getProblemData";
import { useUser } from "@clerk/nextjs";

type ProblemDescriptionProps = {
	problem: SerializableProblem;
	_solved: boolean;
};

const ProblemDescription: React.FC<ProblemDescriptionProps> = ({ problem, _solved }) => {
	const { user } = useUser();
	const { currentProblem, loading, problemDifficultyClass, setCurrentProblem } = useGetCurrentProblem(problem.id);
	const { liked, disliked, starred, solved, setData } = useGetUsersDataOnProblem(problem.id, user?.id);
	const [updating, setUpdating] = useState(false);
	const [activeTab, setActiveTab] = useState<'description' | 'submissions'>('description');
	const [expandedSubmission, setExpandedSubmission] = useState<number | null>(null);
	const [submissions, setSubmissions] = useState<any[]>([]);
	const [submissionsLoading, setSubmissionsLoading] = useState(false);

	// Fetch submissions when tab changes to submissions
	useEffect(() => {
		if (activeTab === 'submissions') {
			fetchSubmissions();
		}
	}, [activeTab, problem.id]);

	// Listen for submission refresh events
	useEffect(() => {
		const handleSubmissionRefresh = () => {
			if (activeTab === 'submissions') {
				fetchSubmissions();
			}
		};

		window.addEventListener('submission-refresh', handleSubmissionRefresh);
		return () => {
			window.removeEventListener('submission-refresh', handleSubmissionRefresh);
		};
	}, [activeTab]);

	const fetchSubmissions = async () => {
		if (!user?.id) return;
		
		setSubmissionsLoading(true);
		try {
			const response = await getUserProblemSubmissions(user.id, problem.id);
			if (response.success && response.data) {
				// Transform the data to match the expected format
				const transformedSubmissions = response.data.map((submission: any) => ({
					id: submission.id,
					status: submission.status === 'AC' ? 'Accepted' : 
							submission.status === 'WA' ? 'Wrong Answer' :
							submission.status === 'TLE' ? 'Time Limit Exceeded' :
							submission.status === 'CE' ? 'Compile Error' :
							submission.status === 'RE' ? 'Runtime Error' :
							submission.status,
					language: submission.language,
					runtime: submission.runtime ? `${submission.runtime} ms` : 'N/A',
					memory: submission.memoryUsed ? `${(submission.memoryUsed / 1024).toFixed(1)} MB` : 'N/A',
					date: new Date(submission.createdAt).toLocaleDateString('en-US', {
						year: 'numeric',
						month: 'short',
						day: 'numeric'
					}),
					code: submission.codeText,
					hasNotes: false // We can add notes functionality later
				}));
				setSubmissions(transformedSubmissions);
			} else {
				setSubmissions([]);
			}
		} catch (error) {
			console.error('Error fetching submissions:', error);
			setSubmissions([]);
		} finally {
			setSubmissionsLoading(false);
		}
	};

	const handleLike = async () => {
		if (updating || !user?.id) {
			if (!user?.id) {
				toast.error("Please sign in to like problems", { position: "top-center", autoClose: 3000, theme: "dark" });
			}
			return;
		}
		
		setUpdating(true);
		try {
			const result = await toggleLike(problem.id, user.id);
			setData((prev: any) => ({ 
				...prev, 
				liked: result.liked, 
				disliked: result.disliked 
			}));
			
			// Refresh question stats
			const stats = await getQuestionStats(problem.id);
			setCurrentProblem((prev: any) => 
				prev ? { ...prev, likes: stats.likes, dislikes: stats.dislikes } : null
			);
			
		} catch (error) {
			toast.error("Failed to update like", { position: "top-center", autoClose: 3000, theme: "dark" });
		} finally {
			setUpdating(false);
		}
	};

	const handleDislike = async () => {
		if (updating || !user?.id) {
			if (!user?.id) {
				toast.error("Please sign in to dislike problems", { position: "top-center", autoClose: 3000, theme: "dark" });
			}
			return;
		}
		
		setUpdating(true);
		try {
			const result = await toggleDislike(problem.id, user.id);
			setData((prev: any) => ({ 
				...prev, 
				disliked: result.disliked, 
				liked: result.liked 
			}));
			
			// Refresh question stats
			const stats = await getQuestionStats(problem.id);
			setCurrentProblem((prev: any) => 
				prev ? { ...prev, likes: stats.likes, dislikes: stats.dislikes } : null
			);
			
		} catch (error) {
			toast.error("Failed to update dislike", { position: "top-center", autoClose: 3000, theme: "dark" });
		} finally {
			setUpdating(false);
		}
	};

	const handleStar = async () => {
		if (updating || !user?.id) {
			if (!user?.id) {
				toast.error("Please sign in to star problems", { position: "top-center", autoClose: 3000, theme: "dark" });
			}
			return;
		}
		
		setUpdating(true);
		try {
			const result = await toggleStar(problem.id, user.id);
			setData((prev: any) => ({ ...prev, starred: result.starred }));
			
			// Refresh question stats
			const stats = await getQuestionStats(problem.id);
			setCurrentProblem((prev: any) => 
				prev ? { ...prev, stars: stats.stars } : null
			);
			
		} catch (error) {
			toast.error("Failed to update star", { position: "top-center", autoClose: 3000, theme: "dark" });
		} finally {
			setUpdating(false);
		}
	};

	return (
		<div className='bg-dark-layer-1 h-full flex flex-col'>
			{/* Enhanced Tab Navigation */}
			<div className='flex h-12 w-full items-center pt-2 bg-dark-layer-2 text-white overflow-x-hidden border-b border-dark-divider-border-2'>
				<div 
					className={`rounded-t-lg px-6 py-3 text-sm font-medium cursor-pointer transition-all duration-200 ${
						activeTab === 'description' 
							? 'bg-dark-layer-1 text-white border-b-2 border-dark-blue-s' 
							: 'bg-dark-layer-2 text-dark-gray-6 hover:text-white hover:bg-dark-fill-3'
					}`}
					onClick={() => setActiveTab('description')}
				>
					Description
				</div>
				<div 
					className={`rounded-t-lg px-6 py-3 text-sm font-medium cursor-pointer transition-all duration-200 ${
						activeTab === 'submissions' 
							? 'bg-dark-layer-1 text-white border-b-2 border-dark-blue-s' 
							: 'bg-dark-layer-2 text-dark-gray-6 hover:text-white hover:bg-dark-fill-3'
					}`}
					onClick={() => setActiveTab('submissions')}
				>
					Submissions
				</div>
			</div>

			<div className='flex px-0 py-6 flex-1 overflow-y-auto problem-description-scroll'>
				<div className='px-6 w-full max-w-4xl mx-auto'>
					{/* Enhanced Problem Header */}
					<div className='w-full'>
						<div className='flex flex-col space-y-4'>
							{/* Title and Difficulty */}
							<div className='flex items-start justify-between'>
								<div className='flex-1'>
									<h1 className='text-2xl font-bold text-white mb-3 leading-tight'>{problem?.title}</h1>
									{!loading && currentProblem && (
										<div className='flex items-center space-x-4'>
											<div className={`${problemDifficultyClass} inline-flex items-center px-4 py-2 rounded-full text-sm font-semibold capitalize shadow-sm backdrop-blur-sm`}>
												{currentProblem.difficulty}
											</div>
											{(solved || _solved) && (
												<div className='flex items-center space-x-2 text-green-400'>
													<BsCheck2Circle className='text-xl' />
													<span className='text-sm font-medium'>Solved</span>
												</div>
											)}
										</div>
									)}
								</div>
							</div>

							{/* Enhanced Action Buttons */}
							{!loading && currentProblem && (
								<div className='flex items-center space-x-2 pt-2 border-t border-dark-divider-border-2'>
									<div
										className='flex items-center space-x-2 cursor-pointer hover:bg-dark-fill-3 rounded-lg px-3 py-2 transition-all duration-200 text-dark-gray-6 hover:text-white'
										onClick={handleLike}
									>
										{liked && !updating && <AiFillLike className='text-xl text-dark-blue-s' />}
										{!liked && !updating && <AiFillLike className='text-xl' />}
										{updating && <AiOutlineLoading3Quarters className='text-xl animate-spin' />}
										<span className='text-sm font-medium'>{currentProblem.likes || 0}</span>
									</div>
									<div
										className='flex items-center space-x-2 cursor-pointer hover:bg-dark-fill-3 rounded-lg px-3 py-2 transition-all duration-200 text-dark-gray-6 hover:text-white'
										onClick={handleDislike}
									>
										{disliked && !updating && <AiFillDislike className='text-xl text-dark-blue-s' />}
										{!disliked && !updating && <AiFillDislike className='text-xl' />}
										{updating && <AiOutlineLoading3Quarters className='text-xl animate-spin' />}
										<span className='text-sm font-medium'>{currentProblem.dislikes || 0}</span>
									</div>
									<div
										className='cursor-pointer hover:bg-dark-fill-3 rounded-lg p-2 transition-all duration-200 text-dark-gray-6 hover:text-white'
										onClick={handleStar}
									>
										{starred && !updating && <AiFillStar className='text-2xl text-dark-yellow' />}
										{!starred && !updating && <TiStarOutline className='text-2xl' />}
										{updating && <AiOutlineLoading3Quarters className='text-2xl animate-spin' />}
									</div>
								</div>
							)}

							{loading && (
								<div className='mt-4 flex space-x-3'>
									<RectangleSkeleton />
									<CircleSkeleton />
									<RectangleSkeleton />
									<RectangleSkeleton />
									<CircleSkeleton />
								</div>
							)}
						</div>

						{/* Submissions Tab Content */}
						{activeTab === 'submissions' && (
							<div className='mt-8'>
								<div className='flex justify-between items-center mb-6'>
									<h3 className='text-xl font-semibold text-white'>Your Submissions</h3>
									<button
										onClick={fetchSubmissions}
										disabled={submissionsLoading}
										className='flex items-center space-x-2 px-4 py-2 bg-dark-fill-3 hover:bg-dark-fill-2 text-white text-sm rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed border border-dark-divider-border-2'
									>
										{submissionsLoading ? (
											<>
												<div className='animate-spin rounded-full h-4 w-4 border-b-2 border-white'></div>
												<span>Refreshing...</span>
											</>
										) : (
											<>
												<svg className='w-4 h-4' fill='currentColor' viewBox='0 0 20 20'>
													<path fillRule='evenodd' d='M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z' clipRule='evenodd' />
												</svg>
												<span>Refresh</span>
											</>
										)}
									</button>
								</div>
								{submissionsLoading ? (
									<div className='flex items-center justify-center py-12'>
										<div className='animate-spin rounded-full h-8 w-8 border-b-2 border-white'></div>
										<span className='ml-3 text-white'>Loading submissions...</span>
									</div>
								) : submissions.length === 0 ? (
									<div className='text-center py-12'>
										<div className='text-gray-400 text-lg mb-2'>No submissions yet</div>
										<div className='text-gray-500 text-sm'>Submit your solution to see it here</div>
									</div>
								) : (
									<SubmissionsTable
										submissions={submissions}
										expandedSubmission={expandedSubmission}
										setExpandedSubmission={setExpandedSubmission}
									/>
								)}
							</div>
						)}

						{/* Enhanced Description Tab Content */}
						{activeTab === 'description' && (
							<div className='mt-8 space-y-8'>
								{/* Problem Statement */}
								<div className='bg-dark-layer-2 rounded-lg p-6 border border-dark-divider-border-2'>
									<h2 className='text-lg font-semibold text-white mb-4 flex items-center'>
										<span className='w-2 h-2 bg-dark-blue-s rounded-full mr-3'></span>
										Problem Statement
									</h2>
									<div className='text-white text-base leading-relaxed prose prose-invert max-w-none'>
										<div dangerouslySetInnerHTML={{ __html: problem.problemStatement }} />
									</div>
								</div>

								{/* Examples */}
								<div className='space-y-6'>
									<h2 className='text-lg font-semibold text-white flex items-center'>
										<span className='w-2 h-2 bg-dark-green-s rounded-full mr-3'></span>
										Examples
									</h2>
									{currentProblem?.examples?.map((example: any, index: number) => (
										<div key={example.id} className='bg-dark-layer-2 rounded-lg p-6 border border-dark-divider-border-2'>
											<div className='flex items-center mb-4'>
												<span className='bg-dark-blue-s text-white text-sm font-semibold px-3 py-1 rounded-full mr-3'>
													Example {index + 1}
												</span>
											</div>
											<div className='example-card'>
												<pre className='bg-dark-fill-3 rounded-lg p-4 border border-dark-divider-border-2'>
													<strong className='text-white'>Input: </strong> 
													<span className='text-dark-gray-7'>{example.inputData}</span>
													<br />
													<strong className='text-white'>Output: </strong>
													<span className='text-dark-gray-7'>{example.outputData}</span>
													{example.explanation && (
														<>
															<br />
															<strong className='text-white'>Explanation: </strong> 
															<span className='text-dark-gray-7'>{example.explanation}</span>
														</>
													)}
												</pre>
											</div>
										</div>
									))}
								</div>

								{/* Constraints */}
								<div className='bg-dark-layer-2 rounded-lg p-6 border border-dark-divider-border-2'>
									<h2 className='text-lg font-semibold text-white mb-4 flex items-center'>
										<span className='w-2 h-2 bg-dark-pink rounded-full mr-3'></span>
										Constraints
									</h2>
									<div className='text-white text-base leading-relaxed'>
										<div dangerouslySetInnerHTML={{ __html: problem.constraints }} />
									</div>
								</div>
							</div>
						)}
					</div>
				</div>
			</div>
		</div>
	);
};

export default ProblemDescription;

function useGetCurrentProblem(problemId: string) {
	const [currentProblem, setCurrentProblem] = useState<any>(null);
	const [loading, setLoading] = useState<boolean>(true);
	const [problemDifficultyClass, setProblemDifficultyClass] = useState<string>("");

	useEffect(() => {
		const getCurrentProblem = async () => {
			setLoading(true);
			
			try {
				// Fetch problem from database
				const problemData = await getProblemWithTestCases(problemId);
				
				if (problemData) {
					// Get stats from API
					const stats = await getQuestionStats(problemId);
					
					// Combine database problem with stats
					setCurrentProblem({
						...problemData,
						...stats,
						// Mock difficulty for now - you can add this to your database schema later
						difficulty: "Easy"
					});
					
					// Set difficulty class with proper contrasting colors
					const getDifficultyClass = (difficulty: string) => {
						switch (difficulty.toLowerCase()) {
							case 'easy':
								return 'bg-green-500/20 text-green-400 border border-green-500/30';
							case 'medium':
								return 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30';
							case 'hard':
								return 'bg-red-500/20 text-red-400 border border-red-500/30';
							default:
								return 'bg-gray-500/20 text-gray-400 border border-gray-500/30';
						}
					};
					
					setProblemDifficultyClass(getDifficultyClass("Easy"));
				} else {
					console.error('Failed to fetch problem from database');
					setCurrentProblem(null);
				}
			} catch (error) {
				console.error('Error fetching problem:', error);
				setCurrentProblem(null);
			} finally {
				setLoading(false);
			}
		};
		
		getCurrentProblem();
	}, [problemId]);

	return { currentProblem, loading, problemDifficultyClass, setCurrentProblem };
}

function useGetUsersDataOnProblem(problemId: string, userId?: string) {
	const [data, setData] = useState({ liked: false, disliked: false, starred: false, solved: false });

	useEffect(() => {
		const getUsersDataOnProblem = async () => {
			if (!userId) {
				setData({ liked: false, disliked: false, starred: false, solved: false });
				return;
			}
			
			try {
				const [interaction, submissions] = await Promise.all([
					getUserInteraction(problemId, userId),
					getUserProblemSubmissions(userId, problemId)
				]);
				
				// Check if user has solved this problem (has any AC submission)
				const hasSolved = submissions.success && submissions.data && 
					submissions.data.some((submission: any) => submission.status === 'AC');
				
				setData({
					liked: interaction.liked || false,
					disliked: interaction.disliked || false,
					starred: interaction.starred || false,
					solved: hasSolved,
				});
			} catch (error) {
				console.error('Error fetching user interaction:', error);
				setData({ liked: false, disliked: false, starred: false, solved: false });
			}
		};

		getUsersDataOnProblem();
	}, [problemId, userId]);

	return { ...data, setData };
}