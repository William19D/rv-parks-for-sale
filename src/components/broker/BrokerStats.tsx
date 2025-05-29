import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Eye, MessageSquare, TrendingUp, ArrowUp } from "lucide-react";

export const BrokerStats = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <Card className="border-gray-200 shadow-sm hover:shadow-md transition-shadow">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-gray-700">Total Views</CardTitle>
          <div className="bg-[#f74f4f]/10 p-2 rounded-full">
            <Eye className="h-4 w-4 text-[#f74f4f]" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">1,284</div>
          <div className="flex items-center mt-1">
            <ArrowUp className="h-3 w-3 text-emerald-500 mr-1" />
            <p className="text-xs text-muted-foreground flex items-center">
              <span className="text-emerald-500 font-medium">+12%</span> 
              <span className="ml-1">from last month</span>
            </p>
          </div>
        </CardContent>
      </Card>
      
      <Card className="border-gray-200 shadow-sm hover:shadow-md transition-shadow">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-gray-700">Total Inquiries</CardTitle>
          <div className="bg-[#f74f4f]/10 p-2 rounded-full">
            <MessageSquare className="h-4 w-4 text-[#f74f4f]" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">32</div>
          <div className="flex items-center mt-1">
            <ArrowUp className="h-3 w-3 text-emerald-500 mr-1" />
            <p className="text-xs text-muted-foreground flex items-center">
              <span className="text-emerald-500 font-medium">+8%</span>
              <span className="ml-1">from last month</span>
            </p>
          </div>
        </CardContent>
      </Card>
      
      <Card className="border-gray-200 shadow-sm hover:shadow-md transition-shadow">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-gray-700">Conversion Rate</CardTitle>
          <div className="bg-[#f74f4f]/10 p-2 rounded-full">
            <TrendingUp className="h-4 w-4 text-[#f74f4f]" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">2.5%</div>
          <div className="flex items-center mt-1">
            <ArrowUp className="h-3 w-3 text-emerald-500 mr-1" />
            <p className="text-xs text-muted-foreground flex items-center">
              <span className="text-emerald-500 font-medium">+0.3%</span>
              <span className="ml-1">from last month</span>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};