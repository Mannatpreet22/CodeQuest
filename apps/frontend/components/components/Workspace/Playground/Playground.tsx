'use client';

import { useState, useEffect } from "react";
import PreferenceNav from "./PreferenceNav/PreferenceNav";
import Split from "react-split";
import CodeMirror from "@uiw/react-codemirror";
import { vscodeDark } from "@uiw/codemirror-theme-vscode";
import { javascript } from "@codemirror/lang-javascript";
import EditorFooter from "./EditorFooter";
import { Problem } from "@/utils/utils/types/problem";
import { SerializableProblem } from "@/utils/utils/types/serializable";
import { toast } from "react-toastify";
import { useRouter } from "next/navigation";
import { getProblemWithTestCases, getTemplateCode, runCode, submitCode } from "@/hooks/hooks/getProblemData";
import useLocalStorage from "@/hooks/hooks/useLocalStorage";
import { StorageService } from "@/utils/storage";
import { python } from "@codemirror/lang-python";
import { java } from "@codemirror/lang-java";
import { cpp } from "@codemirror/lang-cpp";

type PlaygroundProps = {
	problem: SerializableProblem;
	pid: string;
	setSuccess: React.Dispatch<React.SetStateAction<boolean>>;
	setSolved: React.Dispatch<React.SetStateAction<boolean>>;
};

export interface ISettings {
	fontSize: string;
	settingsModalIsOpen: boolean;
	dropdownIsOpen: boolean;
	language: string;
}

// Helper function to format test case inputs for display
const formatTestCaseInput = (inputs: any): string => {
	if (!inputs || typeof inputs !== 'object') {
		return String(inputs || '');
	}

	// Convert inputs object to a readable format
	const inputEntries = Object.entries(inputs);
	
	if (inputEntries.length === 1) {
		// Single input - just show the value
		const [key, value] = inputEntries[0];
		if (Array.isArray(value)) {
			return `${key} = [${value.join(', ')}]`;
		} else if (typeof value === 'string') {
			return `${key} = "${value}"`;
		} else {
			return `${key} = ${value}`;
		}
	} else {
		// Multiple inputs - show all
		return inputEntries
			.map(([key, value]) => {
				if (Array.isArray(value)) {
					return `${key} = [${value.join(', ')}]`;
				} else if (typeof value === 'string') {
					return `${key} = "${value}"`;
				} else {
					return `${key} = ${value}`;
				}
			})
			.join(', ');
	}
};

// Helper function to format expected output for display
const formatExpectedOutput = (expected: any): string => {
	if (Array.isArray(expected)) {
		return `[${expected.join(', ')}]`;
	} else if (typeof expected === 'string') {
		return `"${expected}"`;
	} else {
		return String(expected);
	}
};

const Playground: React.FC<PlaygroundProps> = ({ problem, pid, setSuccess, setSolved }) => {
	const [activeTestCaseId, setActiveTestCaseId] = useState<number>(0);
	const [isConsoleOpen, setIsConsoleOpen] = useState<boolean>(true);
	let [userCode, setUserCode] = useState<string>(problem.starterCode);
	const [testCases, setTestCases] = useState<any[]>([]);
	const [loadingTestCases, setLoadingTestCases] = useState<boolean>(true);
	const [templateCode, setTemplateCode] = useState<string>("");
	const [loadingTemplate, setLoadingTemplate] = useState<boolean>(true);
	const [isRunning, setIsRunning] = useState<boolean>(false);
	const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
	const [executionResult, setExecutionResult] = useState<any>(null);

	const [fontSize, setFontSize] = useLocalStorage("lcc-fontSize", "16px");
	const [language, setLanguage] = useLocalStorage("lcc-language", "javascript");

	const [settings, setSettings] = useState<ISettings>({
		fontSize: fontSize,
		settingsModalIsOpen: false,
		dropdownIsOpen: false,
		language: language,
	});

	const router = useRouter();

	const toggleConsole = () => {
		setIsConsoleOpen(!isConsoleOpen);
	};

		// Mock user ID - in a real app, this would come from auth context
	const mockUserId = "user-123";

	const handleRun = async () => {
		if (isRunning) return;
		
		setIsRunning(true);
		setExecutionResult(null);
		
		try {
			const submission = {
				problemId: pid,
				userId: mockUserId,
				code: userCode,
				lang: settings.language
			};
			
			// Add client-side timeout as backup
			const timeoutPromise = new Promise((_, reject) => {
				setTimeout(() => reject(new Error('Client timeout')), 35000); // 35 seconds (5 seconds more than axios timeout)
			});
			
			const result = await Promise.race([
				runCode(submission),
				timeoutPromise
			]) as any;
			
			if (result.success) {
				toast.success("Code executed successfully!", {
					position: "top-center",
					autoClose: 3000,
					theme: "dark",
				});
				setExecutionResult(result.data);
			} else {
				toast.error(result.message || "Code execution failed", {
					position: "top-center",
					autoClose: 3000,
					theme: "dark",
				});
				setExecutionResult(result.data);
			}
		} catch (error: any) {
			console.error('Error running code:', error);
			
			// Handle timeout specifically
			if (error.message === 'Client timeout') {
				toast.error("Server is busy or down. Please try again later.", {
					position: "top-center",
					autoClose: 5000,
					theme: "dark",
				});
			} else {
				toast.error("Failed to run code", {
					position: "top-center",
					autoClose: 3000,
					theme: "dark",
				});
			}
		} finally {
			setIsRunning(false);
		}
	};

	const handleSubmit = async () => {
		if (isSubmitting) return;
		
		setIsSubmitting(true);
		setExecutionResult(null);
		
		try {
			const submission = {
				problemId: pid,
				userId: mockUserId,
				code: userCode,
				lang: settings.language
			};
			
			// Add client-side timeout as backup
			const timeoutPromise = new Promise((_, reject) => {
				setTimeout(() => reject(new Error('Client timeout')), 35000); // 35 seconds (5 seconds more than axios timeout)
			});
			
			const result = await Promise.race([
				submitCode(submission),
				timeoutPromise
			]) as any;
			
			if (result.success) {
				toast.success("Submission successful!", {
					position: "top-center",
					autoClose: 3000,
					theme: "dark",
				});
				setSuccess(true);
				setSolved(true);
				StorageService.addSolvedProblem(pid);
				setExecutionResult(result.data);
			} else {
				toast.error(result.message || "Submission failed", {
					position: "top-center",
					autoClose: 3000,
					theme: "dark",
				});
				setExecutionResult(result.data);
			}
		} catch (error: any) {
			console.error('Error submitting code:', error);
			
			// Handle timeout specifically
			if (error.message === 'Client timeout') {
				toast.error("Server is busy or down. Please try again later.", {
					position: "top-center",
					autoClose: 5000,
					theme: "dark",
				});
			} else {
				toast.error("Failed to submit code", {
					position: "top-center",
					autoClose: 3000,
					theme: "dark",
				});
			}
		} finally {
			setIsSubmitting(false);
		}
	};

	// Fetch test cases from database
	useEffect(() => {
		const fetchTestCases = async () => {
			setLoadingTestCases(true);
			try {
				const problemData = await getProblemWithTestCases(pid);
				if (problemData && problemData.testcases) {
					setTestCases(problemData.testcases);
				} else {
					// Fallback to examples if no test cases
					setTestCases([]);
				}
			} catch (error) {
				console.error('Error fetching test cases:', error);
				setTestCases([]);
			} finally {
				setLoadingTestCases(false);
			}
		};

		fetchTestCases();
	}, [pid]);

	// Fetch template code from database
	useEffect(() => {
		const fetchTemplateCode = async () => {
			setLoadingTemplate(true);
			try {
				const template = await getTemplateCode(pid, settings.language);
				if (template) {
					setTemplateCode(template.driverCode);
				} else {
					// Fallback to problem starter code
					setTemplateCode(problem.starterCode);
				}
			} catch (error) {
				console.error('Error fetching template code:', error);
				setTemplateCode(problem.starterCode);
			} finally {
				setLoadingTemplate(false);
			}
		};

		fetchTemplateCode();
	}, [pid, settings.language, problem.starterCode]);

	// Reset active test case when test cases change
	useEffect(() => {
		if (!loadingTestCases) {
			const maxCases = testCases.length > 0 ? testCases.length : problem.examples.length;
			if (activeTestCaseId >= maxCases) {
				setActiveTestCaseId(0);
			}
		}
	}, [testCases, loadingTestCases, problem.examples.length, activeTestCaseId]);

	useEffect(() => {
		const savedCode = StorageService.getUserCode(pid);
		// Use template code if available, otherwise fall back to saved code or problem starter code
		const codeToUse = !loadingTemplate && templateCode ? templateCode : (savedCode || problem.starterCode);
		setUserCode(codeToUse);
	}, [pid, problem.starterCode, templateCode, loadingTemplate]);

	const onChange = (value: string) => {
		setUserCode(value);
		StorageService.setUserCode(pid, value);
	};

	const getLanguageExtension = () => {
		switch (settings.language) {
			case "python":
				return python();
			case "java":
				return java();
			case "cpp":
				return cpp();
			default:
				return javascript();
		}
	};

	return (
		<div className='flex flex-col bg-dark-layer-1 relative overflow-x-hidden'>
			<PreferenceNav settings={settings} setSettings={setSettings} />

			<Split className='h-[calc(100vh-94px)]' direction='vertical' sizes={isConsoleOpen ? [60, 40] : [100, 0]} minSize={60}>
				<div className='w-full overflow-auto'>
					<CodeMirror
						value={userCode}
						theme={vscodeDark}
						onChange={onChange}
						extensions={[getLanguageExtension()]}
						style={{ fontSize: settings.fontSize }}
					/>
				</div>
				{isConsoleOpen && (
					<div className='w-full px-5 overflow-auto'>
						{/* testcase heading */}
						<div className='flex h-10 items-center space-x-6'>
							<div className='relative flex h-full flex-col justify-center cursor-pointer'>
								<div className='text-sm font-medium leading-5 text-white'>Testcases</div>
								<hr className='absolute bottom-0 h-0.5 w-full rounded-full border-none bg-white' />
							</div>
						</div>

						<div className='flex'>
							{loadingTestCases ? (
								// Loading skeleton for test case tabs
								Array.from({ length: 3 }).map((_, index) => (
									<div key={index} className='mr-2 items-start mt-2'>
										<div className='flex flex-wrap items-center gap-y-4'>
											<div className='font-medium items-center transition-all focus:outline-none inline-flex bg-dark-fill-3 relative rounded-lg px-4 py-1 cursor-pointer whitespace-nowrap text-gray-500 animate-pulse'>
												Case {index + 1}
											</div>
										</div>
									</div>
								))
							) : testCases.length > 0 ? (
								// Render database test cases
								testCases.map((testCase, index) => (
									<div
										className='mr-2 items-start mt-2 '
										key={testCase.id}
										onClick={() => setActiveTestCaseId(index)}
									>
										<div className='flex flex-wrap items-center gap-y-4'>
											<div
												className={`font-medium items-center transition-all focus:outline-none inline-flex bg-dark-fill-3 hover:bg-dark-fill-2 relative rounded-lg px-4 py-1 cursor-pointer whitespace-nowrap
												${activeTestCaseId === index ? "text-white" : "text-gray-500"}
											`}
											>
												Case {index + 1}
											</div>
										</div>
									</div>
								))
							) : (
								// Fallback to examples if no test cases
								problem.examples.map((example, index) => (
									<div
										className='mr-2 items-start mt-2 '
										key={example.id}
										onClick={() => setActiveTestCaseId(index)}
									>
										<div className='flex flex-wrap items-center gap-y-4'>
											<div
												className={`font-medium items-center transition-all focus:outline-none inline-flex bg-dark-fill-3 hover:bg-dark-fill-2 relative rounded-lg px-4 py-1 cursor-pointer whitespace-nowrap
												${activeTestCaseId === index ? "text-white" : "text-gray-500"}
											`}
											>
												Case {index + 1}
											</div>
										</div>
									</div>
								))
							)}
						</div>

						<div className='font-semibold my-4'>
							{loadingTestCases ? (
								// Loading skeleton for input/output
								<>
									<p className='text-sm font-medium mt-4 text-white'>Input:</p>
									<div className='w-full cursor-text rounded-lg border px-3 py-[10px] bg-dark-fill-3 border-transparent text-gray-500 mt-2 animate-pulse'>
										Loading...
									</div>
									<p className='text-sm font-medium mt-4 text-white'>Output:</p>
									<div className='w-full cursor-text rounded-lg border px-3 py-[10px] bg-dark-fill-3 border-transparent text-gray-500 mt-2 animate-pulse'>
										Loading...
									</div>
								</>
							) : testCases.length > 0 && testCases[activeTestCaseId] ? (
								// Render database test case data
								<>
									<p className='text-sm font-medium mt-4 text-white'>Input:</p>
									<div className='w-full cursor-text rounded-lg border px-3 py-[10px] bg-dark-fill-3 border-transparent text-white mt-2'>
										{formatTestCaseInput(testCases[activeTestCaseId].inputs)}
									</div>
									<p className='text-sm font-medium mt-4 text-white'>Expected Output:</p>
									<div className='w-full cursor-text rounded-lg border px-3 py-[10px] bg-dark-fill-3 border-transparent text-white mt-2'>
										{formatExpectedOutput(testCases[activeTestCaseId].expected)}
									</div>
								</>
							) : (
								// Fallback to examples
								<>
									<p className='text-sm font-medium mt-4 text-white'>Input:</p>
									<div className='w-full cursor-text rounded-lg border px-3 py-[10px] bg-dark-fill-3 border-transparent text-white mt-2'>
										{problem.examples[activeTestCaseId]?.inputText}
									</div>
									<p className='text-sm font-medium mt-4 text-white'>Output:</p>
									<div className='w-full cursor-text rounded-lg border px-3 py-[10px] bg-dark-fill-3 border-transparent text-white mt-2'>
										{problem.examples[activeTestCaseId]?.outputText}
									</div>
								</>
							)}
						</div>

						{/* Execution Results */}
						{executionResult && (
							<div className='mt-6 border-t border-gray-700 pt-4'>
								<p className='text-sm font-medium text-white mb-3'>Execution Results:</p>
								<div className='bg-dark-fill-3 border border-gray-700 rounded-lg p-4'>
									<div className='space-y-2'>
										<div className='flex items-center space-x-2'>
											<span className='text-gray-400 text-sm'>Status:</span>
											<span className={`text-sm font-medium ${
												executionResult.status === 'AC' ? 'text-green-400' : 'text-red-400'
											}`}>
												{executionResult.status === 'AC' ? 'Accepted' : executionResult.status}
											</span>
										</div>
										{executionResult.runtime && (
											<div className='flex items-center space-x-2'>
												<span className='text-gray-400 text-sm'>Runtime:</span>
												<span className='text-white text-sm'>{executionResult.runtime}ms</span>
											</div>
										)}
										{executionResult.memoryUsed && (
											<div className='flex items-center space-x-2'>
												<span className='text-gray-400 text-sm'>Memory:</span>
												<span className='text-white text-sm'>{executionResult.memoryUsed}KB</span>
											</div>
										)}
										{executionResult.output && (
											<div>
												<span className='text-gray-400 text-sm'>Output:</span>
												<pre className='text-white text-sm mt-1 bg-dark-layer-1 p-2 rounded'>
													{executionResult.output}
												</pre>
											</div>
										)}
										{executionResult.error && (
											<div>
												<span className='text-red-400 text-sm'>Error:</span>
												<pre className='text-red-400 text-sm mt-1 bg-dark-layer-1 p-2 rounded'>
													{executionResult.error}
												</pre>
											</div>
										)}
									</div>
								</div>
							</div>
						)}
					</div>
				)}
			</Split>
			<EditorFooter 
				handleRun={handleRun} 
				handleSubmit={handleSubmit} 
				isConsoleOpen={isConsoleOpen} 
				toggleConsole={toggleConsole}
				isRunning={isRunning}
				isSubmitting={isSubmitting}
			/>
		</div>
	);
};
export default Playground;
