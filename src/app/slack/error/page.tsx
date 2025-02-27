export default function ErrorPage() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4 text-red-600">Installation Failed</h1>
        <p>There was an error installing Thread Summarizer.</p>
        <p>Please try again or contact support.</p>
      </div>
    </div>
  );
} 