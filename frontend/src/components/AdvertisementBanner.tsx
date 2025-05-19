import React, { useEffect, useState } from 'react';
import apiClient from '../services/api';
import { Card } from "@/components/ui/card"; // Assuming you have a Card component

interface Advertisement {
  id: number;
  title: string;
  content?: string;
  image_url?: string;
  target_url?: string;
  placement_area: string;
}

interface AdvertisementBannerProps {
  placementArea: string;
  className?: string;
}

const AdvertisementBanner: React.FC<AdvertisementBannerProps> = ({ placementArea, className }) => {
  const [ad, setAd] = useState<Advertisement | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAd = async () => {
      setIsLoading(true);
      setError(null);
      try {
        // Fetch a single ad for the placement area (or a list if you want to rotate)
        const response = await apiClient.get<Advertisement[]>(`/advertisements/${placementArea}`);
        if (response.data && response.data.length > 0) {
          // For simplicity, pick the first ad. Implement rotation logic if needed.
          setAd(response.data[0]); 
        }
      } catch (err: any) {
        console.error(`Failed to fetch ad for placement ${placementArea}:`, err);
        // Don't show an error to the user, just don't display the ad
        // setError(err.response?.data?.error || "Falha ao carregar anúncio.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchAd();
  }, [placementArea]);

  const handleAdClick = async () => {
    if (ad && ad.target_url) {
      try {
        await apiClient.post(`/advertisements/${ad.id}/click`);
        window.open(ad.target_url, '_blank', 'noopener,noreferrer');
      } catch (clickError) {
        console.error("Failed to track ad click:", clickError);
        // Still open the target URL even if tracking fails
        window.open(ad.target_url, '_blank', 'noopener,noreferrer');
      }
    }
  };

  if (isLoading) {
    return <div className={`p-2 text-center text-xs text-gray-400 ${className}`}>A carregar publicidade...</div>;
  }

  if (error || !ad) {
    // Silently fail or show a placeholder if desired, but for now, just don't render
    return null; 
  }

  return (
    <Card 
        className={`advertisement-banner p-3 my-4 border border-gray-200 rounded-lg shadow-sm bg-gray-50 ${className}`}
        onClick={handleAdClick}
        style={{ cursor: ad.target_url ? 'pointer' : 'default' }}
    >
      <div className="flex flex-col items-center text-center">
        {ad.image_url ? (
          <img src={ad.image_url} alt={ad.title} className="max-w-full h-auto max-h-48 mb-2 rounded" />
        ) : (
          <h5 className="text-sm font-semibold text-gray-700 mb-1">{ad.title}</h5>
        )}
        {ad.content && <div className="text-xs text-gray-600" dangerouslySetInnerHTML={{ __html: ad.content }} />} 
        {!ad.image_url && !ad.content && ad.title && <p className="text-xs text-gray-500">{ad.title}</p>}
        <p className="text-xxs text-gray-400 mt-1">Publicidade</p>
      </div>
    </Card>
  );
};

export default AdvertisementBanner;

