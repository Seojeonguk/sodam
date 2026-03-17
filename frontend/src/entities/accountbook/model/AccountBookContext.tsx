import {
    createContext,
    useContext,
    useEffect,
    useState,
    type ReactNode,
} from "react";
import type { AccountBookListResponse } from "../api/accountbook.types";
import { useAccountBooks } from "./useAccountBooks";

interface AccountBookContextType {
    accountBooks: AccountBookListResponse[];
    currentAccountBook: AccountBookListResponse | null;
    setCurrentAccountBook: (accountBook: AccountBookListResponse) => void;
    loading: boolean;
    error: string | null;
}

const AccountBookContext = createContext<AccountBookContextType | undefined>(
    undefined
);

export function AccountBookProvider({ children }: { children: ReactNode }) {
    const { accountBooks, loading, error } = useAccountBooks();
    const [currentAccountBook, setCurrentAccountBook] =
        useState<AccountBookListResponse | null>(null);

    useEffect(() => {
        if (accountBooks.length > 0 && !currentAccountBook) {
            setCurrentAccountBook(accountBooks[0]);
        }
    }, [accountBooks, currentAccountBook]);

    return (
        <AccountBookContext.Provider
            value={{
                accountBooks,
                currentAccountBook,
                setCurrentAccountBook,
                loading,
                error,
            }}
        >
            {children}
        </AccountBookContext.Provider>
    );
}

export function useAccountBookContext() {
    const context = useContext(AccountBookContext);
    if (context === undefined) {
        throw new Error(
            "useAccountBookContext must be used within an AccountBookProvider"
        );
    }
    return context;
}
