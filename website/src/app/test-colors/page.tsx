export default function TestColors() {
  return (
    <div className="min-h-screen p-8">
      <h1 className="text-4xl font-bold mb-8">Color Test Page</h1>
      
      <div className="grid grid-cols-3 gap-8">
        {/* Primary Colors */}
        <div>
          <h2 className="text-2xl font-bold mb-4">Primary Colors</h2>
          <div className="space-y-2">
            <div className="w-32 h-16 bg-primary-50 border flex items-center justify-center text-xs">primary-50</div>
            <div className="w-32 h-16 bg-primary-100 border flex items-center justify-center text-xs">primary-100</div>
            <div className="w-32 h-16 bg-primary-200 border flex items-center justify-center text-xs">primary-200</div>
            <div className="w-32 h-16 bg-primary-300 border flex items-center justify-center text-xs">primary-300</div>
            <div className="w-32 h-16 bg-primary-400 border flex items-center justify-center text-xs">primary-400</div>
            <div className="w-32 h-16 bg-primary-500 border flex items-center justify-center text-xs text-white">primary-500</div>
            <div className="w-32 h-16 bg-primary-600 border flex items-center justify-center text-xs text-white">primary-600</div>
          </div>
        </div>

        {/* Secondary Colors */}
        <div>
          <h2 className="text-2xl font-bold mb-4">Secondary Colors</h2>
          <div className="space-y-2">
            <div className="w-32 h-16 bg-secondary-50 border flex items-center justify-center text-xs">secondary-50</div>
            <div className="w-32 h-16 bg-secondary-100 border flex items-center justify-center text-xs">secondary-100</div>
            <div className="w-32 h-16 bg-secondary-200 border flex items-center justify-center text-xs">secondary-200</div>
            <div className="w-32 h-16 bg-secondary-300 border flex items-center justify-center text-xs">secondary-300</div>
            <div className="w-32 h-16 bg-secondary-400 border flex items-center justify-center text-xs">secondary-400</div>
            <div className="w-32 h-16 bg-secondary-500 border flex items-center justify-center text-xs text-white">secondary-500</div>
            <div className="w-32 h-16 bg-secondary-600 border flex items-center justify-center text-xs text-white">secondary-600</div>
          </div>
        </div>

        {/* Accent Colors */}
        <div>
          <h2 className="text-2xl font-bold mb-4">Accent Colors</h2>
          <div className="space-y-2">
            <div className="w-32 h-16 bg-accent-50 border flex items-center justify-center text-xs">accent-50</div>
            <div className="w-32 h-16 bg-accent-100 border flex items-center justify-center text-xs">accent-100</div>
            <div className="w-32 h-16 bg-accent-200 border flex items-center justify-center text-xs">accent-200</div>
            <div className="w-32 h-16 bg-accent-300 border flex items-center justify-center text-xs">accent-300</div>
            <div className="w-32 h-16 bg-accent-400 border flex items-center justify-center text-xs">accent-400</div>
            <div className="w-32 h-16 bg-accent-500 border flex items-center justify-center text-xs text-white">accent-500</div>
            <div className="w-32 h-16 bg-accent-600 border flex items-center justify-center text-xs text-white">accent-600</div>
            <div className="w-32 h-16 bg-accent-700 border flex items-center justify-center text-xs text-white">accent-700</div>
          </div>
        </div>
      </div>

      {/* Test gradients */}
      <div className="mt-8">
        <h2 className="text-2xl font-bold mb-4">Gradient Tests</h2>
        <div className="space-y-4">
          <div className="w-full h-16 bg-gradient-to-r from-primary-500 to-secondary-500 flex items-center justify-center text-white font-bold">
            Primary to Secondary Gradient
          </div>
          <div className="w-full h-16 bg-editor-primary flex items-center justify-center text-white font-bold">
            Editor Primary Gradient
          </div>
          <div className="w-full h-16 bg-editor-hero flex items-center justify-center text-white font-bold">
            Editor Hero Gradient
          </div>
        </div>
      </div>
    </div>
  )
}
