import React from "react";

function SimpleFooter() {
  return (
    <footer className="bg-gray-900 text-gray-200 text-center py-4 w-full mt-auto">
      <div className="text-sm">© {new Date().getFullYear()} TransLogic AI. All rights reserved.</div>
    </footer>
  );
}

export default SimpleFooter;
