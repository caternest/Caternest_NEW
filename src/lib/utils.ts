import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const generateSlug = (name: string): string => {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "") // Remove non-word chars
    .replace(/[\s_-]+/g, "-") // Replace spaces/underscores with -
    .replace(/^-+|-+$/g, ""); // Trim leading/trailing dashes
};

export const getCatererSlug = (c: any): string => {
  if (!c) return "";
  const nameToUse = c.brandName || c.businessName || c.name || "";
  if (nameToUse) {
    return generateSlug(nameToUse);
  }
  return c.id || "";
};

export function compressImageFile(file: File, maxWidth = 800, maxHeight = 800, quality = 0.7): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (readerEvent) => {
      const result = readerEvent.target?.result;
      if (typeof result !== 'string') {
        reject(new Error("FileReader result is not a string"));
        return;
      }
      
      const img = new Image();
      img.src = result;
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(result);
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        // Save as jpeg to reduce size significantly
        const compressedBase64 = canvas.toDataURL('image/jpeg', quality);
        resolve(compressedBase64);
      };
      img.onerror = () => {
        resolve(result);
      };
    };
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });
}

/**
 * Safely saves registrations in localStorage with smart cleanup of large/heavy fields to prevent QuotaExceededError.
 */
export function safeSaveRegistrations(registrations: any[]): void {
  try {
    localStorage.setItem('registrations', JSON.stringify(registrations));
  } catch (error: any) {
    const isQuotaError = 
      error.name === "QuotaExceededError" || 
      error.message?.toLowerCase().includes("quota") || 
      error.message?.toLowerCase().includes("exceeded") ||
      error.code === 22;

    if (isQuotaError) {
      console.warn("[QuotaExceededError] localStorage quota exceeded. Cleaning heavy fields from registrations cache.");
      const cleaned = registrations.map((c: any) => {
        const copy = { ...c };
        // Delete large base64 strings or complex nested structures not strictly needed in list views
        delete copy.galleryPhotos;
        delete copy.menuPackages;
        delete copy.packages;
        delete copy.draftMenuPackages;
        delete copy.images;
        
        if (copy.includedItems && typeof copy.includedItems === "object") {
          const incCopy = { ...copy.includedItems };
          delete incCopy._fallback_galleryPhotos;
          delete incCopy._fallback_menuPackages;
          delete incCopy._fallback_packages;
          delete incCopy._fallback_draftMenuPackages;
          delete incCopy._fallback_images;
          copy.includedItems = incCopy;
        }
        return copy;
      });
      
      try {
        localStorage.setItem('registrations', JSON.stringify(cleaned));
        console.log("[QuotaExceededError Handled] Successfully saved minimized registrations cache.");
      } catch (innerErr) {
        console.error("Quota exceeded even after cleaning heavy fields. Purging registrations to prevent app breakage.");
        try {
          localStorage.removeItem('registrations');
        } catch (_) {}
      }
    } else {
      console.error("Failed to write registrations payload to localStorage:", error);
    }
  }
}

