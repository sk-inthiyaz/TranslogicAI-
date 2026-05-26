import React from "react";
import DriverNavbar from "./DriverNavbar";
import Footer from "./Footer";

function DriverLayout({ children }) {
  return (
    <div className="flex flex-col min-h-screen">
      <DriverNavbar />
      <main className="flex-1 bg-gradient-to-br from-blue-50 to-blue-100">{children}</main>
      <Footer />
    </div>
  );
}

export default DriverLayout;
