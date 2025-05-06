import { useSearchParams } from "react-router";
import Pagination from "~/components/pagination";

export default function ExamplePage() {
  const [searchParams] = useSearchParams()

  // Get the current page from the search params or default to 1
  const currentPage = Number(searchParams.get("page")) || 1

  // Example total pages - in a real app, this would come from your data
  const totalPages = 10

  return (
    <div className="py-10 flex flex-col items-center">
      <h1 className="text-2xl font-bold mb-8">Pagination Example</h1>

      {/* Your page content would go here */}
      <div className="mb-8">
        <p>Current Page: {currentPage}</p>
        <p>Total Pages: {totalPages}</p>
      </div>

      <Pagination totalPages={totalPages} />
    </div>
  )
}
