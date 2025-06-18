import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/use-toast";
import { Loader2, User, Mail, Phone } from "lucide-react";
import { motion } from "framer-motion";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useNavigate } from "react-router-dom";

const UserProfile = () => {
  const { user, loading, updateUserProfile } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  // Form states - ONLY registration fields
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  
  // UI states
  const [isUpdating, setIsUpdating] = useState(false);
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [hasChanges, setHasChanges] = useState(false);
  
  // Load user data when component mounts
  useEffect(() => {
    if (user) {
      // Get user metadata
      const metadata = user.user_metadata || {};
      
      setFirstName(metadata.first_name || "");
      setLastName(metadata.last_name || "");
      setEmail(user.email || "");
      setPhone(metadata.phone || "");
      setProfileImage(metadata.profile_image_url || null);
    }
  }, [user]);
  
  // Check if form has changes - ONLY for registration fields
  useEffect(() => {
    if (!user) return;
    
    const metadata = user.user_metadata || {};
    
    const hasFormChanges = 
      firstName !== (metadata.first_name || "") ||
      lastName !== (metadata.last_name || "") ||
      phone !== (metadata.phone || "");
      
    setHasChanges(hasFormChanges);
  }, [firstName, lastName, phone, user]);
  
  // If not logged in, redirect to login
  useEffect(() => {
    if (!loading && !user) {
      navigate("/login/", { replace: true });
    }
  }, [loading, user, navigate]);
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#f74f4f]" />
      </div>
    );
  }
  
  if (!user) {
    return null; // Will redirect via useEffect
  }
  
  // Function to get user initials for avatar fallback
  const getUserInitials = () => {
    if (firstName && lastName) {
      return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
    }
    if (firstName) {
      return firstName.charAt(0).toUpperCase();
    }
    if (user.email) {
      return user.email.charAt(0).toUpperCase();
    }
    return "U";
  };
  
  // Handle form submission - ONLY for registration fields
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!hasChanges) return;
    
    setIsUpdating(true);
    
    try {
      // Update user metadata - ONLY registration fields
      await updateUserProfile({
        first_name: firstName,
        last_name: lastName,
        phone: phone
      });
      
      // Also update localStorage values if they exist
      if (firstName) localStorage.setItem("userFirstName", firstName);
      if (lastName) localStorage.setItem("userLastName", lastName);
      
      toast({
        title: "Profile updated",
        description: "Your profile has been successfully updated.",
      });
      
      setHasChanges(false);
    } catch (error) {
      console.error("Error updating profile:", error);
      toast({
        title: "Error updating profile",
        description: "There was a problem updating your profile. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };
  
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto py-12 px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-4xl mx-auto"
        >
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">My Profile</h1>
            <p className="text-muted-foreground">
              Manage your account information
            </p>
          </div>
          
          <Tabs defaultValue="profile" className="space-y-8">
            <TabsList>
              <TabsTrigger value="profile">Profile</TabsTrigger>
              <TabsTrigger value="account">Account Settings</TabsTrigger>
            </TabsList>
            
            <TabsContent value="profile" className="space-y-6">
              {/* Profile Card */}
              <Card>
                <CardHeader>
                  <CardTitle>Profile Information</CardTitle>
                  <CardDescription>
                    Update your personal information.
                  </CardDescription>
                </CardHeader>
                
                <CardContent>
                  <div className="flex flex-col md:flex-row gap-8">
                    {/* Profile Image Section - Simplified to just show avatar */}
                    <div className="flex flex-col items-center space-y-4">
                      <div className="relative">
                        <Avatar className="w-32 h-32">
                          <AvatarFallback className="text-2xl bg-[#f74f4f]/10 text-[#f74f4f]">
                            {getUserInitials()}
                          </AvatarFallback>
                        </Avatar>
                      </div>
                    </div>
                    
                    {/* Profile Form - ONLY registration fields */}
                    <form onSubmit={handleSubmit} className="flex-1">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                        <div className="space-y-2">
                          <Label htmlFor="firstName">First name</Label>
                          <div className="flex">
                            <User className="w-4 h-4 text-gray-500 mr-2 mt-3" />
                            <Input 
                              id="firstName" 
                              value={firstName}
                              onChange={(e) => setFirstName(e.target.value)}
                              placeholder="Enter your first name"
                            />
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="lastName">Last name</Label>
                          <div className="flex">
                            <User className="w-4 h-4 text-gray-500 mr-2 mt-3" />
                            <Input 
                              id="lastName" 
                              value={lastName}
                              onChange={(e) => setLastName(e.target.value)}
                              placeholder="Enter your last name"
                            />
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="email">Email</Label>
                          <div className="flex">
                            <Mail className="w-4 h-4 text-gray-500 mr-2 mt-3" />
                            <Input 
                              id="email" 
                              type="email"
                              value={email}
                              disabled
                              className="bg-gray-50"
                            />
                          </div>
                          <p className="text-xs text-muted-foreground">
                            Email cannot be changed directly
                          </p>
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="phone">Phone number</Label>
                          <div className="flex">
                            <Phone className="w-4 h-4 text-gray-500 mr-2 mt-3" />
                            <Input 
                              id="phone" 
                              value={phone}
                              onChange={(e) => setPhone(e.target.value)}
                              placeholder="Enter your phone number"
                            />
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex justify-end">
                        <Button 
                          type="submit"
                          className="bg-[#f74f4f] hover:bg-[#e43c3c]"
                          disabled={isUpdating || !hasChanges}
                        >
                          {isUpdating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                          Save Changes
                        </Button>
                      </div>
                    </form>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="account" className="space-y-6">
              {/* Account Settings Card */}
              <Card>
                <CardHeader>
                  <CardTitle>Account Settings</CardTitle>
                  <CardDescription>
                    Manage your account security and preferences
                  </CardDescription>
                </CardHeader>
                
                <CardContent className="space-y-6">
                  <div>
                    <h3 className="text-lg font-medium mb-2">Change Password</h3>
                    <p className="text-muted-foreground mb-4">
                      Update your password to keep your account secure
                    </p>
                    <Button 
                      variant="outline" 
                      onClick={() => navigate("/forgot-password/")}
                    >
                      Reset Password
                    </Button>
                  </div>
                  
                  <div className="pt-4 border-t border-gray-200">
                    <h3 className="text-lg font-medium mb-2 text-red-500">Danger Zone</h3>
                    <p className="text-muted-foreground mb-4">
                      Once you delete your account, there is no going back. Please be certain.
                    </p>
                    <Button variant="destructive">
                      Delete Account
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </motion.div>
      </div>
      <Footer />
    </div>
  );
};

export default UserProfile;