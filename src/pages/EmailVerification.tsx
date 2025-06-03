
import { Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Header, HeaderSpacer } from "@/components/layout/Header";
import { Mail, CheckCircle2 } from "lucide-react";
import { motion } from "framer-motion";

const EmailVerification = () => {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />
      <HeaderSpacer />

      <div className="flex-grow flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ 
                  type: "spring", 
                  stiffness: 260, 
                  damping: 20, 
                  delay: 0.2 
                }}
              >
                <Mail className="h-16 w-16 text-[#f74f4f]" />
              </motion.div>
            </div>
            <CardTitle className="text-2xl font-bold">Check Your Email</CardTitle>
            <CardDescription className="mt-2 text-base">
              We've sent you a verification link to complete your registration.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center text-gray-600">
              <p>Please check your email inbox and click the verification link to activate your account.</p>
              <p className="mt-2">Don't forget to check your spam folder if you don't see the email.</p>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
              <div className="flex items-start">
                <CheckCircle2 className="h-5 w-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" />
                <div className="text-sm text-blue-800">
                  <p className="font-medium">What happens next?</p>
                  <ul className="mt-2 space-y-1">
                    <li>• Click the verification link in your email</li>
                    <li>• Your account will be activated automatically</li>
                    <li>• You'll be redirected back to sign in</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="mt-6 space-y-3">
              <Link to="/login">
                <Button 
                  variant="outline"
                  className="w-full"
                >
                  Back to Login
                </Button>
              </Link>

              <Link to="/">
                <Button 
                  className="w-full bg-[#f74f4f] hover:bg-[#e43c3c]"
                >
                  Continue Browsing
                </Button>
              </Link>
            </div>

            <div className="text-center text-sm text-gray-500 mt-4">
              <p>Didn't receive an email? Contact support for assistance.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default EmailVerification;
