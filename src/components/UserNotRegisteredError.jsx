import React from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, ArrowRight, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { apiClient } from '@/api/apiClient';

const UserNotRegisteredError = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-black p-4">
      {/* Background glow */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-red-600/10 rounded-full blur-[120px]" />

      <div className="relative max-w-md w-full">
        <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-8">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 mb-6 rounded-2xl bg-red-500/10 border border-red-500/20">
              <AlertTriangle className="w-8 h-8 text-red-400" />
            </div>
            <h1 className="text-2xl font-semibold text-white mb-3">Access Restricted</h1>
            <p className="text-white/40 text-sm mb-6 leading-relaxed">
              This account is not registered to use Searchlyst. You may need to create a new account or contact support.
            </p>

            <div className="p-4 bg-white/[0.02] border border-white/[0.06] rounded-xl text-sm text-white/40 mb-6">
              <p className="mb-2 text-white/50 font-medium">You can try:</p>
              <ul className="space-y-1.5 text-left">
                <li className="flex items-start gap-2">
                  <span className="text-red-400 mt-0.5">-</span>
                  Signing up for a new account
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-400 mt-0.5">-</span>
                  Logging in with a different account
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-400 mt-0.5">-</span>
                  Contacting support for assistance
                </li>
              </ul>
            </div>

            <div className="flex flex-col gap-3">
              <Link to="/Signup">
                <Button className="w-full h-11 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-medium">
                  Create Account
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
              <Button
                onClick={() => apiClient.auth.logout()}
                variant="outline"
                className="w-full h-11 border-white/[0.06] text-white/50 hover:text-white hover:bg-white/[0.03] rounded-xl text-sm"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Log Out
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserNotRegisteredError;
