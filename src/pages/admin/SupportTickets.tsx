import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { AdminLayout } from "@/components/admin/AdminLayout";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { Loader2, Send, User, Calendar, Tag, Mail, Search, Filter, SlidersHorizontal, CalendarIcon, Trash2 } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { format } from "date-fns";
import { DateRangePicker } from "../../components/ui/date-range-picker";

// Define types
interface SupportTicket {
  id: string;
  name: string;
  email: string;
  topic: string;
  message: string;
  status: 'new' | 'in-progress' | 'resolved';
  user_id: string | null;
  created_at: string;
  response?: string | null;
}

const SupportTickets = () => {
  const { isAdmin } = useAuth();
  const { toast } = useToast();
  
  // State variables
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [filteredTickets, setFilteredTickets] = useState<SupportTicket[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [response, setResponse] = useState("");
  const [status, setStatus] = useState<string>("");
  const [currentTab, setCurrentTab] = useState<string>("all");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [ticketToDelete, setTicketToDelete] = useState<string | null>(null);
  
  // Filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [topicFilter, setTopicFilter] = useState("all");
  const [dateFrom, setDateFrom] = useState<Date | undefined>(undefined);
  const [dateTo, setDateTo] = useState<Date | undefined>(undefined);
  const [sortField, setSortField] = useState("created_at");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  
  // Fetch tickets on component mount
  useEffect(() => {
    fetchTickets();
  }, []);
  
  // Apply filters when tab changes or filter criteria change
  useEffect(() => {
    applyFilters();
  }, [tickets, currentTab, searchQuery, topicFilter, dateFrom, dateTo, sortField, sortDirection]);
  
  // Fetch all support tickets
  const fetchTickets = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('support_tickets')
        .select('*')
        .order('created_at', { ascending: false });
        
      if (error) throw error;
      
      setTickets(data || []);
    } catch (error) {
      console.error("Error fetching support tickets:", error);
      toast({
        title: "Error",
        description: "Failed to load support tickets",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  // Apply filters and sorting to tickets
  const applyFilters = () => {
    if (tickets.length === 0) return;
    
    let filtered = [...tickets];
    
    // Filter by status tab
    if (currentTab === "new") {
      filtered = filtered.filter(ticket => ticket.status === "new");
    } else if (currentTab === "in-progress") {
      filtered = filtered.filter(ticket => ticket.status === "in-progress");
    } else if (currentTab === "resolved") {
      filtered = filtered.filter(ticket => ticket.status === "resolved");
    }
    
    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(ticket => 
        ticket.name.toLowerCase().includes(query) ||
        ticket.email.toLowerCase().includes(query) ||
        ticket.message.toLowerCase().includes(query) ||
        ticket.topic.toLowerCase().includes(query)
      );
    }
    
    // Filter by topic
    if (topicFilter && topicFilter !== 'all') {
      filtered = filtered.filter(ticket => ticket.topic === topicFilter);
    }
    
    // Filter by date range
    if (dateFrom) {
      filtered = filtered.filter(ticket => new Date(ticket.created_at) >= dateFrom);
    }
    
    if (dateTo) {
      const endOfDay = new Date(dateTo);
      endOfDay.setHours(23, 59, 59, 999);
      filtered = filtered.filter(ticket => new Date(ticket.created_at) <= endOfDay);
    }
    
    // Apply sorting
    filtered.sort((a, b) => {
      if (sortField === "created_at") {
        return sortDirection === "asc" 
          ? new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
          : new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      } else if (sortField === "name") {
        return sortDirection === "asc"
          ? a.name.localeCompare(b.name)
          : b.name.localeCompare(a.name);
      } else if (sortField === "topic") {
        return sortDirection === "asc"
          ? a.topic.localeCompare(b.topic)
          : b.topic.localeCompare(a.topic);
      } else {
        return 0;
      }
    });
    
    setFilteredTickets(filtered);
  };
  
  // Reset all filters
  const resetFilters = () => {
    setSearchQuery("");
    setTopicFilter("all");
    setDateFrom(undefined);
    setDateTo(undefined);
    setSortField("created_at");
    setSortDirection("desc");
  };
  
  // Handle viewing a ticket
  const handleViewTicket = (ticket: SupportTicket) => {
    setSelectedTicket(ticket);
    setResponse(ticket.response || "");
    setStatus(ticket.status);
    setIsDialogOpen(true);
  };
  
  // Handle updating a ticket
  const handleUpdateTicket = async () => {
    if (!selectedTicket) return;
    
    setIsSubmitting(true);
    
    try {
      const { error } = await supabase
        .from('support_tickets')
        .update({
          status,
          response,
        })
        .eq('id', selectedTicket.id);
        
      if (error) throw error;
      
      // Update local state with the changes
      setTickets(prevTickets => 
        prevTickets.map(ticket => 
          ticket.id === selectedTicket.id 
            ? { ...ticket, status: status as any, response } 
            : ticket
        )
      );
      
      toast({
        title: "Success",
        description: "Support ticket updated successfully",
      });
      
      setIsDialogOpen(false);
    } catch (error) {
      console.error("Error updating ticket:", error);
      toast({
        title: "Error",
        description: "Failed to update ticket",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Handle deleting a ticket
  const handleDeleteTicket = async () => {
    if (!ticketToDelete) return;
    
    setIsSubmitting(true);
    
    try {
      const { error } = await supabase
        .from('support_tickets')
        .delete()
        .eq('id', ticketToDelete);
        
      if (error) throw error;
      
      // Update local state by removing the deleted ticket
      setTickets(prevTickets => 
        prevTickets.filter(ticket => ticket.id !== ticketToDelete)
      );
      
      toast({
        title: "Success",
        description: "Support ticket deleted successfully",
      });
      
      setIsDeleteConfirmOpen(false);
      setTicketToDelete(null);
      
      // Close the dialog if the deleted ticket was being viewed
      if (selectedTicket?.id === ticketToDelete) {
        setIsDialogOpen(false);
      }
    } catch (error) {
      console.error("Error deleting ticket:", error);
      toast({
        title: "Error",
        description: "Failed to delete ticket",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Get status badge color
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'new':
        return <Badge variant="default" className="bg-blue-500">New</Badge>;
      case 'in-progress':
        return <Badge variant="default" className="bg-yellow-500">In Progress</Badge>;
      case 'resolved':
        return <Badge variant="default" className="bg-green-500">Resolved</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };
  
  // Get topic display name
  const getTopicName = (topicValue: string) => {
    const topics: Record<string, string> = {
      'account': 'Account Issues',
      'listing': 'Listing Problems',
      'payment': 'Payment Questions',
      'suggestion': 'Feature Suggestions',
      'bug': 'Bug Reports',
      'other': 'Other',
    };
    
    return topics[topicValue] || topicValue;
  };
  
  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-80px)]">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Access Denied</h2>
          <p className="text-muted-foreground">You don't have permission to view this page.</p>
        </div>
      </div>
    );
  }
  
  return (
    <AdminLayout>
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Support Tickets</h1>
        <p className="text-muted-foreground mt-1">
          Manage and respond to user support requests
        </p>
      </div>
      
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Support Tickets</CardTitle>
              <CardDescription>
                Total tickets: {tickets.length}
              </CardDescription>
            </div>
            <Button 
              variant="outline" 
              onClick={fetchTickets} 
              disabled={isLoading}
              className="flex items-center"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : null}
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={currentTab} onValueChange={setCurrentTab}>
            <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center mb-4 gap-4">
              <TabsList>
                <TabsTrigger value="all">
                  All Tickets
                </TabsTrigger>
                <TabsTrigger value="new">
                  New
                </TabsTrigger>
                <TabsTrigger value="in-progress">
                  In Progress
                </TabsTrigger>
                <TabsTrigger value="resolved">
                  Resolved
                </TabsTrigger>
              </TabsList>
              
              <div className="flex flex-col md:flex-row gap-2">
                <div className="relative flex-grow">
                  <Search className="h-4 w-4 absolute left-3 top-3 text-gray-500" />
                  <Input
                    placeholder="Search tickets..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 w-full md:w-[250px]"
                  />
                </div>
                
                <div className="flex gap-2">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="flex gap-2">
                        <SlidersHorizontal className="h-4 w-4" />
                        <span className="hidden sm:inline">Filters</span>
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-80">
                      <div className="space-y-4">
                        <h4 className="font-medium">Filter Tickets</h4>
                        
                        <div className="space-y-2">
                          <Label htmlFor="topic-filter">Topic</Label>
                          <Select value={topicFilter} onValueChange={setTopicFilter}>
                            <SelectTrigger id="topic-filter">
                              <SelectValue placeholder="Filter by topic" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">All Topics</SelectItem>
                              <SelectItem value="account">Account Issues</SelectItem>
                              <SelectItem value="listing">Listing Problems</SelectItem>
                              <SelectItem value="payment">Payment Questions</SelectItem>
                              <SelectItem value="suggestion">Feature Suggestions</SelectItem>
                              <SelectItem value="bug">Bug Reports</SelectItem>
                              <SelectItem value="other">Other</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div className="space-y-2">
                          <Label>Date Range</Label>
                          <div className="grid grid-cols-2 gap-2">
                            <div className="space-y-1">
                              <Label htmlFor="date-from" className="text-xs">From</Label>
                              <Popover>
                                <PopoverTrigger asChild>
                                  <Button
                                    id="date-from"
                                    variant={"outline"}
                                    className="w-full justify-start text-left font-normal"
                                  >
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {dateFrom ? (
                                      format(dateFrom, "MMM d, yyyy")
                                    ) : (
                                      <span>Pick a date</span>
                                    )}
                                  </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0">
                                  <DateRangePicker
                                    mode="single"
                                    selected={dateFrom}
                                    onSelect={setDateFrom}
                                    initialFocus={true}
                                  />
                                </PopoverContent>
                              </Popover>
                            </div>
                            
                            <div className="space-y-1">
                              <Label htmlFor="date-to" className="text-xs">To</Label>
                              <Popover>
                                <PopoverTrigger asChild>
                                  <Button
                                    id="date-to"
                                    variant={"outline"}
                                    className="w-full justify-start text-left font-normal"
                                  >
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {dateTo ? (
                                      format(dateTo, "MMM d, yyyy")
                                    ) : (
                                      <span>Pick a date</span>
                                    )}
                                  </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0">
                                  <DateRangePicker
                                    mode="single"
                                    selected={dateTo}
                                    onSelect={setDateTo}
                                    initialFocus={true}
                                  />
                                </PopoverContent>
                              </Popover>
                            </div>
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <Label>Sort By</Label>
                          <div className="flex gap-2">
                            <Select value={sortField} onValueChange={setSortField}>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="created_at">Date</SelectItem>
                                <SelectItem value="name">Name</SelectItem>
                                <SelectItem value="topic">Topic</SelectItem>
                              </SelectContent>
                            </Select>
                            
                            <Select 
                              value={sortDirection} 
                              onValueChange={(value) => setSortDirection(value as "asc" | "desc")}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="asc">Ascending</SelectItem>
                                <SelectItem value="desc">Descending</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        
                        <div className="flex justify-end pt-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={resetFilters}
                          >
                            Reset Filters
                          </Button>
                        </div>
                      </div>
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
            </div>
            
            <TabsContent value={currentTab} className="space-y-4">
              {isLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                </div>
              ) : filteredTickets.length > 0 ? (
                <div className="border rounded-md overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[100px]">Status</TableHead>
                        <TableHead>Topic</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead className="hidden md:table-cell">Email</TableHead>
                        <TableHead className="w-[150px]">Date</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredTickets.map((ticket) => (
                        <TableRow key={ticket.id} id={`ticket-${ticket.id}`}>
                          <TableCell>{getStatusBadge(ticket.status)}</TableCell>
                          <TableCell>{getTopicName(ticket.topic)}</TableCell>
                          <TableCell>{ticket.name}</TableCell>
                          <TableCell className="hidden md:table-cell">
                            <a 
                              href={`mailto:${ticket.email}`}
                              className="text-[#f74f4f] hover:underline"
                            >
                              {ticket.email}
                            </a>
                          </TableCell>
                          <TableCell>
                            {format(new Date(ticket.created_at), 'MMM d, yyyy')}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={() => handleViewTicket(ticket)}
                              >
                                View Details
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-red-500 hover:text-red-600 hover:bg-red-50"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setTicketToDelete(ticket.id);
                                  setIsDeleteConfirmOpen(true);
                                }}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-8 border rounded-md bg-gray-50">
                  <p className="text-muted-foreground">No tickets found</p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
      
      {/* Ticket Detail Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Support Ticket Details</DialogTitle>
            <DialogDescription>
              View and respond to this support request
            </DialogDescription>
          </DialogHeader>
          
          {selectedTicket && (
            <div className="space-y-6">
              {/* Ticket Information */}
              <div className="bg-gray-50 p-4 rounded-md space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <div className="text-sm text-muted-foreground flex items-center">
                      <User className="h-4 w-4 mr-1" />
                      Name
                    </div>
                    <div className="font-medium">{selectedTicket.name}</div>
                  </div>
                  
                  <div className="space-y-1">
                    <div className="text-sm text-muted-foreground flex items-center">
                      <Mail className="h-4 w-4 mr-1" />
                      Email
                    </div>
                    <div className="font-medium">
                      <a 
                        href={`mailto:${selectedTicket.email}`}
                        className="text-[#f74f4f] hover:underline"
                      >
                        {selectedTicket.email}
                      </a>
                    </div>
                  </div>
                  
                  <div className="space-y-1">
                    <div className="text-sm text-muted-foreground flex items-center">
                      <Tag className="h-4 w-4 mr-1" />
                      Topic
                    </div>
                    <div className="font-medium">{getTopicName(selectedTicket.topic)}</div>
                  </div>
                  
                  <div className="space-y-1">
                    <div className="text-sm text-muted-foreground flex items-center">
                      <Calendar className="h-4 w-4 mr-1" />
                      Date
                    </div>
                    <div className="font-medium">
                      {format(new Date(selectedTicket.created_at), 'MMM d, yyyy h:mm a')}
                    </div>
                  </div>
                </div>
                
                <div>
                  <div className="text-sm text-muted-foreground mb-2">Message</div>
                  <div className="p-3 bg-white border rounded-md whitespace-pre-wrap">
                    {selectedTicket.message}
                  </div>
                </div>
              </div>
              
              {/* Response Form */}
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="font-medium">Ticket Management</h3>
                  <div className="flex items-center gap-2">
                    <Label htmlFor="status">Status:</Label>
                    <Select value={status} onValueChange={setStatus}>
                      <SelectTrigger id="status" className="w-[180px]">
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="new">New</SelectItem>
                        <SelectItem value="in-progress">In Progress</SelectItem>
                        <SelectItem value="resolved">Resolved</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="response">Response</Label>
                  <Textarea
                    id="response"
                    placeholder="Enter your response to this ticket"
                    value={response}
                    onChange={(e) => setResponse(e.target.value)}
                    rows={6}
                  />
                </div>
                
                <div className="flex justify-between">
                  <Button 
                    variant="outline"
                    className="text-red-500 border-red-200 hover:bg-red-50 hover:text-red-600"
                    onClick={() => {
                      setTicketToDelete(selectedTicket.id);
                      setIsDeleteConfirmOpen(true);
                    }}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Ticket
                  </Button>
                  
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      onClick={() => setIsDialogOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button 
                      onClick={handleUpdateTicket}
                      disabled={isSubmitting}
                      className="bg-[#f74f4f] hover:bg-[#e43c3c]"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Send className="mr-2 h-4 w-4" />
                          Save Changes
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
      
      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteConfirmOpen} onOpenChange={setIsDeleteConfirmOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Delete Ticket</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this ticket? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2 pt-4">
            <Button 
              variant="outline" 
              onClick={() => setIsDeleteConfirmOpen(false)}
            >
              Cancel
            </Button>
            <Button 
              variant="destructive"
              onClick={handleDeleteTicket}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete Ticket
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default SupportTickets;
