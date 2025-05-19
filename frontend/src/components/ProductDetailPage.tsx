import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import apiClient from '../services/api';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ShoppingBag, ArrowLeft, Tag } from 'lucide-react';
import AdvertisementBanner from './AdvertisementBanner';

interface Product {
  id: number;
  name: string;
  slug: string;
  description?: string;
  price: string;
  stock_quantity: number;
  sku?: string;
  image_url?: string;
  is_active: boolean;
  is_featured: boolean;
  category_id: number;
  category_name?: string;
  created_at: string;
  updated_at: string;
}

const ProductDetailPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const [product, setProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProduct = async () => {
      setIsLoading(true);
      try {
        const response = await apiClient.get<Product>(`/shop/products/${slug}`);
        setProduct(response.data);
        setError(null);
      } catch (err: any) {
        console.error("Failed to fetch product:", err);
        setError(err.response?.data?.error || "Falha ao carregar detalhes do produto.");
      } finally {
        setIsLoading(false);
      }
    };

    if (slug) {
      fetchProduct();
    }
  }, [slug]);

  const formatPrice = (price: string) => {
    return parseFloat(price).toFixed(2) + '€';
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
        <p className="mt-4 text-gray-600">A carregar detalhes do produto...</p>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <div className="bg-red-50 p-6 rounded-lg max-w-2xl mx-auto">
          <h2 className="text-xl font-semibold text-red-700 mb-2">Erro</h2>
          <p className="text-red-600">{error || "Produto não encontrado ou indisponível."}</p>
          <Button asChild className="mt-4">
            <Link to="/shop">
              <ArrowLeft className="mr-2 h-4 w-4" /> Voltar à Loja
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <Button asChild variant="outline">
          <Link to="/shop">
            <ArrowLeft className="mr-2 h-4 w-4" /> Voltar à Loja
          </Link>
        </Button>
      </div>

      {/* Advertisement at top of product detail */}
      <AdvertisementBanner placementArea="product_detail_top" className="mb-6" />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
          {product.image_url ? (
            <img 
              src={product.image_url} 
              alt={product.name} 
              className="w-full h-full object-contain"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gray-200">
              <ShoppingBag className="h-24 w-24 text-gray-400" />
            </div>
          )}
        </div>

        <div>
          <div className="flex items-start justify-between mb-2">
            <h1 className="text-3xl font-bold text-gray-800">{product.name}</h1>
            {product.is_featured && (
              <Badge className="bg-blue-500">Destacado</Badge>
            )}
          </div>

          <Link to={`/shop?category=${product.category_id}`} className="inline-flex items-center text-sm text-blue-600 hover:text-blue-800 mb-4">
            <Tag className="mr-1 h-4 w-4" /> {product.category_name}
          </Link>

          <p className="text-2xl font-bold text-green-600 mb-4">{formatPrice(product.price)}</p>

          <div className="mb-6">
            <h2 className="text-lg font-semibold mb-2">Descrição</h2>
            <p className="text-gray-700">{product.description || "Sem descrição disponível."}</p>
          </div>

          <div className="mb-6">
            <h2 className="text-lg font-semibold mb-2">Disponibilidade</h2>
            <p className="text-gray-700">
              {product.stock_quantity > 0 
                ? `${product.stock_quantity} unidades em stock` 
                : "Sem stock disponível"}
            </p>
          </div>

          {product.sku && (
            <div className="mb-6">
              <h2 className="text-lg font-semibold mb-2">SKU</h2>
              <p className="text-gray-700">{product.sku}</p>
            </div>
          )}

          <Separator className="my-6" />

          <div className="flex space-x-4">
            <Button className="flex-1 bg-green-600 hover:bg-green-700">
              Adicionar ao Carrinho
            </Button>
            <Button variant="outline" className="flex-1">
              Adicionar à Lista de Desejos
            </Button>
          </div>
        </div>
      </div>

      {/* Advertisement at bottom of product detail */}
      <AdvertisementBanner placementArea="product_detail_bottom" className="mt-12" />

      {/* Related products section could be added here */}
    </div>
  );
};

export default ProductDetailPage;
