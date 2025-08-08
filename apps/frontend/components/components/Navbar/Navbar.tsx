'use client';

import Link from "next/link";
import React, { useEffect, useMemo, useState } from "react";
import { FaChevronLeft, FaChevronRight } from "react-icons/fa";
import { BsList } from "react-icons/bs";
import Timer from "../Timer/Timer";
import { useRouter, useParams, usePathname } from "next/navigation";
import { getAllQuestions } from "@/hooks/hooks/getProblemData";
import {
  SignInButton,
  SignUpButton,
  SignedIn,
  SignedOut,
  UserButton,
} from '@clerk/nextjs';

type NavbarProps = {
	problemPage?: boolean;
};

const Navbar: React.FC<NavbarProps> = ({ problemPage }) => {
	const router = useRouter();
	const params = useParams();
	const pathname = usePathname();
	
	// Auto-detect if we're on a problem page
	const isOnProblemPage = problemPage || pathname?.startsWith('/problems/');

    // Problem navigation state (only used on problem pages)
    const [questionIds, setQuestionIds] = useState<string[]>([]);
    const [isLoadingQuestions, setIsLoadingQuestions] = useState<boolean>(false);

    // Extract current pid from params when on a problem page
    const currentPid: string | null = useMemo(() => {
        if (!isOnProblemPage) return null;
        const raw = (params as any)?.pid;
        if (!raw) return null;
        if (Array.isArray(raw)) return raw[0] ?? null;
        return String(raw);
    }, [params, isOnProblemPage]);

    // Load all questions to enable prev/next navigation
    useEffect(() => {
        if (!isOnProblemPage) return;
        let isCancelled = false;
        const load = async () => {
            try {
                setIsLoadingQuestions(true);
                const questions = await getAllQuestions();
                if (!isCancelled && Array.isArray(questions)) {
                    const ids = questions.map(q => q.id).filter(Boolean);
                    setQuestionIds(ids);
                }
            } catch (error) {
                // Silent fail; buttons will be disabled
                console.error('Failed to load questions for navigation', error);
            } finally {
                if (!isCancelled) setIsLoadingQuestions(false);
            }
        };
        load();
        return () => { isCancelled = true; };
    }, [isOnProblemPage]);

    const currentIndex = useMemo(() => {
        if (!currentPid) return -1;
        return questionIds.findIndex(id => id === currentPid);
    }, [questionIds, currentPid]);

    const canGoPrev = isOnProblemPage && currentIndex > 0;
    const canGoNext = isOnProblemPage && currentIndex >= 0 && currentIndex < questionIds.length - 1;

    const handleProblemChange = (isForward: boolean) => {
        if (!isOnProblemPage || isLoadingQuestions || currentIndex === -1) return;
        const nextIndex = isForward ? currentIndex + 1 : currentIndex - 1;
        if (nextIndex < 0 || nextIndex >= questionIds.length) return;
        const nextId = questionIds[nextIndex];
        if (!nextId) return;
        router.push(`/problems/${nextId}`);
    };

	// If it's a problem page, use dark theme styling
	if (isOnProblemPage) {
		return (
			<nav className='relative flex h-[60px] w-full shrink-0 items-center px-6 bg-dark-layer-1 border-b border-dark-divider-border-2 text-dark-label-2'>
				<div className={`flex w-full items-center justify-between ${!isOnProblemPage ? "max-w-[1200px] mx-auto" : ""}`}>
					<Link href='/' className='h-[22px] flex-1'>
						<div className='text-xl font-bold text-white hover:text-brand-orange transition-all duration-300'>
							CodeQuest
						</div>
					</Link>

                    {isOnProblemPage && (
						<div className='flex items-center gap-4 flex-1 justify-center'>
                            <div
                                className={`flex items-center justify-center rounded-lg h-10 w-10 transition-all duration-200 border ${canGoPrev ? 'bg-dark-layer-1 hover:bg-dark-fill-3 cursor-pointer border-dark-divider-border-2 hover:border-brand-orange/50' : 'bg-dark-fill-3 cursor-not-allowed opacity-50 border-dark-divider-border-2'}`}
                                aria-disabled={!canGoPrev}
                                onClick={() => canGoPrev && handleProblemChange(false)}
                            >
                                <FaChevronLeft className='text-dark-label-2' />
                            </div>
							<Link
								href='/'
								className='flex items-center gap-2 font-medium max-w-[170px] text-dark-label-2 cursor-pointer hover:text-brand-orange transition-colors duration-200'
							>
								<div className='p-2 bg-dark-layer-1 rounded-lg border border-dark-divider-border-2'>
									<BsList className='text-lg' />
								</div>
								<p>Problem List</p>
							</Link>
                            <div
                                className={`flex items-center justify-center rounded-lg h-10 w-10 transition-all duration-200 border ${canGoNext ? 'bg-dark-layer-1 hover:bg-dark-fill-3 cursor-pointer border-dark-divider-border-2 hover:border-brand-orange/50' : 'bg-dark-fill-3 cursor-not-allowed opacity-50 border-dark-divider-border-2'}`}
                                aria-disabled={!canGoNext}
                                onClick={() => canGoNext && handleProblemChange(true)}
                            >
                                <FaChevronRight className='text-dark-label-2' />
                            </div>
						</div>
					)}

					<div className='flex items-center space-x-4 flex-1 justify-end'>
						<SignedOut>
							<SignInButton>
								<button className='bg-dark-layer-1 py-2 px-4 cursor-pointer rounded-lg hover:bg-dark-fill-3 border border-dark-divider-border-2 hover:border-brand-orange/50 transition-all duration-200 font-medium text-dark-label-2'>
									Sign In
								</button>
							</SignInButton>
							<SignUpButton>
								<button className='bg-dark-layer-1 py-2 px-4 cursor-pointer rounded-lg hover:bg-dark-fill-3 border border-dark-divider-border-2 hover:border-brand-orange/50 transition-all duration-200 font-medium text-dark-label-2'>
									Sign Up
								</button>
							</SignUpButton>
						</SignedOut>
						<SignedIn>
							{isOnProblemPage && <Timer />}
							<UserButton />
						</SignedIn>
					</div>
				</div>
			</nav>
		);
	}

	// Default theme for general pages - matches home page styling
	return (
		<nav className='relative flex h-[80px] w-full shrink-0 items-center px-6 bg-dark-layer-1 border-b border-dark-divider-border-2'>
			<div className='flex items-center justify-between w-full max-w-7xl mx-auto'>
				<Link href='/' className='flex items-center justify-center'>
					<div className='text-2xl font-bold text-white hover:text-brand-orange transition-all duration-300'>
						CodeQuest
					</div>
				</Link>
				<div className='flex items-center gap-4'>
					<SignedOut>
						<SignInButton>
							<button
								className='bg-dark-layer-1 text-dark-label-2 px-4 py-2 rounded-lg text-sm font-medium
								hover:bg-dark-fill-3 hover:text-white border border-dark-divider-border-2 hover:border-brand-orange/50
								transition-all duration-200'
							>
								Sign In
							</button>
						</SignInButton>
						<SignUpButton>
							<button
								className='bg-gradient-to-r from-brand-orange to-orange-600 text-white px-4 py-2 rounded-lg text-sm font-medium
								hover:from-orange-600 hover:to-brand-orange transform hover:scale-105
								transition-all duration-200 shadow-lg'
							>
								Sign Up
							</button>
						</SignUpButton>
					</SignedOut>
					<SignedIn>
						<UserButton />
					</SignedIn>
				</div>
			</div>
		</nav>
	);
};

export default Navbar;