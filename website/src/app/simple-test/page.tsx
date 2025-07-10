export default function SimplePage() {
  return (
    <div className="min-h-screen bg-red-500 p-8">
      <h1 className="text-white text-4xl font-bold mb-4">Test Page</h1>
      <p className="text-white text-lg">If you can see red background and white text, Tailwind is working.</p>
      <div className="mt-4 p-4 bg-blue-500 text-white rounded">
        Blue box test
      </div>
      <div className="mt-4 p-4 bg-primary-500 text-white rounded">
        Primary color test (should be LiveEditor blue)
      </div>
    </div>
  )
}
