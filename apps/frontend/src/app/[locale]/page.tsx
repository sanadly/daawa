import { ChevronRightIcon, CalendarIcon, UsersIcon, TicketIcon } from '@heroicons/react/24/outline';

export default function HomePage() {
  return (
    <main className="min-h-screen">
      {/* Hero Section */}
      <section className="hero min-h-screen bg-gradient-to-br from-primary to-primary-focus">
        <div className="hero-content text-center text-primary-content">
          <div className="max-w-md">
            <h1 className="mb-5 text-5xl font-bold">Welcome to Daawa</h1>
            <p className="mb-5 text-lg">
              The comprehensive event management platform that simplifies organizing and managing
              events
            </p>
            <div className="flex gap-4 justify-center">
              <button className="btn btn-accent btn-lg">
                Get Started
                <ChevronRightIcon className="w-5 h-5 ml-2" />
              </button>
              <button className="btn btn-outline btn-lg text-white border-white hover:bg-white hover:text-primary">
                Learn More
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-base-100">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Powerful Features</h2>
            <p className="text-lg text-base-content/70 max-w-2xl mx-auto">
              Everything you need to create, manage, and run successful events
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="card-daawa card-body text-center">
              <CalendarIcon className="w-12 h-12 mx-auto mb-4 text-primary" />
              <h3 className="card-title justify-center">Event Creation</h3>
              <p>Create and configure events with multiple tiers and custom forms</p>
            </div>

            <div className="card-daawa card-body text-center">
              <UsersIcon className="w-12 h-12 mx-auto mb-4 text-primary" />
              <h3 className="card-title justify-center">Guest Management</h3>
              <p>Manage guest lists, invitations, and check-ins seamlessly</p>
            </div>

            <div className="card-daawa card-body text-center">
              <TicketIcon className="w-12 h-12 mx-auto mb-4 text-primary" />
              <h3 className="card-title justify-center">Digital Passes</h3>
              <p>Generate PDF, Apple Wallet, and Google Wallet passes automatically</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-primary text-primary-content">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold mb-4">Ready to Get Started?</h2>
          <p className="text-lg mb-8 opacity-90">
            Join thousands of event organizers who trust Daawa for their events
          </p>
          <button className="btn btn-accent btn-lg">Start Your Free Trial</button>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer footer-center p-10 bg-base-200 text-base-content">
        <aside>
          <h3 className="text-2xl font-bold text-primary">Daawa</h3>
          <p className="font-medium">Event Management System</p>
          <p>Copyright © 2024 - All rights reserved</p>
        </aside>
      </footer>
    </main>
  );
}
