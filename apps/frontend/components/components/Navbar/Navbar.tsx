'use client';

import Link from "next/link";
import React from "react";
import { FaChevronLeft, FaChevronRight } from "react-icons/fa";
import { BsList } from "react-icons/bs";
import Timer from "../Timer/Timer";
import { useRouter, useParams, usePathname } from "next/navigation";
// Note: Problem navigation is temporarily disabled while transitioning to database
// import { problems } from "@/utils/utils/problems";
import { Problem } from "@/utils/utils/types/problem";
import { toast } from "react-toastify";
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

	const handleProblemChange = (isForward: boolean) => {
		// TODO: Implement database-driven navigation
		// For now, navigation between problems is disabled
		console.log('Problem navigation temporarily disabled - transitioning to database');
		toast.info('Problem navigation will be available once database integration is complete', {
			position: "top-center",
			autoClose: 3000,
			theme: "dark",
		});
	};

	// If it's a problem page, use dark theme styling
	if (isOnProblemPage) {
		return (
			<nav className='relative flex h-[50px] w-full shrink-0 items-center px-5 bg-dark-layer-1 text-dark-gray-7'>
				<div className={`flex w-full items-center justify-between ${!isOnProblemPage ? "max-w-[1200px] mx-auto" : ""}`}>
					<Link href='/' className='h-[22px] flex-1'>
						<div className='text-lg font-bold text-brand-orange hover:text-white transition-colors duration-300'>
							CodeQuest
						</div>
					</Link>

					{isOnProblemPage && (
						<div className='flex items-center gap-4 flex-1 justify-center'>
							<div
								className='flex items-center justify-center rounded bg-dark-fill-3 hover:bg-dark-fill-2 h-8 w-8 cursor-pointer'
								onClick={() => handleProblemChange(false)}
							>
								<FaChevronLeft />
							</div>
							<Link
								href='/'
								className='flex items-center gap-2 font-medium max-w-[170px] text-dark-gray-8 cursor-pointer'
							>
								<div>
									<BsList />
								</div>
								<p>Problem List</p>
							</Link>
							<div
								className='flex items-center justify-center rounded bg-dark-fill-3 hover:bg-dark-fill-2 h-8 w-8 cursor-pointer'
								onClick={() => handleProblemChange(true)}
							>
								<FaChevronRight />
							</div>
						</div>
					)}

					<div className='flex items-center space-x-4 flex-1 justify-end'>
						<div>
							<a
								href='https://www.buymeacoffee.com/burakorkmezz'
								target='_blank'
								rel='noreferrer'
								className='bg-dark-fill-3 py-1.5 px-3 cursor-pointer rounded text-brand-orange hover:bg-dark-fill-2'
							>
								Premium
							</a>
						</div>
						<SignedOut>
							<SignInButton>
								<button className='bg-dark-fill-3 py-1 px-2 cursor-pointer rounded hover:bg-dark-fill-2'>
									Sign In
								</button>
							</SignInButton>
							<SignUpButton>
								<button className='bg-dark-fill-3 py-1 px-2 cursor-pointer rounded hover:bg-dark-fill-2'>
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

	// Default light theme for general pages
	return (
		<div className='flex items-center justify-between sm:px-12 px-2 md:px-24 h-20'>
			<Link href='/' className='flex items-center justify-center h-20'>
				<div className='text-2xl font-bold text-brand-orange hover:text-white transition-colors duration-300'>
					CodeQuest
				</div>
			</Link>
			<div className='flex items-center gap-4'>
				<SignedOut>
					<SignInButton>
						<button
							className='bg-brand-orange text-white px-2 py-1 sm:px-4 rounded-md text-sm font-medium
							hover:text-brand-orange hover:bg-white hover:border-2 hover:border-brand-orange border-2 border-transparent
							transition duration-300 ease-in-out'
						>
							Sign In
						</button>
					</SignInButton>
					<SignUpButton>
						<button
							className='bg-brand-orange text-white px-2 py-1 sm:px-4 rounded-md text-sm font-medium
							hover:text-brand-orange hover:bg-white hover:border-2 hover:border-brand-orange border-2 border-transparent
							transition duration-300 ease-in-out'
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
	);
};

export default Navbar;