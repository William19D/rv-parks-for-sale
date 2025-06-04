import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { supabase } from "@/integrations/supabase/client";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number, decimals: number = 0): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  }).format(amount)
}

// Filter listings based on filter options
export function filterListings(listings: any[], filters: any) {
  return listings.filter(listing => {
    // Text search
    if (filters.search && !listing.title.toLowerCase().includes(filters.search.toLowerCase()) &&
        !listing.description.toLowerCase().includes(filters.search.toLowerCase()) &&
        !listing.location.city.toLowerCase().includes(filters.search.toLowerCase()) &&
        !listing.location.state.toLowerCase().includes(filters.search.toLowerCase())) {
      return false;
    }
    
    // Price range
    if (listing.price < filters.priceMin || listing.price > filters.priceMax) {
      return false;
    }
    
    // State filter
    if (filters.state && listing.location.state !== filters.state) {
      return false;
    }
    
    // Number of sites
    if (listing.numSites < filters.sitesMin || listing.numSites > filters.sitesMax) {
      return false;
    }
    
    // Cap rate
    if (listing.capRate < filters.capRateMin) {
      return false;
    }
    
    return true;
  });
}

/**
 * Creates a unique file path for listing documents
 */
export const createDocumentPath = (listingId: number | string, fileName: string): string => {
  const fileExtension = fileName.split('.').pop() || '';
  const timestamp = Date.now();
  return `listing-${listingId}/${timestamp}-${fileName.replace(/\s+/g, '-')}`;
};

/**
 * Get document file type category
 */
export const getFileTypeCategory = (fileName: string): string => {
  const extension = fileName.split('.').pop()?.toLowerCase() || '';
  
  if (['pdf'].includes(extension)) return 'pdf';
  if (['doc', 'docx'].includes(extension)) return 'word';
  if (['xls', 'xlsx', 'csv'].includes(extension)) return 'excel';
  if (['ppt', 'pptx'].includes(extension)) return 'powerpoint';
  if (['jpg', 'jpeg', 'png', 'gif', 'svg', 'webp'].includes(extension)) return 'image';
  
  return 'other';
};

/**
 * Upload a document to the listing-documents bucket
 */
export const uploadListingDocument = async (
  listingId: number | string,
  file: File,
  isPrimary: boolean = false,
  description: string = ''
): Promise<{success: boolean, data?: any, error?: any}> => {
  try {
    // Upload the file to storage
    const storagePath = createDocumentPath(listingId, file.name);
    
    const { error: uploadError } = await supabase.storage
      .from('listing-documents')
      .upload(storagePath, file);
      
    if (uploadError) throw uploadError;
    
    // Get file type category
    const fileType = getFileTypeCategory(file.name);
    
    // Create a database record
    const { data, error: dbError } = await supabase
      .from('listing_documents')
      .insert({
        listing_id: listingId,
        name: file.name,
        storage_path: storagePath,
        type: fileType,
        size: file.size,
        is_primary: isPrimary,
        description: description
      })
      .select()
      .single();
      
    if (dbError) throw dbError;
    
    // If this is the offering memorandum (primary PDF), update the listing record
    if (isPrimary && fileType === 'pdf') {
      const { error: updateError } = await supabase
        .from('listings')
        .update({ offering_memorandum_path: storagePath })
        .eq('id', listingId);
        
      if (updateError) console.error("Failed to update listing with memorandum path:", updateError);
    }
    
    return { success: true, data };
  } catch (error) {
    console.error("Error uploading document:", error);
    return { success: false, error };
  }
};

/**
 * Delete a document from storage and database
 */
export const deleteListingDocument = async (documentId: number): Promise<boolean> => {
  try {
    // Get the document record
    const { data: document, error: fetchError } = await supabase
      .from('listing_documents')
      .select('storage_path, listing_id, is_primary')
      .eq('id', documentId)
      .single();
      
    if (fetchError) throw fetchError;
    
    // Delete the file from storage
    const { error: storageError } = await supabase
      .storage
      .from('listing-documents')
      .remove([document.storage_path]);
      
    if (storageError) throw storageError;
    
    // If this was the primary document, clear the offering_memorandum_path
    if (document.is_primary) {
      await supabase
        .from('listings')
        .update({ offering_memorandum_path: null })
        .eq('id', document.listing_id);
    }
    
    // Delete the record from the database
    const { error: dbError } = await supabase
      .from('listing_documents')
      .delete()
      .eq('id', documentId);
      
    if (dbError) throw dbError;
    
    return true;
  } catch (error) {
    console.error("Error deleting document:", error);
    return false;
  }
};

/**
 * Get all documents for a listing
 */
export const getListingDocuments = async (listingId: number | string): Promise<any[]> => {
  try {
    const { data, error } = await supabase
      .from('listing_documents')
      .select('*')
      .eq('listing_id', listingId)
      .order('is_primary', { ascending: false })
      .order('created_at', { ascending: false });
      
    if (error) throw error;
    
    // Add public URLs to documents
    return (data || []).map(doc => {
      const { data: publicUrl } = supabase
        .storage
        .from('listing-documents')
        .getPublicUrl(doc.storage_path);
        
      return {
        ...doc,
        url: publicUrl?.publicUrl || ''
      };
    });
  } catch (error) {
    console.error("Error fetching documents:", error);
    return [];
  }
};

// Added timestamp helper for William19D's current time: 2025-06-04 12:40:05
export const getCurrentFormattedDateTime = (): string => {
  const now = new Date();
  
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');
  
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
};