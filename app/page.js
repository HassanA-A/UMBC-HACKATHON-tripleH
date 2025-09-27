export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center h-screen">
      <h1 className="text-3xl font-bold">Interview Bot</h1>
      <textarea placeholder="Upload Resume Here" className="border p-2 m-2 w-96 h-32" />
      <textarea placeholder="Upload Job Description Here" className="border p-2 m-2 w-96 h-32" />
      <button className="bg-blue-500 text-white px-4 py-2 rounded">Generate</button>
    </div>

  );
}