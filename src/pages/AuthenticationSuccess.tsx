import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Header, HeaderSpacer } from "@/components/layout/Header";
import { CheckCircle2 } from "lucide-react";
import { motion } from "framer-motion";

const AuthenticationSuccess = () => {
  const navigate = useNavigate();
  const [countdown, setCountdown] = useState(5);

  // Auto redirect after 5 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      navigate("/login");
    }, 5000);

    const countdownInterval = setInterval(() => {
      setCountdown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => {
      clearTimeout(timer);
      clearInterval(countdownInterval);
    };
  }, [navigate]);

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
                <CheckCircle2 className="h-16 w-16 text-green-500" />
              </motion.div>
            </div>
            <CardTitle className="text-2xl font-bold">Email Verified Successfully!</CardTitle>
            <CardDescription className="mt-2 text-base">
              Your email has been verified and your account is now active.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center text-gray-600">
              <p>Thank you for confirming your email address.</p>
              <p className="mt-2">You can now access all features of our platform.</p>
            </div>

            <div className="mt-6 space-y-3">
              <Link to="/login">
                <Button 
                  className="w-full bg-[#f74f4f] hover:bg-[#e43c3c]"
                >
                  Continue to Login
                </Button>
              </Link>

              <p className="text-sm text-center text-gray-500">
                You will be redirected in {countdown} second{countdown !== 1 ? 's' : ''}...
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AuthenticationSuccess;