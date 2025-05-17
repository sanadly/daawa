import React from 'react';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <div className="container mx-auto px-4 py-8">
      {/* Add Header/Navbar components here if needed */}
      <main>{children}</main>
      {/* Add Footer components here if needed */}
    </div>
  );
};

export default Layout; 