import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "~/lib/utils";

interface PaginationProps {
    currentPage: number;
    totalPages: number;
    onPageChange: (page: number) => void;
    className?: string;
}

export function Pagination({ currentPage, totalPages, onPageChange, className }: PaginationProps) {
    const pages = Array.from({ length: totalPages }, (_, i) => i + 1);

    return (
        <div className={cn("flex items-center justify-between px-2 py-4", className)}>
            <div className="text-sm text-muted-foreground">
                Showing page <span className="font-semibold text-foreground">{currentPage}</span> of{" "}
                <span className="font-semibold text-foreground">{totalPages}</span>
            </div>
            <div className="flex items-center gap-1">
                <button
                    onClick={() => onPageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="p-2 rounded-lg border hover:bg-muted disabled:opacity-50 disabled:hover:bg-transparent transition-colors"
                >
                    <ChevronLeft size={18} />
                </button>

                <div className="flex items-center gap-1 mx-2">
                    {pages.map((page) => (
                        <button
                            key={page}
                            onClick={() => onPageChange(page)}
                            className={cn(
                                "w-9 h-9 flex items-center justify-center rounded-lg border text-sm font-medium transition-colors",
                                currentPage === page
                                    ? "bg-primary text-primary-foreground border-primary"
                                    : "hover:bg-muted"
                            )}
                        >
                            {page}
                        </button>
                    ))}
                </div>

                <button
                    onClick={() => onPageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="p-2 rounded-lg border hover:bg-muted disabled:opacity-50 disabled:hover:bg-transparent transition-colors"
                >
                    <ChevronRight size={18} />
                </button>
            </div>
        </div>
    );
}
