export default function Footer() {
  return (
    <footer className="glass-panel border-t border-white/10 mt-16 py-10 text-center">
      <div className="max-w-7xl mx-auto px-4">
        <p className="text-2xl font-display font-bold text-cinema-gold mb-2">CineSpark</p>
        <p className="text-sm text-gray-400 mb-1">
          © {new Date().getFullYear()} CineSpark. All rights reserved.
        </p>
        <p className="text-xs text-gray-500 mb-0.5">
          Developed by <span className="text-cinema-gold font-semibold">Emil</span>
        </p>
        <p className="text-xs text-gray-600">
          A Final Year BSc Computer Science Project
        </p>
      </div>
    </footer>
  )
}
