'use client';

import CircleSkeleton from "@/components/components/Skeletons/CircleSkeleton";
import RectangleSkeleton from "@/components/components/Skeletons/RectangleSkeleton";
import { Problem } from "@/utils/utils/types/problem";
import { useEffect, useState } from "react";
import { AiFillLike, AiFillDislike, AiOutlineLoading3Quarters, AiFillStar } from "react-icons/ai";
import { BsCheck2Circle } from "react-icons/bs";
import { TiStarOutline } from "react-icons/ti";
import { toast } from "react-toastify";
import { SubmissionRow, SubmissionsTable } from "./SubmissionTab";

type ProblemDescriptionProps = {
	problem: Problem;
	_solved: boolean;
};

// Mock problem data with likes/dislikes
const mockProblemData = {
	"two-sum": { likes: 1200, dislikes: 50 },
	"reverse-linked-list": { likes: 800, dislikes: 30 },
	"jump-game": { likes: 950, dislikes: 40 },
	"valid-parentheses": { likes: 1100, dislikes: 45 },
	"search-a-2d-matrix": { likes: 750, dislikes: 35 },
	"container-with-most-water": { likes: 900, dislikes: 38 },
	"merge-intervals": { likes: 850, dislikes: 32 },
	"maximum-depth-of-binary-tree": { likes: 700, dislikes: 25 },
	"best-time-to-buy-and-sell-stock": { likes: 1300, dislikes: 55 },
	"subsets": { likes: 600, dislikes: 28 },
};



const ProblemDescription: React.FC<ProblemDescriptionProps> = ({ problem, _solved }) => {
	const { currentProblem, loading, problemDifficultyClass, setCurrentProblem } = useGetCurrentProblem(problem.id);
	const { liked, disliked, solved, setData, starred } = useGetUsersDataOnProblem(problem.id);
	const [updating, setUpdating] = useState(false);
	const [activeTab, setActiveTab] = useState<'description' | 'submissions'>('description');
	const [expandedSubmission, setExpandedSubmission] = useState<number | null>(null);

	// Mock submissions data
	const mockSubmissions = [
		{
			id: 1,
			status: 'Accepted',
			language: 'Python3',
			runtime: '2 ms',
			memory: '19.1 MB',
			date: 'Jul 25, 2025',
			code: `def twoSum(nums, target):
    seen = {}
    for i, num in enumerate(nums):
        complement = target - num
        if complement in seen:
            return [seen[complement], i]
        seen[num] = i
    return []`,
			hasNotes: false
		},
		{
			id: 2,
			status: 'Compile Error',
			language: 'C++',
			runtime: 'N/A',
			memory: 'N/A',
			date: 'Mar 18, 2025',
			code: `class Solution {
public:
    vector<int> twoSum(vector<int>& nums, int target) {
        // Missing semicolon here
        vector<int> result
        for(int i = 0; i < nums.size(); i++) {
            for(int j = i + 1; j < nums.size(); j++) {
                if(nums[i] + nums[j] == target) {
                    result.push_back(i);
                    result.push_back(j);
                    return result;
                }
            }
        }
        return result;
    }
};`,
			hasNotes: true
		},
		{
			id: 3,
			status: 'Accepted',
			language: 'C++',
			runtime: '4 ms',
			memory: '14.7 MB',
			date: 'Dec 21, 2024',
			code: `class Solution {
public:
    vector<int> twoSum(vector<int>& nums, int target) {
        unordered_map<int, int> seen;
        for(int i = 0; i < nums.size(); i++) {
            int complement = target - nums[i];
            if(seen.find(complement) != seen.end()) {
                return {seen[complement], i};
            }
            seen[nums[i]] = i;
        }
        return {};
    }
};`,
			hasNotes: false
		},
		{
			id: 4,
			status: 'Accepted',
			language: 'C++',
			runtime: '11 ms',
			memory: '11.1 MB',
			date: 'Dec 26, 2023',
			code: `class Solution {
public:
    vector<int> twoSum(vector<int>& nums, int target) {
        for(int i = 0; i < nums.size(); i++) {
            for(int j = i + 1; j < nums.size(); j++) {
                if(nums[i] + nums[j] == target) {
                    return {i, j};
                }
            }
        }
        return {};
    }
};`,
			hasNotes: false
		}
	];

	const handleLike = async () => {
		if (updating) return;
		setUpdating(true);
		
		try {
			const savedUser = localStorage.getItem('user');
			if (!savedUser) {
				toast.error("Please sign in to like problems", { position: "top-center", autoClose: 3000, theme: "dark" });
				return;
			}
			
			const user = JSON.parse(savedUser);
			const userData = {
				...user,
				likedProblems: liked 
					? user.likedProblems.filter((id: string) => id !== problem.id)
					: disliked 
					? [...user.likedProblems, problem.id]
					: [...user.likedProblems, problem.id],
				dislikedProblems: disliked 
					? user.dislikedProblems.filter((id: string) => id !== problem.id)
					: user.dislikedProblems
			};
			
			localStorage.setItem('user', JSON.stringify(userData));
			
			// Update problem likes/dislikes in localStorage
			const problemKey = `problem_${problem.id}`;
			const currentProblemData = mockProblemData[problem.id as keyof typeof mockProblemData] || { likes: 0, dislikes: 0 };
			
			let newLikes = currentProblemData.likes;
			let newDislikes = currentProblemData.dislikes;
			
			if (liked) {
				newLikes -= 1;
			} else if (disliked) {
				newLikes += 1;
				newDislikes -= 1;
			} else {
				newLikes += 1;
			}
			
			localStorage.setItem(problemKey, JSON.stringify({ likes: newLikes, dislikes: newDislikes }));
			
			setCurrentProblem((prev: any) => 
				prev ? { ...prev, likes: newLikes, dislikes: newDislikes } : null
			);
			setData((prev: any) => ({ 
				...prev, 
				liked: !liked, 
				disliked: disliked ? false : prev.disliked 
			}));
			
		} catch (error) {
			toast.error("Failed to update like", { position: "top-center", autoClose: 3000, theme: "dark" });
		} finally {
			setUpdating(false);
		}
	};

	const handleDislike = async () => {
		if (updating) return;
		setUpdating(true);
		
		try {
			const savedUser = localStorage.getItem('user');
			if (!savedUser) {
				toast.error("Please sign in to dislike problems", { position: "top-center", autoClose: 3000, theme: "dark" });
				return;
			}
			
			const user = JSON.parse(savedUser);
			const userData = {
				...user,
				dislikedProblems: disliked 
					? user.dislikedProblems.filter((id: string) => id !== problem.id)
					: liked 
					? [...user.dislikedProblems, problem.id]
					: [...user.dislikedProblems, problem.id],
				likedProblems: liked 
					? user.likedProblems.filter((id: string) => id !== problem.id)
					: user.likedProblems
			};
			
			localStorage.setItem('user', JSON.stringify(userData));
			
			// Update problem likes/dislikes in localStorage
			const problemKey = `problem_${problem.id}`;
			const currentProblemData = mockProblemData[problem.id as keyof typeof mockProblemData] || { likes: 0, dislikes: 0 };
			
			let newLikes = currentProblemData.likes;
			let newDislikes = currentProblemData.dislikes;
			
			if (disliked) {
				newDislikes -= 1;
			} else if (liked) {
				newDislikes += 1;
				newLikes -= 1;
			} else {
				newDislikes += 1;
			}
			
			localStorage.setItem(problemKey, JSON.stringify({ likes: newLikes, dislikes: newDislikes }));
			
			setCurrentProblem((prev: any) => 
				prev ? { ...prev, likes: newLikes, dislikes: newDislikes } : null
			);
			setData((prev: any) => ({ 
				...prev, 
				disliked: !disliked, 
				liked: liked ? false : prev.liked 
			}));
			
		} catch (error) {
			toast.error("Failed to update dislike", { position: "top-center", autoClose: 3000, theme: "dark" });
		} finally {
			setUpdating(false);
		}
	};

	const handleStar = async () => {
		if (updating) return;
		setUpdating(true);

		try {
			const savedUser = localStorage.getItem('user');
			if (!savedUser) {
				toast.error("Please sign in to star problems", { position: "top-center", autoClose: 3000, theme: "dark" });
				return;
			}
			
			const user = JSON.parse(savedUser);
			const userData = {
				...user,
				starredProblems: starred 
					? user.starredProblems.filter((id: string) => id !== problem.id)
					: [...user.starredProblems, problem.id]
			};
			
			localStorage.setItem('user', JSON.stringify(userData));
			setData((prev: any) => ({ ...prev, starred: !starred }));
			
		} catch (error) {
			toast.error("Failed to update star", { position: "top-center", autoClose: 3000, theme: "dark" });
		} finally {
			setUpdating(false);
		}
	};

	return (
		<div className='bg-dark-layer-1'>
			{/* TAB */}
			<div className='flex h-11 w-full items-center pt-2 bg-dark-layer-2 text-white overflow-x-hidden'>
				<div 
					className={`rounded-t-[5px] px-5 py-[10px] text-xs cursor-pointer ${
						activeTab === 'description' ? 'bg-dark-layer-1' : 'bg-dark-layer-2'
					}`}
					onClick={() => setActiveTab('description')}
				>
					Description
				</div>
				<div 
					className={`rounded-t-[5px] px-5 py-[10px] text-xs cursor-pointer ${
						activeTab === 'submissions' ? 'bg-dark-layer-1' : 'bg-dark-layer-2'
					}`}
					onClick={() => setActiveTab('submissions')}
				>
					Submissions
				</div>
			</div>

			<div className='flex px-0 py-4 h-[calc(100vh-94px)] overflow-y-auto'>
				<div className='px-5'>
					{/* Problem heading */}
					<div className='w-full'>
						<div className='flex space-x-4'>
							<div className='flex-1 mr-2 text-lg text-white font-medium'>{problem?.title}</div>
						</div>
						{!loading && currentProblem && (
							<div className='flex items-center mt-3'>
								<div
									className={`${problemDifficultyClass} inline-block rounded-[21px] bg-opacity-[.15] px-2.5 py-1 text-xs font-medium capitalize `}
								>
									{currentProblem.difficulty}
								</div>
								{(solved || _solved) && (
									<div className='rounded p-[3px] ml-4 text-lg transition-colors duration-200 text-green-s text-dark-green-s'>
										<BsCheck2Circle />
									</div>
								)}
								<div
									className='flex items-center cursor-pointer hover:bg-dark-fill-3 space-x-1 rounded p-[3px]  ml-4 text-lg transition-colors duration-200 text-dark-gray-6'
									onClick={handleLike}
								>
									{liked && !updating && <AiFillLike className='text-dark-blue-s' />}
									{!liked && !updating && <AiFillLike />}
									{updating && <AiOutlineLoading3Quarters className='animate-spin' />}

									<span className='text-xs'>{currentProblem.likes}</span>
								</div>
								<div
									className='flex items-center cursor-pointer hover:bg-dark-fill-3 space-x-1 rounded p-[3px]  ml-4 text-lg transition-colors duration-200 text-green-s text-dark-gray-6'
									onClick={handleDislike}
								>
									{disliked && !updating && <AiFillDislike className='text-dark-blue-s' />}
									{!disliked && !updating && <AiFillDislike />}
									{updating && <AiOutlineLoading3Quarters className='animate-spin' />}

									<span className='text-xs'>{currentProblem.dislikes}</span>
								</div>
								<div
									className='cursor-pointer hover:bg-dark-fill-3  rounded p-[3px]  ml-4 text-xl transition-colors duration-200 text-green-s text-dark-gray-6 '
									onClick={handleStar}
								>
									{starred && !updating && <AiFillStar className='text-dark-yellow' />}
									{!starred && !updating && <TiStarOutline />}
									{updating && <AiOutlineLoading3Quarters className='animate-spin' />}
								</div>
							</div>
						)}

						{loading && (
							<div className='mt-3 flex space-x-2'>
								<RectangleSkeleton />
								<CircleSkeleton />
								<RectangleSkeleton />
								<RectangleSkeleton />
								<CircleSkeleton />
							</div>
						)}

            {activeTab === 'submissions' && (
              <div className='mt-4'>
                <SubmissionsTable
                  submissions={mockSubmissions}
                  expandedSubmission={expandedSubmission}
                  setExpandedSubmission={setExpandedSubmission}
                />
              </div>
            )}

						{activeTab === 'description' && (
							<>
								{/* Problem Statement(paragraphs) */}
								<div className='text-white text-sm'>
									<div dangerouslySetInnerHTML={{ __html: problem.problemStatement }} />
								</div>

								{/* Examples */}
								<div className='mt-4'>
									{problem.examples.map((example, index) => (
										<div key={example.id}>
											<p className='font-medium text-white '>Example {index + 1}: </p>
											{example.img && <img src={example.img} alt='' className='mt-3' />}
											<div className='example-card'>
												<pre>
													<strong className='text-white'>Input: </strong> {example.inputText}
													<br />
													<strong>Output:</strong>
													{example.outputText} <br />
													{example.explanation && (
														<>
															<strong>Explanation:</strong> {example.explanation}
														</>
													)}
												</pre>
											</div>
										</div>
									))}
								</div>

								{/* Constraints */}
								<div className='my-8 pb-4'>
									<div className='text-white text-sm font-medium'>Constraints:</div>
									<ul className='text-white ml-5 list-disc '>
										<div dangerouslySetInnerHTML={{ __html: problem.constraints }} />
									</ul>
								</div>
							</>
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
		// Get problem data from localStorage or use mock data
		const getCurrentProblem = async () => {
			setLoading(true);
			
			// Try to get from localStorage first
			const problemKey = `problem_${problemId}`;
			const savedProblemData = localStorage.getItem(problemKey);
			
			let problemData;
			if (savedProblemData) {
				problemData = JSON.parse(savedProblemData);
			} else {
				// Use mock data if not in localStorage
				problemData = mockProblemData[problemId as keyof typeof mockProblemData] || { likes: 0, dislikes: 0 };
				localStorage.setItem(problemKey, JSON.stringify(problemData));
			}
			
			// Get problem details from the problems array
			const { problems: mockProblems } = await import("@/mockProblems/problem");
			const problemDetails = mockProblems.find((p: any) => p.id === problemId);
			
			if (problemDetails) {
				setCurrentProblem({ 
					...problemDetails, 
					...problemData 
				});
				
				// Set difficulty class
				setProblemDifficultyClass(
					problemDetails.difficulty === "Easy"
						? "bg-olive text-olive"
						: problemDetails.difficulty === "Medium"
						? "bg-dark-yellow text-dark-yellow"
						: " bg-dark-pink text-dark-pink"
				);
			}
			
			setLoading(false);
		};
		getCurrentProblem();
	}, [problemId]);

	return { currentProblem, loading, problemDifficultyClass, setCurrentProblem };
}

function useGetUsersDataOnProblem(problemId: string) {
	const [data, setData] = useState({ liked: false, disliked: false, starred: false, solved: false });

	useEffect(() => {
		const getUsersDataOnProblem = () => {
			const savedUser = localStorage.getItem('user');
			if (savedUser) {
				const user = JSON.parse(savedUser);
				const { solvedProblems, likedProblems, dislikedProblems, starredProblems } = user;
				setData({
					liked: likedProblems.includes(problemId),
					disliked: dislikedProblems.includes(problemId),
					starred: starredProblems.includes(problemId),
					solved: solvedProblems.includes(problemId),
				});
			}
		};

		getUsersDataOnProblem();
		return () => setData({ liked: false, disliked: false, starred: false, solved: false });
	}, [problemId]);

	return { ...data, setData };
}