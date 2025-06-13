import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Header, HeaderSpacer } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { Camera, Loader2, User, Mail, Lock, Check, Save } from "lucide-react";

// Define schema for personal info update
const personalInfoSchema = z.object({
  firstName: z.string().min(2, { message: "First name must be at least 2 characters" }),
  lastName: z.string().min(2, { message: "Last name must be at least 2 characters" }),
  email: z.string().email({ message: "Please enter a valid email address" }),
  phone: z.string().optional(),
});

// Define schema for password update
const passwordSchema = z.object({
  currentPassword: z.string().min(6, { message: "Current password is required" }),
  newPassword: z.string().min(6, { message: "Password must be at least 6 characters" }),
  confirmPassword: z.string().min(6, { message: "Please confirm your new password" }),
}).refine(data => data.newPassword === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

const Profile = () => {
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [activeTab, setActiveTab] = useState("personal");
  
  const { toast } = useToast();
  const { user } = useAuth();
  
  // Create forms with React Hook Form + Zod
  const personalInfoForm = useForm<z.infer<typeof personalInfoSchema>>({
    resolver: zodResolver(personalInfoSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
    },
  });
  
  const passwordForm = useForm<z.infer<typeof passwordSchema>>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });
  
  // Populate form with user data when available
  useEffect(() => {
    if (user) {
      // Get stored user data from localStorage or user object
      const firstName = localStorage.getItem('userFirstName') || user.user_metadata?.first_name || '';
      const lastName = localStorage.getItem('userLastName') || user.user_metadata?.last_name || '';
      const phone = localStorage.getItem('userPhone') || user.user_metadata?.phone_number || '';
      const profilePicUrl = user.user_metadata?.avatar_url || null;
      
      // Set profile image if available
      if (profilePicUrl) {
        setProfileImage(profilePicUrl);
      }
      
      // Set form values
      personalInfoForm.reset({
        firstName,
        lastName,
        email: user.email || '',
        phone,
      });
    }
  }, [user, personalInfoForm]);

  // Handle image upload (simulated)
  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setUploading(true);
      
      // Simulate file upload delay
      setTimeout(() => {
        const reader = new FileReader();
        reader.onloadend = () => {
          setProfileImage(reader.result as string);
          setUploading(false);
          
          toast({
            title: "Profile picture updated",
            description: "Your new profile picture has been saved.",
          });
        };
        reader.readAsDataURL(file);
      }, 1500);
    }
  };

  // Handle personal info form submission
  const onPersonalInfoSubmit = (values: z.infer<typeof personalInfoSchema>) => {
    setSaving(true);
    
    // Simulate API call delay
    setTimeout(() => {
      console.log("Personal info update:", values);
      
      // Save to localStorage for persistence in this demo
      localStorage.setItem('userFirstName', values.firstName);
      localStorage.setItem('userLastName', values.lastName);
      if (values.phone) localStorage.setItem('userPhone', values.phone);
      
      toast({
        title: "Profile updated",
        description: "Your profile information has been saved successfully.",
      });
      
      setSaving(false);
    }, 1000);
  };

  // Handle password form submission
  const onPasswordSubmit = (values: z.infer<typeof passwordSchema>) => {
    setChangingPassword(true);
    
    // Simulate API call delay
    setTimeout(() => {
      console.log("Password update:", values);
      
      toast({
        title: "Password updated",
        description: "Your password has been changed successfully.",
      });
      
      passwordForm.reset({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
      
      setChangingPassword(false);
    }, 1500);
  };

  // Get user initials for Avatar fallback
  const getUserInitials = () => {
    const firstName = personalInfoForm.getValues('firstName') || '';
    const lastName = personalInfoForm.getValues('lastName') || '';
    
    if (firstName && lastName) {
      return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
    } else if (firstName) {
      return firstName.charAt(0).toUpperCase();
    } else if (user?.email) {
      return user.email.charAt(0).toUpperCase();
    }
    
    return "U";
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />
      <HeaderSpacer />
      
      <div className="container mx-auto px-4 py-8 flex-grow">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold mb-2">My Profile</h1>
          <p className="text-gray-500 mb-8">
            Manage your account settings and profile information
          </p>
          
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-8">
              <TabsTrigger value="personal" className="flex items-center gap-2">
                <User className="w-4 h-4" />
                <span>Personal Info</span>
              </TabsTrigger>
              <TabsTrigger value="security" className="flex items-center gap-2">
                <Lock className="w-4 h-4" />
                <span>Security</span>
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="personal">
              <Card>
                <CardHeader>
                  <CardTitle>Personal Information</CardTitle>
                  <CardDescription>
                    Update your personal details and profile
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="mb-8 flex items-center">
                    <div className="relative">
                      <Avatar className="w-24 h-24 border-2 border-gray-100">
                        {profileImage ? (
                          <AvatarImage src={profileImage} alt="Profile" />
                        ) : (
                          <AvatarFallback className="text-xl bg-gray-100 text-gray-800">
                            {getUserInitials()}
                          </AvatarFallback>
                        )}
                      </Avatar>
                      
                      {uploading && (
                        <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center">
                          <Loader2 className="h-8 w-8 text-white animate-spin" />
                        </div>
                      )}
                      
                      <label 
                        htmlFor="profile-upload" 
                        className="absolute bottom-0 right-0 bg-[#f74f4f] p-1.5 rounded-full cursor-pointer text-white hover:bg-[#e43c3c] transition-colors"
                      >
                        <Camera className="h-4 w-4" />
                        <input 
                          type="file" 
                          id="profile-upload" 
                          className="hidden" 
                          accept="image/*" 
                          onChange={handleImageUpload}
                          disabled={uploading}
                        />
                      </label>
                    </div>
                    
                    <div className="ml-6">
                      <h3 className="font-medium">Profile Picture</h3>
                      <p className="text-sm text-gray-500 mb-2">
                        Upload a new profile picture (JPG, PNG, max 5MB)
                      </p>
                      <label htmlFor="profile-upload-btn">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="text-xs"
                          asChild
                        >
                          <span>Change Picture</span>
                        </Button>
                        <input 
                          type="file" 
                          id="profile-upload-btn" 
                          className="hidden" 
                          accept="image/*" 
                          onChange={handleImageUpload}
                          disabled={uploading}
                        />
                      </label>
                    </div>
                  </div>
                  
                  <Separator className="my-6" />
                  
                  <Form {...personalInfoForm}>
                    <form onSubmit={personalInfoForm.handleSubmit(onPersonalInfoSubmit)} className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <FormField
                          control={personalInfoForm.control}
                          name="firstName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>First Name</FormLabel>
                              <FormControl>
                                <Input placeholder="John" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={personalInfoForm.control}
                          name="lastName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Last Name</FormLabel>
                              <FormControl>
                                <Input placeholder="Doe" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      
                      <FormField
                        control={personalInfoForm.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email Address</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="your@email.com" 
                                type="email" 
                                {...field} 
                              />
                            </FormControl>
                            <FormDescription>
                              This is the email used for login and notifications
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={personalInfoForm.control}
                        name="phone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Phone Number</FormLabel>
                            <FormControl>
                              <Input placeholder="(123) 456-7890" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <div className="flex justify-end">
                        <Button 
                          type="submit" 
                          className="bg-[#f74f4f] hover:bg-[#e43c3c]"
                          disabled={saving}
                        >
                          {saving ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Saving...
                            </>
                          ) : (
                            <>
                              <Save className="mr-2 h-4 w-4" />
                              Save Changes
                            </>
                          )}
                        </Button>
                      </div>
                    </form>
                  </Form>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="security">
              <Card>
                <CardHeader>
                  <CardTitle>Security Settings</CardTitle>
                  <CardDescription>
                    Update your password
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Form {...passwordForm}>
                    <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-6">
                      <FormField
                        control={passwordForm.control}
                        name="currentPassword"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Current Password</FormLabel>
                            <FormControl>
                              <Input
                                type="password"
                                placeholder="Your current password"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <FormField
                          control={passwordForm.control}
                          name="newPassword"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>New Password</FormLabel>
                              <FormControl>
                                <Input
                                  type="password"
                                  placeholder="Minimum 6 characters"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={passwordForm.control}
                          name="confirmPassword"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Confirm Password</FormLabel>
                              <FormControl>
                                <Input
                                  type="password"
                                  placeholder="Confirm new password"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      
                      <div className="flex justify-end">
                        <Button 
                          type="submit" 
                          className="bg-[#f74f4f] hover:bg-[#e43c3c]"
                          disabled={changingPassword}
                        >
                          {changingPassword ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Updating Password...
                            </>
                          ) : (
                            <>
                              <Lock className="mr-2 h-4 w-4" />
                              Update Password
                            </>
                          )}
                        </Button>
                      </div>
                    </form>
                  </Form>
                  
                  <Separator className="my-8" />
                  
                  <div>
                    <h3 className="text-lg font-medium mb-2 text-red-600">Danger Zone</h3>
                    <p className="text-sm text-gray-500 mb-4">
                      Permanently delete your account and all associated data.
                    </p>
                    <Button variant="outline" className="text-red-600 border-red-300 hover:bg-red-50">
                      Delete Account
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
      
      <Footer />
    </div>
  );
};

export default Profile;
