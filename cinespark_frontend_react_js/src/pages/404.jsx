import { Link } from 'react-router-dom'
import Header from '../components/layout/Header'
import Footer from '../components/layout/Footer'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-cinema-900 animate-fade-in">
      <Header />

      <main className="pt-16 flex items-center justify-center min-h-screen px-4">
        <div className="text-center animate-slide-up">
          <p className="text-cinema-gold font-display text-[8rem] font-bold leading-none select-none">
            404
          </p>
          <h1 className="text-2xl md:text-3xl font-display font-bold text-white mb-3">
            Page Not Found
          </h1>
          <p className="text-gray-400 mb-8 max-w-sm mx-auto">
            Looks like this screen is dark. The page you&apos;re looking for doesn&apos;t exist.
          </p>
          <Link
            to="/"
            className="inline-block bg-cinema-gold text-cinema-900 font-bold px-8 py-3 rounded-full hover:bg-yellow-500 transition-all hover:scale-105"
          >
            Back to Home
          </Link>
        </div>
      </main>

      <Footer />
    </div>
  )
}
