import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-base-100">
      {/* Header */}
      <div className="navbar navbar-daawa">
        <div className="navbar-start">
          <Link href="/" className="btn btn-ghost">
            <ArrowLeftIcon className="w-5 h-5 mr-2" />
            Back to Home
          </Link>
        </div>
        <div className="navbar-center">
          <h1 className="text-xl font-bold">About Daawa</h1>
        </div>
        <div className="navbar-end"></div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold mb-4">About Daawa</h1>
            <p className="text-lg text-base-content/70">
              The comprehensive event management platform that transforms how you organize and
              manage events
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-12 items-center mb-16">
            <div>
              <h2 className="text-2xl font-bold mb-4">Our Mission</h2>
              <p className="text-base-content/80 mb-6">
                To simplify event management and make it accessible for organizers of all sizes. We
                believe that creating memorable events should be about the experience, not the
                logistics.
              </p>
              <p className="text-base-content/80">
                Daawa provides all the tools you need to create, promote, and manage successful
                events while ensuring your guests have a seamless experience from registration to
                check-in.
              </p>
            </div>
            <div className="card-daawa card-body">
              <h3 className="card-title">What We Offer</h3>
              <ul className="list-disc list-inside space-y-2 text-base-content/80">
                <li>Intuitive event creation and management</li>
                <li>Flexible guest registration forms</li>
                <li>Digital pass generation (PDF, Apple Wallet, Google Wallet)</li>
                <li>Real-time check-in system</li>
                <li>Multi-language support with RTL for Arabic</li>
                <li>Comprehensive analytics and reporting</li>
              </ul>
            </div>
          </div>

          <div className="text-center">
            <h2 className="text-2xl font-bold mb-4">Built for Modern Events</h2>
            <p className="text-base-content/80 mb-8 max-w-2xl mx-auto">
              Whether you're organizing a small meetup or a large conference, Daawa scales with your
              needs. Our platform is designed with security, performance, and user experience at its
              core.
            </p>
            <Link href="/" className="btn btn-primary btn-lg">
              Start Your Event Journey
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
