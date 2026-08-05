import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useState,
    type ReactNode,
} from "react";
import type { AccountBookListResponse } from "../api/accountbook.types";
import { useAccountBooks } from "./useAccountBooks";

const SELECTED_BOOK_KEY = "sodam-selected-book-id";

interface AccountBookContextType {
    accountBooks: AccountBookListResponse[];
    currentAccountBook: AccountBookListResponse | null;
    setCurrentAccountBook: (accountBook: AccountBookListResponse) => void;
    loading: boolean;
    error: string | null;
    fetchAccountBooks: () => Promise<void>;
    resetAccountBooks: () => void;
}

const AccountBookContext = createContext<AccountBookContextType | undefined>(
    undefined
);

export function AccountBookProvider({ children }: { children: ReactNode }) {
    const { accountBooks, loading, error, fetchAccountBooks, resetAccountBooks } = useAccountBooks();
    const [currentAccountBook, setCurrentAccountBookState] =
        useState<AccountBookListResponse | null>(null);

    // 선택 시 localStorage에 저장
    const setCurrentAccountBook = useCallback((book: AccountBookListResponse) => {
        localStorage.setItem(SELECTED_BOOK_KEY, String(book.id));
        setCurrentAccountBookState(book);
    }, []);

    // 가계부 목록이 로드되면 이전 선택 복원 (없으면 첫 번째)
    useEffect(() => {
        if (accountBooks.length === 0) {
            if (currentAccountBook !== null) setCurrentAccountBookState(null);
            return;
        }
        const exists = currentAccountBook && accountBooks.some(b => b.id === currentAccountBook.id);
        if (!exists) {
            const savedId = localStorage.getItem(SELECTED_BOOK_KEY);
            const saved = savedId ? accountBooks.find(b => b.id === Number(savedId)) : null;
            setCurrentAccountBookState(saved ?? accountBooks[0]);
        }
    }, [accountBooks]); // eslint-disable-line react-hooks/exhaustive-deps

    return (
        <AccountBookContext.Provider
            value={{
                accountBooks,
                currentAccountBook,
                setCurrentAccountBook,
                loading,
                error,
                fetchAccountBooks,
                resetAccountBooks,
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
