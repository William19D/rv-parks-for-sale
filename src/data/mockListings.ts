import backgroundImg from "@/assets/background.jpeg";
import softwareImg from "@/assets/software.png";

export interface Listing {
  id: number;
  title: string;
  description: string;
  price: number;
  location: {
    city: string;
    state: string;
    latitude: number;
    longitude: number;
  };
  images: string[];
  numSites: number;
  occupancyRate: number;
  annualRevenue: number;
  capRate: number;
  propertyType: string;
  broker: {
    id: number;
    name: string;
    company: string;
    phone: string;
    email: string;
  };
  createdAt: string;
  featured: boolean;
}

export interface FilterOptions {
  propertyTypes: string[];
  features: string[];
  priceMin: number;
  priceMax: number;
  occupancyRateMin: number;
  revenueMin: number;
  revenueMax: number;
  sitesMin: number;
  sitesMax: number;
  capRateMin: number;
  listedWithinDays: number;
  statesSelected: string[];
  onlyFeatured: boolean;
  onlyWithImages: boolean;
  sortBy: string;
  sortDirection: 'asc' | 'desc';
  search: string;
  state: string;
}

export const states = [
  "Alabama", "Alaska", "Arizona", "Arkansas", "California", "Colorado", "Connecticut", 
  "Delaware", "Florida", "Georgia", "Hawaii", "Idaho", "Illinois", "Indiana", "Iowa", 
  "Kansas", "Kentucky", "Louisiana", "Maine", "Maryland", "Massachusetts", "Michigan", 
  "Minnesota", "Mississippi", "Missouri", "Montana", "Nebraska", "Nevada", "New Hampshire", 
  "New Jersey", "New Mexico", "New York", "North Carolina", "North Dakota", "Ohio", 
  "Oklahoma", "Oregon", "Pennsylvania", "Rhode Island", "South Carolina", "South Dakota", 
  "Tennessee", "Texas", "Utah", "Vermont", "Virginia", "Washington", "West Virginia", 
  "Wisconsin", "Wyoming"
];

// Mock data for listings with asset-based images
export const mockListings: Listing[] = [
  {
    id: 1,
    title: "Sunset RV Resort",
    description: "Beautiful RV resort with stunning sunset views, full hookups, and premium amenities. Located in a prime tourist destination with year-round bookings.",
    price: 2500000,
    location: {
      city: "Sedona",
      state: "Arizona",
      latitude: 34.8697,
      longitude: -111.7610
    },
    images: [
      backgroundImg,
      "https://images.unsplash.com/photo-1544966503-7cc5ac882d5f?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1571863533956-01c88e79957e?auto=format&fit=crop&w=800&q=80"
    ],
    numSites: 120,
    occupancyRate: 85,
    annualRevenue: 1800000,
    capRate: 7.2,
    propertyType: "RV Resort",
    broker: {
      id: 1,
      name: "Sarah Johnson",
      company: "Desert Properties LLC",
      phone: "(555) 123-4567",
      email: "sarah@desertproperties.com"
    },
    createdAt: "2024-01-15",
    featured: true
  },
  {
    id: 2,
    title: "Mountain View Campground",
    description: "Established family campground with mountain views, hiking trails, and recreational facilities. Excellent cash flow and growth potential.",
    price: 1200000,
    location: {
      city: "Asheville",
      state: "North Carolina",
      latitude: 35.5951,
      longitude: -82.5515
    },
    images: [
      softwareImg,
      "https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1517824806704-9040b037703b?auto=format&fit=crop&w=800&q=80"
    ],
    numSites: 75,
    occupancyRate: 70,
    annualRevenue: 850000,
    capRate: 6.8,
    propertyType: "Campground",
    broker: {
      id: 2,
      name: "Mike Thompson",
      company: "Mountain Realty",
      phone: "(555) 987-6543",
      email: "mike@mountainrealty.com"
    },
    createdAt: "2024-01-20",
    featured: false
  },
  {
    id: 3,
    title: "Lakeside RV Park",
    description: "Well-maintained RV park on a beautiful lake, offering fishing, boating, and swimming. High demand and repeat customers.",
    price: 1850000,
    location: {
      city: "Orlando",
      state: "Florida",
      latitude: 28.5383,
      longitude: -81.3792
    },
    images: [
      "https://images.unsplash.com/photo-1568699997478-d9f89c4c81a5?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1519677381594-147eb34a36ca?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1542739675-b983c9110889?auto=format&fit=crop&w=800&q=80"
    ],
    numSites: 90,
    occupancyRate: 78,
    annualRevenue: 1200000,
    capRate: 6.5,
    propertyType: "RV Park",
    broker: {
      id: 3,
      name: "Emily White",
      company: "Sunshine Realty Group",
      phone: "(555) 246-8013",
      email: "emily@sunshinerealty.com"
    },
    createdAt: "2024-01-25",
    featured: true
  },
  {
    id: 4,
    title: "Redwood Forest Campground",
    description: "Secluded campground surrounded by towering redwood trees, offering a unique nature experience. Ideal for outdoor enthusiasts and nature lovers.",
    price: 950000,
    location: {
      city: "Crescent City",
      state: "California",
      latitude: 41.7527,
      longitude: -124.0975
    },
    images: [
      "https://images.unsplash.com/photo-1501785888041-a3ef645ac839?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1470770841072-f978cf4aa366?auto=format&fit=crop&w=800&q=80"
    ],
    numSites: 50,
    occupancyRate: 65,
    annualRevenue: 550000,
    capRate: 6.2,
    propertyType: "Campground",
    broker: {
      id: 4,
      name: "David Green",
      company: "Coastal Properties",
      phone: "(555) 369-9124",
      email: "david@coastalproperties.com"
    },
    createdAt: "2024-02-01",
    featured: false
  },
  {
    id: 5,
    title: "Desert Oasis RV Resort",
    description: "Luxury RV resort in the heart of the desert, featuring a pool, spa, and clubhouse. Perfect for snowbirds and long-term stays.",
    price: 3200000,
    location: {
      city: "Palm Springs",
      state: "California",
      latitude: 33.8303,
      longitude: -116.5453
    },
    images: [
      "https://images.unsplash.com/photo-1519677381594-147eb34a36ca?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1544966503-7cc5ac882d5f?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1571863533956-01c88e79957e?auto=format&fit=crop&w=800&q=80"
    ],
    numSites: 150,
    occupancyRate: 90,
    annualRevenue: 2500000,
    capRate: 7.8,
    propertyType: "RV Resort",
    broker: {
      id: 5,
      name: "Linda Brown",
      company: "Luxury RV Sales",
      phone: "(555) 482-0235",
      email: "linda@luxuryrvsales.com"
    },
    createdAt: "2024-02-05",
    featured: true
  },
  {
    id: 6,
    title: "Seaside Campground",
    description: "Picturesque campground located on the coast, offering beach access and ocean views. Popular destination for summer vacations and weekend getaways.",
    price: 1500000,
    location: {
      city: "Myrtle Beach",
      state: "South Carolina",
      latitude: 33.6891,
      longitude: -78.8867
    },
    images: [
      "https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1517824806704-9040b037703b?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1542739675-b983c9110889?auto=format&fit=crop&w=800&q=80"
    ],
    numSites: 80,
    occupancyRate: 75,
    annualRevenue: 950000,
    capRate: 6.4,
    propertyType: "Campground",
    broker: {
      id: 6,
      name: "Thomas Clark",
      company: "Oceanfront Realty",
      phone: "(555) 593-1346",
      email: "thomas@oceanfrontrealty.com"
    },
    createdAt: "2024-02-10",
    featured: false
  }
];
