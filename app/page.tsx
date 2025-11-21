"use client";
import {SignedIn, SignedOut, SignInButton, UserButton} from "@clerk/nextjs";
import FolderSidebar from "@/components/FolderSidebar";
import CardNewForm from "@/components/CardNewForm";
import CardList from "@/components/CardList";
import SearchBar from "@/components/SearchBar";
import {Button} from "@/components/ui/button";
import {RoleBadge} from "@/components/RoleBadge";

export default function HomePage() {
    return (
        <main className="h-screen flex flex-col">
            <header className="flex items-center justify-between px-4 py-2 border-b bg-white">
                <div className="font-semibold flex items-center">Anki Chinese <RoleBadge/></div>
                <div className="flex items-center gap-2">
                    <SignedOut>
                        <SignInButton>
                            <Button variant="outline" size="sm">Sign in</Button>
                        </SignInButton>
                    </SignedOut>
                    <SignedIn>
                        <UserButton afterSignOutUrl="/"/>
                    </SignedIn>
                </div>
            </header>
            <SignedOut>
                <div className="flex-1 flex items-center justify-center">
                    <div className="text-center space-y-3">
                        <h1 className="text-2xl font-semibold">Welcome</h1>
                        <p>Sign in to manage your study folders and cards.</p>
                        <SignInButton>
                            <Button>Sign in</Button>
                        </SignInButton>
                    </div>
                </div>
            </SignedOut>
            <SignedIn>
                <div className="flex flex-1 min-h-0">
                    <FolderSidebar/>
                    <section className="flex-1 p-4 space-y-4 overflow-y-auto">
                        <SearchBar/>
                        <CardNewForm/>
                        <CardList/>
                    </section>
                </div>
            </SignedIn>
        </main>
    );
}
